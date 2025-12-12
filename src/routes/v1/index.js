const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/utilisateurs", require("./users.route"));

module.exports = router;
