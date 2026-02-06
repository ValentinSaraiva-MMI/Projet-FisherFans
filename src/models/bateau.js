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

// (sécurité) validation minimale bbox côté modèle, au cas où
const normalizeBBox = (bbox) => {
  if (!bbox) return null;

  let minLon, minLat, maxLon, maxLat;

  if (typeof bbox === "string") {
    const parts = bbox.split(",").map((x) => Number(x.trim()));
    if (parts.length !== 4 || !parts.every(Number.isFinite)) return null;
    [minLon, minLat, maxLon, maxLat] = parts;
  } else if (typeof bbox === "object") {
    minLon = Number(bbox.minLon);
    minLat = Number(bbox.minLat);
    maxLon = Number(bbox.maxLon);
    maxLat = Number(bbox.maxLat);
    if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite)) return null;
  } else {
    return null;
  }

  const lonOk = minLon >= -180 && minLon <= 180 && maxLon >= -180 && maxLon <= 180;
  const latOk = minLat >= -90 && minLat <= 90 && maxLat >= -90 && maxLat <= 90;
  if (!lonOk || !latOk || minLon > maxLon || minLat > maxLat) return null;

  return { minLon, minLat, maxLon, maxLat };
};

exports.list = async ({ proprietaireId, bbox, limit, offset }) => {
  const where = [];
  const params = [];

  if (proprietaireId) {
    where.push("proprietaire_id = ?");
    params.push(proprietaireId);
  }

  const bb = normalizeBBox(bbox);
  if (bbox && !bb) {
    // si quelqu'un bypass le controller, on préfère une erreur claire
    const err = new Error("ERR_BBOX_INVALID");
    err.code = "ERR_BBOX_INVALID";
    throw err;
  }

  if (bb) {
    // IMPORTANT : lon = X, lat = Y
    where.push("longitude_port_attache BETWEEN ? AND ?");
    where.push("latitude_port_attache BETWEEN ? AND ?");
    params.push(bb.minLon, bb.maxLon, bb.minLat, bb.maxLat);
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

exports.getById = (id) => dbGet(`SELECT * FROM bateaux WHERE id = ?`, [id]);

exports.create = async (b) => {
  const r = await dbRun(
    `INSERT INTO bateaux (
      nom, description, marque, annee_fabrication, url_photo_bateau,
      type_permis_requis, equipements, montant_caution, capacite_max,
      nb_couchages, port_attache, latitude_port_attache, longitude_port_attache,
      type_motorisation, puissance_moteur, proprietaire_id
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.nom,
      b.description ?? null,
      b.marque ?? null,
      b.annee_fabrication ?? null,
      b.url_photo_bateau ?? null,
      b.type_permis_requis ?? null,
      b.equipements ?? null,
      b.montant_caution ?? null,
      b.capacite_max ?? null,
      b.nb_couchages ?? null,
      b.port_attache ?? null,
      b.latitude_port_attache ?? null,
      b.longitude_port_attache ?? null,
      b.type_motorisation ?? null,
      b.puissance_moteur ?? null,
      b.proprietaire_id,
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
     WHERE id = ?`,
    [patch.nom ?? null, patch.description ?? null, patch.capacite_max ?? null, id]
  );

  return exports.getById(id);
};

exports.remove = async (id) => {
  const r = await dbRun(`DELETE FROM bateaux WHERE id = ?`, [id]);
  return r.changes > 0;
};
