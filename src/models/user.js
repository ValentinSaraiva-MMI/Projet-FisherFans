const db = require("../config/db");

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    })
  );

exports.list = async ({ q, limit, offset }) => {
  const base = `
    SELECT
      id, nom, prenom,
      date_naissance, email AS mail, telephone, adresse, code_postal,
      langues_parlees, url_photo, numero_permis_bateau,
      statut, nom_societe, num_siret, num_rc
    FROM users
  `;
  if (q) {
    return dbAll(
      base +
        ` WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ?
          ORDER BY id DESC LIMIT ? OFFSET ?`,
      [`%${q}%`, `%${q}%`, `%${q}%`, limit, offset]
    );
  }
  return dbAll(base + ` ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]);
};

exports.getById = (id) =>
  dbGet(
    `SELECT
      id, nom, prenom,
      date_naissance, email AS mail, telephone, adresse, code_postal,
      langues_parlees, url_photo, numero_permis_bateau,
      statut, nom_societe, num_siret, num_rc
     FROM users WHERE id=?`,
    [id]
  );

exports.getAuthByEmail = (email) =>
  dbGet(`SELECT id, email, password, statut FROM users WHERE email=?`, [email]);

exports.getByIdPrivate = (id) =>
  dbGet(
    `SELECT id, email, numero_permis_bateau, statut FROM users WHERE id=?`,
    [id]
  );

exports.create = async ({
  nom,
  prenom,
  mail,
  passwordHash,
  date_naissance,
  telephone,
  adresse,
  code_postal,
  langues_parlees,
  url_photo,
  numero_permis_bateau,
  statut,
  nom_societe,
  num_siret,
  num_rc
}) => {
  const r = await dbRun(
    `INSERT INTO users (
      nom, prenom, email, password,
      date_naissance, telephone, adresse, code_postal,
      langues_parlees, url_photo, numero_permis_bateau,
      statut, nom_societe, num_siret, num_rc
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      nom,
      prenom,
      mail,
      passwordHash,
      date_naissance ?? null,
      telephone ?? null,
      adresse ?? null,
      code_postal ?? null,
      langues_parlees ?? null,
      url_photo ?? null,
      numero_permis_bateau ?? null,
      statut ?? "particulier",
      nom_societe ?? null,
      num_siret ?? null,
      num_rc ?? null
    ]
  );
  return exports.getById(r.lastID);
};

exports.patch = async (id, patch) => {
  // YAML UtilisateurUpdate: nom, prenom, url_photo, numero_permis_bateau
  await dbRun(
    `UPDATE users SET
      nom = COALESCE(?, nom),
      prenom = COALESCE(?, prenom),
      url_photo = COALESCE(?, url_photo),
      numero_permis_bateau = COALESCE(?, numero_permis_bateau)
     WHERE id=?`,
    [
      patch.nom ?? null,
      patch.prenom ?? null,
      patch.url_photo ?? null,
      patch.numero_permis_bateau ?? null,
      id
    ]
  );
  return exports.getById(id);
};

exports.anonymize = async (id) => {
  const anonMail = `anonyme+${id}@fisherfans.local`;
  const r = await dbRun(
    `UPDATE users SET
      nom='ANONYME',
      prenom='ANONYME',
      email=?,
      password='__ANON__',
      telephone=NULL,
      adresse=NULL,
      code_postal=NULL,
      langues_parlees=NULL,
      url_photo=NULL,
      numero_permis_bateau=NULL,
      nom_societe=NULL,
      num_siret=NULL,
      num_rc=NULL,
      statut='ANONYMIZED'
     WHERE id=?`,
    [anonMail, id]
  );
  return r.changes > 0;
};
