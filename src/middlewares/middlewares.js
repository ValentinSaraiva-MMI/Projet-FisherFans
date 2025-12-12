const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

exports.requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ code: "ERR_AUTH", message: "Token manquant" });
  }

  try {
    req.user = jwt.verify(match[1], JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ code: "ERR_AUTH", message: "Token invalide" });
  }
};
