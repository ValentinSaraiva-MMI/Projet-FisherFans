const db = require("../config/db");

const dbGet = (sql, params=[]) => new Promise((res, rej)=>db.get(sql, params, (e,r)=>e?rej(e):res(r)));
const dbAll = (sql, params=[]) => new Promise((res, rej)=>db.all(sql, params, (e,r)=>e?rej(e):res(r)));
const dbRun = (sql, params=[]) => new Promise((res, rej)=>db.run(sql, params, function(e){e?rej(e):res({lastID:this.lastID, changes:this.changes})}));

exports.list = async ({ dateFrom, dateTo, bateauId, limit, offset }) => {
  const where = [];
  const params = [];

  if (bateauId) { where.push("bateau_id=?"); params.push(bateauId); }
  if (dateFrom) { where.push("date_debut >= ?"); params.push(dateFrom); }
  if (dateTo) { where.push("date_fin <= ?"); params.push(dateTo); }

  const sql = `
    SELECT * FROM sorties
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);
  return dbAll(sql, params);
};

exports.getById = (id) => dbGet(`SELECT * FROM sorties WHERE id=?`, [id]);

exports.create = async (s) => {
  const r = await dbRun(
    `INSERT INTO sorties (
      titre, infos_pratiques, type_sortie, type_tarif,
      date_debut, date_fin, heure_depart, heure_fin,
      nb_passagers, prix_sortie, bateau_id, organisateur_id
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      s.titre, s.infos_pratiques ?? null, s.type_sortie ?? null, s.type_tarif ?? null,
      s.date_debut ?? null, s.date_fin ?? null, s.heure_depart ?? null, s.heure_fin ?? null,
      s.nb_passagers, s.prix_sortie ?? 0, s.bateau_id, s.organisateur_id
    ]
  );
  return exports.getById(r.lastID);
};

exports.patch = async (id, patch) => {
  await dbRun(
    `UPDATE sorties SET
      titre = COALESCE(?, titre),
      nb_passagers = COALESCE(?, nb_passagers),
      prix_sortie = COALESCE(?, prix_sortie)
     WHERE id=?`,
    [patch.titre ?? null, patch.nb_passagers ?? null, patch.prix_sortie ?? null, id]
  );
  return exports.getById(id);
};

exports.remove = async (id) => {
  const r = await dbRun(`DELETE FROM sorties WHERE id=?`, [id]);
  return r.changes > 0;
};
