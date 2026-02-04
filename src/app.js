const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.get("/__ping_app", (req, res) => res.json({ ok: true }));

app.use("/api/v1", require("./routes/v1"));
const listEndpoints = require("express-list-endpoints");
console.log(listEndpoints(app));

app.use((req, res) => {
  res.status(404).json({ code: "ERR_404", message: "Route introuvable" });
});

module.exports = app;
