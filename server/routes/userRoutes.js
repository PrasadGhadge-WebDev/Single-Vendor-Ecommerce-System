const express = require("express");
const { 
  getAllUsers, 
  deleteUser, 
  createUser, 
  getMyProfile, 
  updateMyProfile, 
  toggleBlockUser, 
  resetPassword, 
  impersonateUser 
} = require("../controllers/userController");
const { requireSignIn, isAdmin, isSuperAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", requireSignIn, getMyProfile);
router.put("/me", requireSignIn, updateMyProfile);
router.get("/", requireSignIn, isAdmin, getAllUsers);
router.post("/", requireSignIn, isSuperAdmin, createUser);
router.delete("/:id", requireSignIn, isAdmin, deleteUser);
router.patch("/:id/block", requireSignIn, isAdmin, toggleBlockUser);
router.post("/:id/reset-password", requireSignIn, isAdmin, resetPassword);
router.post("/:id/impersonate", requireSignIn, isSuperAdmin, impersonateUser);

module.exports = router;
