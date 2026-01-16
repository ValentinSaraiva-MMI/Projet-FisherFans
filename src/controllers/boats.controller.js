const UserModel = require("../models/user");

exports.getUsers = async (req, res) => {
  try {
    const users = await UserModel.getAll();
    return res.status(200).json(users);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ code: "ERR_500", message: "Erreur serveur" });
  }
};
