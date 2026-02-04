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

exports.list = async ({ sortieId, utilisateurId, limit, offset }) => {
  let where = [];
  let params = [];

  if (sortieId) { where.push("sortie_peche_id=?"); params.push(sortieId); }
  if (utilisateurId) { where.push("utilisateur_id=?"); params.push(utilisateurId); }

  const sql = `
    SELECT * FROM reservations
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);
  return dbAll(sql, params);
};

exports.getById = (id) => dbGet(`SELECT * FROM reservations WHERE id=?`, [id]);

exports.countBySortie = (sortieId) =>
  dbGet(`SELECT COUNT(*) AS cnt FROM reservations WHERE sortie_peche_id=?`, [sortieId]);

exports.create = async ({ sortie_peche_id, utilisateur_id }) => {
  const r = await dbRun(
    `INSERT INTO reservations (sortie_peche_id, utilisateur_id) VALUES (?,?)`,
    [sortie_peche_id, utilisateur_id]
  );
  return exports.getById(r.lastID);
};

exports.remove = async (id) => {
  const r = await dbRun(`DELETE FROM reservations WHERE id=?`, [id]);
  return r.changes > 0;
};
