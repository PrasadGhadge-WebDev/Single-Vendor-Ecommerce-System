const express = require("express");
const { getAllUsers, deleteUser, createUser } = require("../controllers/userController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", requireSignIn, isAdmin, getAllUsers);
router.post("/", requireSignIn, isAdmin, createUser);
router.delete("/:id", requireSignIn, isAdmin, deleteUser);

module.exports = router;