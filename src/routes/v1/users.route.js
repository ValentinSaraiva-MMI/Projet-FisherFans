// routes des utilisateurs
const express = require("express");
const router = express.Router();
const userController = require("../../controllers/controllers");

// Définition de la route GET /
router.get("/", userController.getUsers);

module.exports = router;
