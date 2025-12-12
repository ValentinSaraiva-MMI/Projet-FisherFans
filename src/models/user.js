const db = require("../config/db");

// Helpers Promises
const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// API
exports.getAll = async () => {
  return dbAll(
    `SELECT id, nom, prenom, email AS mail, statut
     FROM users
     ORDER BY id DESC`
  );
};

exports.getAuthByEmail = async (email) => {
  return dbGet(
    `SELECT id, nom, prenom, email, password, statut
     FROM users
     WHERE email = ?`,
    [email]
  );
};
