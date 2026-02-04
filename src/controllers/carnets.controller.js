const Carnet = require("../models/carnet");

const clamp = (v, d, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(+v) ? parseInt(v, 10) : d));

exports.list = async (req, res) => {
  const limit = clamp(req.query.limit, 20, 1, 200);
  const offset = clamp(req.query.offset, 0, 0, 1_000_000);
  const utilisateurId = req.query.utilisateurId
    ? parseInt(req.query.utilisateurId, 10)
    : null;

  const rows = await Carnet.list({ utilisateurId, limit, offset });
  res.json(rows);
};

exports.create = async (req, res) => {
  const userId = req.user.sub; // bearerAuth => req.user.sub chez toi

  const c = req.body || {};

  // validations minimales (tu peux renforcer)
  if (!c.nom_poisson) {
    return res.status(400).json({ code: "ERR_VALID", message: "nom_poisson requis" });
  }
  if (c.taille != null && c.taille < 0) {
    return res.status(400).json({ code: "ERR_VALID", message: "taille invalide" });
  }
  if (c.poids != null && c.poids < 0) {
    return res.status(400).json({ code: "ERR_VALID", message: "poids invalide" });
  }

  const created = await Carnet.create({
    ...c,
    utilisateur_id: userId,
  });

  return res.status(201).json(created);
};

exports.get = async (req, res) => {
  const row = await Carnet.getById(parseInt(req.params.id, 10));
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  res.json(row);
};

exports.patch = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await Carnet.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });

  // ownership
  if (row.utilisateur_id !== req.user.sub) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
  }

  // validations optionnelles sur patch
  const p = req.body || {};
  if (p.taille != null && p.taille < 0) {
    return res.status(400).json({ code: "ERR_VALID", message: "taille invalide" });
  }
  if (p.poids != null && p.poids < 0) {
    return res.status(400).json({ code: "ERR_VALID", message: "poids invalide" });
  }

  const updated = await Carnet.patch(id, p);
  res.json(updated);
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await Carnet.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });

  if (row.utilisateur_id !== req.user.sub) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
  }

  await Carnet.remove(id);
  res.status(204).send();
};
