console.log("✅ v1 router loaded from:", __filename);

const router = require("express").Router();
router.get("/__ping", (req, res) => res.status(222).send("PING_USERS_OK"));

const Ctrl = require("../../controllers/users.controller");


router.get("/", Ctrl.list);
router.post("/", Ctrl.create);

router.get("/:id", Ctrl.get);
router.patch("/:id", Ctrl.patch);
router.delete("/:id", Ctrl.remove);

module.exports = router;
