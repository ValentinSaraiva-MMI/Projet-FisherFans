const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

// Chemin vers la base
const dbPath = path.resolve(__dirname, "../../fisherfans.db");

// Connexion
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erreur SQLite :", err.message);
  } else {
    console.log("✅ Connecté à la base de données SQLite.");
    initDb();
  }
});

// Init DB
function initDb() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      statut TEXT DEFAULT 'particulier',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createBoatsTable = `
    CREATE TABLE IF NOT EXISTS boats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
  ;`;

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error("❌ Erreur création table users :", err.message);
      return;
    }

    console.log("✅ Table 'users' prête.");

    // Seed admin (hashé)
    const hash = bcrypt.hashSync("admin123", 10);

    const insertAdmin = `
      INSERT OR IGNORE INTO users (nom, prenom, email, password, statut)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
      insertAdmin,
      ["Pastorelli", "Laurent", "laurent@bluebeacon.fr", hash, "particulier"],
      (err) => {
        if (err) console.error("❌ Erreur seed admin :", err.message);
      }
    );
  });
}

module.exports = db;
