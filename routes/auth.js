const express = require("express");
const { register, login, getMe, logout, updateMe } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.get("/logout", logout);


module.exports = router;