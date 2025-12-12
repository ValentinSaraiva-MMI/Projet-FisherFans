const Bateau = require("../models/bateau");
const User = require("../models/user");

const clamp = (v, d, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(+v) ? parseInt(v, 10) : d));

exports.list = async (req, res) => {
  const limit = clamp(req.query.limit, 20, 1, 200);
  const offset = clamp(req.query.offset, 0, 0, 1_000_000);
  const proprietaireId = req.query.proprietaireId ? parseInt(req.query.proprietaireId, 10) : null;
  const bbox = req.query.bbox || null;

  const rows = await Bateau.list({ proprietaireId, bbox, limit, offset });
  res.json(rows);
};

exports.create = async (req, res) => {
  const ownerId = req.user.sub;

  // BF27 : permis obligatoire
  const me = await User.getByIdPrivate(ownerId);
  if (!me?.numero_permis_bateau) {
    return res.status(403).json({ code: "BF27", message: "Permis bateau requis" });
  }

  const b = req.body || {};
  if (!b.nom) return res.status(400).json({ code: "ERR_VALID", message: "nom requis" });

  const created = await Bateau.create({ ...b, proprietaire_id: ownerId });
  return res.status(201).json(created);
};

exports.get = async (req, res) => {
  const row = await Bateau.getById(parseInt(req.params.id, 10));
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  res.json(row);
};

exports.patch = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await Bateau.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });

  // ownership
  if (row.proprietaire_id !== req.user.sub) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
  }

  const updated = await Bateau.patch(id, req.body || {});
  res.json(updated);
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await Bateau.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });

  if (row.proprietaire_id !== req.user.sub) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
  }

  await Bateau.remove(id);
  res.status(204).send();
};
