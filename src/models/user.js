// models (type) des utilisateurs
const db = require("../config/db");

// Récupérer tous les utilisateurs
exports.getAll = (callback) => {
  const sql = `SELECT id, nom, prenom, email, statut FROM users`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, rows);
  });
};
