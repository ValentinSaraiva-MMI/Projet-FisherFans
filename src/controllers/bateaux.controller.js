const Bateau = require("../models/bateau");
const User = require("../models/user");

// clamp d'entiers (limit/offset etc.)
const clampInt = (v, d, min, max) => {
  const n = Number(v);
  const i = Number.isFinite(n) ? parseInt(n, 10) : d;
  return Math.max(min, Math.min(max, i));
};

// parsing d'un id en int > 0
const parseId = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = parseInt(n, 10);
  return Number.isFinite(i) && i > 0 ? i : null;
};

// BF24 - parsing bbox "minLon,minLat,maxLon,maxLat"
const parseBBox = (bboxStr) => {
  if (!bboxStr) return null;

  const parts = String(bboxStr)
    .split(",")
    .map((x) => x.trim());

  if (parts.length !== 4) {
    return { error: "bbox doit contenir 4 valeurs: minLon,minLat,maxLon,maxLat" };
  }

  const nums = parts.map((p) => Number(p));
  if (!nums.every(Number.isFinite)) {
    return { error: "bbox doit contenir 4 nombres" };
  }

  const [minLon, minLat, maxLon, maxLat] = nums;

  // bornes géographiques
  if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
    return { error: "longitude hors limites [-180, 180]" };
  }
  if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
    return { error: "latitude hors limites [-90, 90]" };
  }

  // rectangle standard (on refuse l'antiméridien pour rester simple)
  if (minLon > maxLon || minLat > maxLat) {
    return { error: "bbox invalide: min doit être <= max" };
  }

  return { minLon, minLat, maxLon, maxLat };
};

exports.list = async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 20, 1, 200);
    const offset = clampInt(req.query.offset, 0, 0, 1_000_000);

    const proprietaireId = req.query.proprietaireId
      ? parseId(req.query.proprietaireId)
      : null;

    if (req.query.proprietaireId && !proprietaireId) {
      return res.status(400).json({ code: "ERR_VALID", message: "proprietaireId invalide" });
    }

    const bboxParsed = parseBBox(req.query.bbox);
    if (bboxParsed?.error) {
      return res.status(400).json({ code: "ERR_VALID", message: bboxParsed.error });
    }

    const rows = await Bateau.list({
      proprietaireId,
      bbox: bboxParsed, // null ou {minLon,minLat,maxLon,maxLat}
      limit,
      offset,
    });

    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_INTERNAL", message: "Erreur serveur" });
  }
};

exports.create = async (req, res) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      return res.status(401).json({ code: "ERR_AUTH", message: "Non authentifié" });
    }

    // BF27 : permis obligatoire
    const me = await User.getByIdPrivate(ownerId);
    if (!me?.numero_permis_bateau) {
      return res.status(403).json({ code: "BF27", message: "Permis bateau requis" });
    }

    const b = req.body || {};
    if (!b.nom) {
      return res.status(400).json({ code: "ERR_VALID", message: "nom requis" });
    }

    const created = await Bateau.create({ ...b, proprietaire_id: ownerId });
    return res.status(201).json(created);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_INTERNAL", message: "Erreur serveur" });
  }
};

exports.get = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ code: "ERR_VALID", message: "id invalide" });
    }

    const row = await Bateau.getById(id);
    if (!row) {
      return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
    }

    return res.json(row);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_INTERNAL", message: "Erreur serveur" });
  }
};

exports.patch = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ code: "ERR_AUTH", message: "Non authentifié" });
    }

    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ code: "ERR_VALID", message: "id invalide" });
    }

    const row = await Bateau.getById(id);
    if (!row) {
      return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
    }

    // ownership
    if (row.proprietaire_id !== userId) {
      return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
    }

    const updated = await Bateau.patch(id, req.body || {});
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_INTERNAL", message: "Erreur serveur" });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ code: "ERR_AUTH", message: "Non authentifié" });
    }

    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ code: "ERR_VALID", message: "id invalide" });
    }

    const row = await Bateau.getById(id);
    if (!row) {
      return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
    }

    if (row.proprietaire_id !== userId) {
      return res.status(403).json({ code: "ERR_FORBIDDEN", message: "Interdit" });
    }

    await Bateau.remove(id);
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_INTERNAL", message: "Erreur serveur" });
  }
};
