const bcrypt = require("bcryptjs");
const User = require("../models/user");

const clamp = (v, d, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(+v) ? parseInt(v, 10) : d));

exports.list = async (req, res) => {
  try {
    const limit = clamp(req.query.limit, 20, 1, 200);
    const offset = clamp(req.query.offset, 0, 0, 1_000_000);
    const q = (req.query.q || "").trim();

    const rows = await User.list({ q, limit, offset });
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_500", message: "Erreur serveur" });
  }
};

exports.create = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.nom || !b.prenom || !b.mail || !b.password) {
      return res.status(400).json({
        code: "ERR_VALID",
        message: "nom, prenom, mail, password requis",
      });
    }
    if (String(b.password).length < 6) {
      return res
        .status(400)
        .json({ code: "ERR_VALID", message: "password minLength=6" });
    }

    const passwordHash = bcrypt.hashSync(String(b.password), 10);

    const created = await User.create({
      nom: b.nom,
      prenom: b.prenom,
      mail: b.mail,
      passwordHash,
      date_naissance: b.date_naissance,
      telephone: b.telephone,
      adresse: b.adresse,
      code_postal: b.code_postal,
      langues_parlees: b.langues_parlees,
      url_photo: b.url_photo,
      numero_permis_bateau: b.numero_permis_bateau,
      statut: b.statut,
      nom_societe: b.nom_societe,
      num_siret: b.num_siret,
      num_rc: b.num_rc,
    });

    return res.status(201).json(created);
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return res.status(400).json({ code: "ERR_DUP", message: "mail déjà utilisé" });
    }
    console.error(e);
    return res.status(500).json({ code: "ERR_500", message: "Erreur serveur" });
  }
};

exports.get = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await User.getById(id);
  if (!row) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  return res.json(row);
};

exports.patch = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const exists = await User.getById(id);
  if (!exists) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });

  const updated = await User.patch(id, req.body || {});
  return res.json(updated);
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ok = await User.anonymize(id);
  if (!ok) return res.status(404).json({ code: "ERR_404", message: "Introuvable" });
  return res.status(204).send();
};
