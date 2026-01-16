const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/utilisateurs", require("./users.route"));
router.use("/boats", require("./boats.route"));

module.exports = router;
