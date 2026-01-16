const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/utilisateurs", require("./users.route"));
router.use("/bateaux", require("./bateaux.routes"));
router.use("/sorties", require("./sorties.routes"));
module.exports = router;
