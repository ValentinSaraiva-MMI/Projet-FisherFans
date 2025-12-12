// Point d'entrée de l'application Express
const express = require("express");
const app = express();
const userRoutes = require("./routes/v1/users.route");

// Middleware pour parser le JSON (utile pour les futurs POST)
app.use(express.json());

// Montage des routes avec versioning (BN1)
app.use("/api/v1/users", userRoutes);

module.exports = app;
