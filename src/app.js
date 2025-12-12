const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", require("./routes/v1"));

app.use((req, res) => {
  res.status(404).json({ code: "ERR_404", message: "Route introuvable" });
});

module.exports = app;
