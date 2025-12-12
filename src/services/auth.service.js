const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

exports.signAccessToken = (user) => {
  // payload minimal
  return jwt.sign(
    { sub: user.id, email: user.email, statut: user.statut },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
};
