const router = require("express").Router();
const Ctrl = require("../../controllers/reservations.controller");
const { requireAuth } = require("../../middlewares/middlewares");

router.get("/", Ctrl.list);
router.post("/", requireAuth, Ctrl.create);

router.get("/:id", Ctrl.get);
router.delete("/:id", requireAuth, Ctrl.remove);

module.exports = router;
