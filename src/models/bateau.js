const db = require("../config/db");

const dbGet = (sql, params=[]) => new Promise((res, rej)=>db.get(sql, params, (e,r)=>e?rej(e):res(r)));
const dbAll = (sql, params=[]) => new Promise((res, rej)=>db.all(sql, params, (e,r)=>e?rej(e):res(r)));
const dbRun = (sql, params=[]) => new Promise((res, rej)=>db.run(sql, params, function(e){e?rej(e):res({lastID:this.lastID, changes:this.changes})}));

exports.list = async ({ proprietaireId, bbox, limit, offset }) => {
  let where = [];
  let params = [];

  if (proprietaireId) { where.push("proprietaire_id=?"); params.push(proprietaireId); }

  if (bbox) {
    const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
    where.push("longitude_port_attache BETWEEN ? AND ?");
    where.push("latitude_port_attache BETWEEN ? AND ?");
    params.push(minLon, maxLon, minLat, maxLat);
  }

  const sql = `
    SELECT * FROM bateaux
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);
  return dbAll(sql, params);
};

exports.getById = (id) => dbGet(`SELECT * FROM bateaux WHERE id=?`, [id]);

exports.create = async (b) => {
  const r = await dbRun(
    `INSERT INTO bateaux (
      nom, description, marque, annee_fabrication, url_photo_bateau,
      type_permis_requis, equipements, montant_caution, capacite_max,
      nb_couchages, port_attache, latitude_port_attache, longitude_port_attache,
      type_motorisation, puissance_moteur, proprietaire_id
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.nom, b.description ?? null, b.marque ?? null, b.annee_fabrication ?? null, b.url_photo_bateau ?? null,
      b.type_permis_requis ?? null, b.equipements ?? null, b.montant_caution ?? null, b.capacite_max ?? null,
      b.nb_couchages ?? null, b.port_attache ?? null, b.latitude_port_attache ?? null, b.longitude_port_attache ?? null,
      b.type_motorisation ?? null, b.puissance_moteur ?? null, b.proprietaire_id
    ]
  );
  return exports.getById(r.lastID);
};

exports.patch = async (id, patch) => {
  await dbRun(
    `UPDATE bateaux SET
      nom = COALESCE(?, nom),
      description = COALESCE(?, description),
      capacite_max = COALESCE(?, capacite_max)
     WHERE id=?`,
    [patch.nom ?? null, patch.description ?? null, patch.capacite_max ?? null, id]
  );
  return exports.getById(id);
};

exports.remove = async (id) => {
  const r = await dbRun(`DELETE FROM bateaux WHERE id=?`, [id]);
  return r.changes > 0;
};
