const Sortie = require("../models/sortie");
const db = require("../config/db");

const dbGet = (sql, params=[]) => new Promise((res, rej)=>db.get(sql, params, (e,r)=>e?rej(e):res(r)));

const clamp = (v, d, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(+v) ? parseInt(v, 10) : d));

exports.list = async (req, res) => {
  const limit = clamp(req.query.limit, 20, 1, 200);
  const offset = clamp(req.query.offset, 0, 0, 1_000_000);
  const dateFrom = req.query.dateFrom || null;
  const dateTo = req.query.dateTo || null;
  const bateauId = req.query.bateauId ? parseInt(req.query.bateauId, 10) : null;

  const rows = await Sortie.list({ dateFrom, dateTo, bateauId, limit, offset });
  res.json(rows);
};

exports.create = async (req, res) => {
  const organiserId = req.user.sub;
  const b = req.body || {};

  // BF26 : doit posséder au moins un bateau
  const hasBoat = await dbGet(`SELECT 1 FROM bateaux WHERE proprietaire_id=? LIMIT 1`, [organiserId]);
  if (!hasBoat) return res.status(403).json({ code: "BF26", message: "Vous devez posséder un bateau" });

  if (!b.titre || !b.nb_passagers || !b.bateau_id) {
    return res.status(400).json({ code: "ERR_VALID", message: "titre, nb_passagers, bateau_id requis" });
  }

  // sécurité : le bateau doit appartenir à l’organisateur
  const boat = await dbGet(`SELECT id, proprietaire_id FROM bateaux WHERE id=?`, [b.bateau_id]);
  if (!boat) return res.status(404).json({ code: "ERR_404", message: "Bateau introuvable" });
  if (boat.proprietaire_id !== organiserId) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Bateau non autorisé" });
  }

  const created = await Sortie.create({ ...b, organisateur_id: organiserId });
  return res.status(201).json(created);
};

exports.get = async (req, res) => {
  const row = await Sortie.getById(parseInt(req.params.id, 10));
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  res.json(row);
};

exports.patch = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await Sortie.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  if (row.organisateur_id !== req.user.sub) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
  }
  const updated = await Sortie.patch(id, req.body || {});
  res.json(updated);
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await Sortie.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  if (row.organisateur_id !== req.user.sub) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
  }
  await Sortie.remove(id);
  res.status(204).send();
};
