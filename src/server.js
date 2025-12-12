require("dotenv").config({ path: ".env" });

const app = require("./app");
const config = require("./config/config");
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Serveur Fisher Fans démarré sur le port ${PORT}`);
  console.log(`Test l'API ici : http://localhost:${PORT}/api/v1/users`);
});
