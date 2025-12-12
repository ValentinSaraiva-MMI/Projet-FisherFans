// controllers des routes
const UserModel = require("../models/user");

// Contrôleur pour récupérer tous les utilisateurs
exports.getUsers = (req, res) => {
  UserModel.getAll((err, users) => {
    if (err) {
      // Gestion des erreurs (BF25) [cite: 141]
      return res
        .status(500)
        .json({
          error: "Erreur serveur lors de la récupération des utilisateurs.",
        });
    }
    // Réponse au format JSON (BN4)
    res.status(200).json(users);
  });
};
