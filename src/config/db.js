const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.resolve(__dirname, "../../fisherfans.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Erreur SQLite :", err.message);
  else {
    console.log("✅ Connecté à la base de données SQLite.");
    initDb();
  }
});

// helpers
const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    })
  );

  
const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

async function ensureColumns(table, columns) {
  const infos = await all(`PRAGMA table_info(${table})`);
  const existing = new Set(infos.map((c) => c.name));
  for (const c of columns) {
    if (!existing.has(c.name)) {
      await run(`ALTER TABLE ${table} ADD COLUMN ${c.name} ${c.type}`);
    }
  }
}

async function initDb() {
  // USERS (minimal)
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      statut TEXT DEFAULT 'particulier',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ajout colonnes "YAML" manquantes
  await ensureColumns("users", [
    { name: "date_naissance", type: "TEXT" },
    { name: "telephone", type: "TEXT" },
    { name: "adresse", type: "TEXT" },
    { name: "code_postal", type: "INTEGER" },
    { name: "langues_parlees", type: "TEXT" },
    { name: "url_photo", type: "TEXT" },
    { name: "numero_permis_bateau", type: "INTEGER" },
    { name: "nom_societe", type: "TEXT" },
    { name: "num_siret", type: "TEXT" },
    { name: "num_rc", type: "INTEGER" }
  ]);

  // BATEAUX
  await run(`
    CREATE TABLE IF NOT EXISTS bateaux (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      description TEXT,
      marque TEXT,
      annee_fabrication INTEGER,
      url_photo_bateau TEXT,
      type_permis_requis TEXT,
      equipements TEXT,
      montant_caution INTEGER,
      capacite_max INTEGER,
      nb_couchages INTEGER,
      port_attache TEXT,
      latitude_port_attache REAL,
      longitude_port_attache REAL,
      type_motorisation TEXT,
      puissance_moteur INTEGER,
      proprietaire_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(proprietaire_id) REFERENCES users(id)
    )
  `);

  // SORTIES
  await run(`
    CREATE TABLE IF NOT EXISTS sorties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      infos_pratiques TEXT,
      type_sortie TEXT,
      type_tarif TEXT,
      date_debut TEXT,
      date_fin TEXT,
      heure_depart TEXT,
      heure_fin TEXT,
      nb_passagers INTEGER NOT NULL,
      prix_sortie INTEGER DEFAULT 0,
      bateau_id INTEGER NOT NULL,
      organisateur_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bateau_id) REFERENCES bateaux(id),
      FOREIGN KEY(organisateur_id) REFERENCES users(id)
    )
  `);

    // CARNETS
  await run(`
    CREATE TABLE IF NOT EXISTS carnets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom_poisson TEXT,
      url_photo_poisson TEXT,
      commentaire TEXT,
      taille INTEGER CHECK (taille >= 0),
      poids INTEGER CHECK (poids >= 0),
      lieu_peche TEXT,
      date_peche TEXT,              -- format YYYY-MM-DD
      poisson_relache INTEGER DEFAULT 0, -- SQLite: 0/1
      utilisateur_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(utilisateur_id) REFERENCES users(id)
    )
  `);

  // RESERVATIONS
await run(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sortie_peche_id INTEGER NOT NULL,
    utilisateur_id INTEGER NOT NULL,
    statut TEXT DEFAULT 'confirmee', -- optionnel
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sortie_peche_id) REFERENCES sorties(id) ON DELETE CASCADE,
    FOREIGN KEY(utilisateur_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(sortie_peche_id, utilisateur_id) -- empêche double réservation
  )
`);

    await ensureColumns("carnets", [
    { name: "nom_poisson", type: "TEXT" },
    { name: "url_photo_poisson", type: "TEXT" },
    { name: "commentaire", type: "TEXT" },
    { name: "taille", type: "INTEGER" },
    { name: "poids", type: "INTEGER" },
    { name: "lieu_peche", type: "TEXT" },
    { name: "date_peche", type: "TEXT" },
    { name: "poisson_relache", type: "INTEGER DEFAULT 0" },
    { name: "utilisateur_id", type: "INTEGER" }
  ]);


  console.log("✅ Tables prêtes.");

  // Seed admin hashé
  const hash = bcrypt.hashSync("admin123", 10);
  await run(
    `INSERT OR IGNORE INTO users (nom, prenom, email, password, statut)
     VALUES (?, ?, ?, ?, ?)`,
    ["Pastorelli", "Laurent", "laurent@bluebeacon.fr", hash, "particulier"]
  );
}

module.exports = db;
