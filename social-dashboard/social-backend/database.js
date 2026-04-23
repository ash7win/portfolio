const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "posts.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    caption TEXT NOT NULL,
    hashtags TEXT,
    tone TEXT,
    status TEXT DEFAULT 'draft',
    image TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

module.exports = {
  getAllPosts: () => {
    return db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
  },

  savePost: (post) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO posts (id, caption, hashtags, tone, status, image, created_at)
      VALUES (@id, @caption, @hashtags, @tone, @status, @image, @created_at)
    `);
    stmt.run({
      id: post.id,
      caption: post.caption,
      hashtags: post.hashtags || "",
      tone: post.tone || "",
      status: post.status || "draft",
      image: post.image || null,
      created_at: post.created_at || new Date().toISOString(),
    });
  },

  updatePost: (id, fields) => {
    const allowed = ["status", "image", "caption", "hashtags", "instagram_id"];
    const updates = Object.keys(fields)
      .filter((k) => allowed.includes(k))
      .map((k) => `${k} = @${k}`)
      .join(", ");
    if (!updates) return;
    const stmt = db.prepare(`UPDATE posts SET ${updates} WHERE id = @id`);
    stmt.run({ ...fields, id });
  },

  deletePost: (id) => {
    db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  },

  getPostCount: () => {
    return db.prepare("SELECT COUNT(*) as count FROM posts").get().count;
  },

  deleteOldestIfOver: (limit) => {
    const count = db.prepare("SELECT COUNT(*) as count FROM posts").get().count;
    if (count > limit) {
      db.prepare(`
        DELETE FROM posts WHERE id IN (
          SELECT id FROM posts ORDER BY created_at ASC LIMIT ?
        )
      `).run(count - limit);
    }
  },
};