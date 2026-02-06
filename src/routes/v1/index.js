console.log("✅ v1 index loaded from:", __filename);

const router = require("express").Router();
router.get("/__ping_v1", (req, res) => res.json({ ok: true, file: __filename }));

router.use("/auth", require("./auth.routes"));
router.use("/utilisateurs", require("./users.route.js"));
router.use("/bateaux", require("./bateaux.routes"));
router.use("/sorties", require("./sorties.routes"));
router.use("/carnets", require("./carnets.routes"));
router.use("/reservations", require("./reservations.routes"));

module.exports = router;
