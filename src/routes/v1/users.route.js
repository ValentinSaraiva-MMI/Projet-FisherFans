const router = require("express").Router();
const Ctrl = require("../../controllers/users.controller");

router.get("/", Ctrl.list);
router.post("/", Ctrl.create);

router.get("/:id", Ctrl.get);
router.patch("/:id", Ctrl.patch);
router.delete("/:id", Ctrl.remove);

module.exports = router;
