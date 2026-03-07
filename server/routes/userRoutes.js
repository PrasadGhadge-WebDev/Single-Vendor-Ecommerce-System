const express = require("express");
const { getAllUsers, deleteUser, createUser, getMyProfile, updateMyProfile } = require("../controllers/userController");
const { requireSignIn, isAdmin, isSuperAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", requireSignIn, getMyProfile);
router.put("/me", requireSignIn, updateMyProfile);
router.get("/", requireSignIn, isAdmin, getAllUsers);
router.post("/", requireSignIn, isSuperAdmin, createUser);
router.delete("/:id", requireSignIn, isAdmin, deleteUser);

module.exports = router;
