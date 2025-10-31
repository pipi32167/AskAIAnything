// SQLite 数据库管理模块
let SQL = null;
let db = null;

// 初始化数据库
async function initDB() {
  if (db) return db;

  try {
    // 加载 sql.js
    SQL = await initSqlJs({
      locateFile: (file) => chrome.runtime.getURL(file),
    });

    // 尝试从 chrome.storage 加载已有数据库
    const data = await chrome.storage.local.get(["sqliteDb"]);

    if (data.sqliteDb) {
      // 从存储的 Uint8Array 恢复数据库
      db = new SQL.Database(new Uint8Array(data.sqliteDb));
      console.log("数据库已从存储加载");
    } else {
      // 创建新数据库
      db = new SQL.Database();
      console.log("创建新数据库");
    }

    // 创建表结构
    createTables();

    return db;
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  }
}

// 创建表结构
function createTables() {
  if (!db) throw new Error("数据库未初始化");

  // 创建历史记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      explanation TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      timestamp_display TEXT,
      prompt_name TEXT,
      source_info TEXT,
      page_url TEXT,
      page_title TEXT,
      context_type TEXT DEFAULT 'text',
      image_data TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // 创建索引
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_timestamp ON history(timestamp DESC)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_context_type ON history(context_type)"
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_prompt_name ON history(prompt_name)"
  );

  console.log("数据库表已创建");
}

// 保存数据库到 chrome.storage
async function saveDB() {
  if (!db) return;

  try {
    // 导出数据库为 Uint8Array
    const data = db.export();
    // 转换为普通数组以便存储
    const dataArray = Array.from(data);

    // 保存到 chrome.storage.local
    await chrome.storage.local.set({ sqliteDb: dataArray });
    console.log("数据库已保存到存储");
  } catch (error) {
    console.error("保存数据库失败:", error);
    throw error;
  }
}

// 添加历史记录
async function addHistory(historyItem) {
  if (!db) await initDB();

  try {
    // 将时间戳字符串转换为 Unix 时间戳
    const timestamp = new Date(historyItem.timestamp).getTime();

    const stmt = db.prepare(`
      INSERT INTO history (
        text, explanation, timestamp, timestamp_display,
        prompt_name, source_info, page_url, page_title,
        context_type, image_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      historyItem.text,
      historyItem.explanation,
      timestamp,
      historyItem.timestamp,
      historyItem.promptName,
      historyItem.sourceInfo,
      historyItem.pageUrl,
      historyItem.pageTitle,
      historyItem.contextType || "text",
      historyItem.imageData || null,
    ]);

    stmt.free();

    // 保存数据库
    await saveDB();

    console.log("历史记录已添加");
  } catch (error) {
    console.error("添加历史记录失败:", error);
    throw error;
  }
}

// 获取所有历史记录
async function getAllHistory(limit = null) {
  if (!db) await initDB();

  try {
    const query = limit
      ? `SELECT * FROM history ORDER BY timestamp DESC LIMIT ${limit}`
      : "SELECT * FROM history ORDER BY timestamp DESC";

    const results = db.exec(query);

    if (results.length === 0) return [];

    // 转换为对象数组
    const columns = results[0].columns;
    const values = results[0].values;

    return values.map((row) => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });

      // 转换回原始格式
      return {
        text: obj.text,
        explanation: obj.explanation,
        timestamp: obj.timestamp_display,
        promptName: obj.prompt_name,
        sourceInfo: obj.source_info,
        pageUrl: obj.page_url,
        pageTitle: obj.page_title,
        contextType: obj.context_type,
        imageData: obj.image_data,
        id: obj.id,
      };
    });
  } catch (error) {
    console.error("获取历史记录失败:", error);
    return [];
  }
}

// 删除历史记录
async function deleteHistory(id) {
  if (!db) await initDB();

  try {
    const stmt = db.prepare("DELETE FROM history WHERE id = ?");
    stmt.run([id]);
    stmt.free();

    await saveDB();
    console.log("历史记录已删除:", id);
  } catch (error) {
    console.error("删除历史记录失败:", error);
    throw error;
  }
}

// 清空所有历史记录
async function clearAllHistory() {
  if (!db) await initDB();

  try {
    db.run("DELETE FROM history");
    await saveDB();
    console.log("所有历史记录已清空");
  } catch (error) {
    console.error("清空历史记录失败:", error);
    throw error;
  }
}

// 搜索历史记录
async function searchHistory(searchQuery, promptFilter = null) {
  if (!db) await initDB();

  try {
    let query = "SELECT * FROM history WHERE 1=1";
    const params = [];

    // 添加提示词过滤
    if (promptFilter) {
      query += " AND prompt_name = ?";
      params.push(promptFilter);
    }

    // 添加关键词搜索
    if (searchQuery) {
      query +=
        " AND (text LIKE ? OR explanation LIKE ? OR prompt_name LIKE ? OR source_info LIKE ? OR page_title LIKE ?)";
      const searchTerm = `%${searchQuery}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY timestamp DESC";

    const stmt = db.prepare(query);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        text: row.text,
        explanation: row.explanation,
        timestamp: row.timestamp_display,
        promptName: row.prompt_name,
        sourceInfo: row.source_info,
        pageUrl: row.page_url,
        pageTitle: row.page_title,
        contextType: row.context_type,
        imageData: row.image_data,
        id: row.id,
      });
    }

    stmt.free();
    return results;
  } catch (error) {
    console.error("搜索历史记录失败:", error);
    return [];
  }
}

// 迁移旧数据
async function migrateOldData() {
  try {
    // 从 chrome.storage 获取旧的历史记录
    const data = await chrome.storage.local.get(["history"]);

    if (!data.history || data.history.length === 0) {
      console.log("没有需要迁移的旧数据");
      return;
    }

    console.log(`开始迁移 ${data.history.length} 条历史记录...`);

    // 初始化数据库
    await initDB();

    // 批量插入数据
    for (const item of data.history) {
      await addHistory(item);
    }

    // 备份旧数据
    await chrome.storage.local.set({ history_backup: data.history });

    // 删除旧数据（可选）
    // await chrome.storage.local.remove(['history']);

    console.log("数据迁移完成");
  } catch (error) {
    console.error("数据迁移失败:", error);
    throw error;
  }
}

// 获取唯一的提示词名称列表
async function getUniquePromptNames() {
  if (!db) await initDB();

  try {
    const results = db.exec(
      "SELECT DISTINCT prompt_name FROM history WHERE prompt_name IS NOT NULL AND prompt_name != '' ORDER BY prompt_name"
    );

    if (results.length === 0) return [];

    return results[0].values.map((row) => row[0]);
  } catch (error) {
    console.error("获取提示词列表失败:", error);
    return [];
  }
}

// 导出函数
window.dbManager = {
  initDB,
  addHistory,
  getAllHistory,
  deleteHistory,
  clearAllHistory,
  searchHistory,
  migrateOldData,
  getUniquePromptNames,
  saveDB,
};
