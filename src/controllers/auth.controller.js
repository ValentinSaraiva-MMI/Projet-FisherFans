const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { signAccessToken } = require("../services/auth.service");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ code: "ERR_VALID", message: "email et password requis" });
    }

    // récupère l'utilisateur avec le password hash
    const user = await User.getAuthByEmail(String(email).trim());
    if (!user) {
      return res.status(401).json({ code: "ERR_LOGIN", message: "Identifiants invalides" });
    }

    const ok = bcrypt.compareSync(String(password), String(user.password));
    if (!ok) {
      return res.status(401).json({ code: "ERR_LOGIN", message: "Identifiants invalides" });
    }

    return res.json({
      access_token: signAccessToken(user),
      token_type: "Bearer",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_500", message: "Erreur serveur" });
  }
};
