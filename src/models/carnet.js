const db = require("../config/db");

const dbGet = (sql, params = []) =>
  new Promise((res, rej) => db.get(sql, params, (e, r) => (e ? rej(e) : res(r))));
const dbAll = (sql, params = []) =>
  new Promise((res, rej) => db.all(sql, params, (e, r) => (e ? rej(e) : res(r))));
const dbRun = (sql, params = []) =>
  new Promise((res, rej) =>
    db.run(sql, params, function (e) {
      e ? rej(e) : res({ lastID: this.lastID, changes: this.changes });
    })
  );

exports.list = async ({ utilisateurId, limit, offset }) => {
  let where = [];
  let params = [];

  if (utilisateurId) {
    where.push("utilisateur_id=?");
    params.push(utilisateurId);
  }

  const sql = `
    SELECT * FROM carnets
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);
  return dbAll(sql, params);
};

exports.getById = (id) => dbGet(`SELECT * FROM carnets WHERE id=?`, [id]);

exports.create = async (c) => {
  const r = await dbRun(
    `INSERT INTO carnets (
      nom_poisson, url_photo_poisson, commentaire, taille, poids,
      lieu_peche, date_peche, poisson_relache, utilisateur_id
    ) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      c.nom_poisson ?? null,
      c.url_photo_poisson ?? null,
      c.commentaire ?? null,
      c.taille ?? null,
      c.poids ?? null,
      c.lieu_peche ?? null,
      c.date_peche ?? null,
      c.poisson_relache ?? 0, // SQLite: 0/1
      c.utilisateur_id,
    ]
  );
  return exports.getById(r.lastID);
};

exports.patch = async (id, patch) => {
  await dbRun(
    `UPDATE carnets SET
      nom_poisson = COALESCE(?, nom_poisson),
      url_photo_poisson = COALESCE(?, url_photo_poisson),
      commentaire = COALESCE(?, commentaire),
      taille = COALESCE(?, taille),
      poids = COALESCE(?, poids),
      lieu_peche = COALESCE(?, lieu_peche),
      date_peche = COALESCE(?, date_peche),
      poisson_relache = COALESCE(?, poisson_relache)
     WHERE id=?`,
    [
      patch.nom_poisson ?? null,
      patch.url_photo_poisson ?? null,
      patch.commentaire ?? null,
      patch.taille ?? null,
      patch.poids ?? null,
      patch.lieu_peche ?? null,
      patch.date_peche ?? null,
      patch.poisson_relache ?? null, // accepte 0/1 ou true/false selon ton code
      id,
    ]
  );
  return exports.getById(id);
};

exports.remove = async (id) => {
  const r = await dbRun(`DELETE FROM carnets WHERE id=?`, [id]);
  return r.changes > 0;
};
