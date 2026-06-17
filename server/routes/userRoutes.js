const express = require("express");
const { 
  getAllUsers, 
  deleteUser, 
  createUser, 
  getMyProfile, 
  updateMyProfile,
  updateMySecurity,
  updateMyNotifications,
  getMyActivities,
  getAdminDashboardStats,
  updateAdminPersonalProfile, 
  toggleBlockUser, 
  resetPassword, 
  impersonateUser,
  getUserById,
  updateUser,
  bulkActionUsers
} = require("../controllers/userController");
const { requireSignIn, isAdmin, isSuperAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", requireSignIn, getMyProfile);
router.put("/me", requireSignIn, updateMyProfile);
router.get("/", requireSignIn, isAdmin, getAllUsers);
router.post("/bulk-action", requireSignIn, isAdmin, bulkActionUsers);
router.get("/:id", requireSignIn, isAdmin, getUserById);
router.patch("/:id", requireSignIn, isAdmin, updateUser);
router.post("/", requireSignIn, isAdmin, createUser);
router.delete("/:id", requireSignIn, isAdmin, deleteUser);
router.patch("/:id/block", requireSignIn, isAdmin, toggleBlockUser);
router.post("/:id/reset-password", requireSignIn, isAdmin, resetPassword);
router.post("/:id/impersonate", requireSignIn, isSuperAdmin, impersonateUser);


// Admin profile new routes
router.put("/me/profile", requireSignIn, isAdmin, updateAdminPersonalProfile);
router.put("/me/security", requireSignIn, updateMySecurity);
router.put("/me/notifications", requireSignIn, updateMyNotifications);
router.get("/me/activities", requireSignIn, isAdmin, getMyActivities);
router.get("/me/dashboard-stats", requireSignIn, isAdmin, getAdminDashboardStats);

module.exports = router;
