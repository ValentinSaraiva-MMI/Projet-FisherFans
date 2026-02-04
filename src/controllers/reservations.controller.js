const Reservation = require("../models/reservation");
const Sortie = require("../models/sortie"); // à adapter selon ton nom de model sorties

const clamp = (v, d, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(+v) ? parseInt(v, 10) : d));

exports.list = async (req, res) => {
  const limit = clamp(req.query.limit, 20, 1, 200);
  const offset = clamp(req.query.offset, 0, 0, 1_000_000);

  const sortieId = req.query.sortieId ? parseInt(req.query.sortieId, 10) : null;
  const utilisateurId = req.query.utilisateurId ? parseInt(req.query.utilisateurId, 10) : null;

  const rows = await Reservation.list({ sortieId, utilisateurId, limit, offset });
  res.json(rows);
};

exports.create = async (req, res) => {
  const userId = req.user.sub;
  const b = req.body || {};

  const sortieId = b.sortie_peche_id ? parseInt(b.sortie_peche_id, 10) : null;
  if (!sortieId) return res.status(400).json({ code: "ERR_VALID", message: "sortie_peche_id requis" });

  // sortie existe ?
  const sortie = await Sortie.getById(sortieId);
  if (!sortie) return res.status(404).json({ code: "ERR_404", message: "Sortie introuvable" });

  // capacité ?
  const { cnt } = await Reservation.countBySortie(sortieId);
  if (cnt >= sortie.nb_passagers) {
    return res.status(409).json({ code: "ERR_CAPACITY", message: "Plus de places disponibles" });
  }

  try {
    const created = await Reservation.create({ sortie_peche_id: sortieId, utilisateur_id: userId });
    return res.status(201).json(created);
  } catch (e) {
    // SQLite UNIQUE constraint
    if (String(e.message || "").includes("UNIQUE")) {
      return res.status(409).json({ code: "ERR_DUPLICATE", message: "Déjà réservé" });
    }
    throw e;
  }
};

exports.get = async (req, res) => {
  const row = await Reservation.getById(parseInt(req.params.id, 10));
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  res.json(row);
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await Reservation.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });

  // ownership : seul l’utilisateur qui a réservé
  if (row.utilisateur_id !== req.user.sub) {
    return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
  }

  await Reservation.remove(id);
  res.status(204).send();
};
