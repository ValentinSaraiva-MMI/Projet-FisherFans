// connexion à la base de données

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Création du chemin vers le fichier .sqlite
const dbPath = path.resolve(__dirname, "../../fisherfans.db");

// Connexion à la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(
      "Erreur de connexion à la base de données SQLite :",
      err.message
    );
  } else {
    console.log("Connecté à la base de données SQLite.");
    initDb();
  }
});

// Fonction pour initialiser les tables
function initDb() {
  // Création de la table 'users' selon l'Annexe 1
  // Note : J'ai mis les champs essentiels pour commencer, tu pourras ajouter les autres (adresse, permis, etc.) plus tard.
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, -- Nécessaire pour l'authentification (BF1)
      statut TEXT DEFAULT 'particulier', -- 'particulier' ou 'professionnel' [cite: 169]
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error(
        "Erreur lors de la création de la table users :",
        err.message
      );
    } else {
      console.log("Table 'users' prête.");

      // (Optionnel) Insérer un utilisateur de test si la table est vide
      const insertDefaultUser = `INSERT OR IGNORE INTO users (nom, prenom, email, password) VALUES (?, ?, ?, ?)`;
      db.run(insertDefaultUser, [
        "Pastorelli",
        "Laurent",
        "laurent@bluebeacon.fr",
        "admin123",
      ]);
    }
  });
}

module.exports = db;
