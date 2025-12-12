const router = require("express").Router();
const Auth = require("../../controllers/auth.controller");

router.post("/login", Auth.login);

module.exports = router;
