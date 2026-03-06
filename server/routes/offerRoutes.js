const express = require("express");
const {
  getPublicOffers,
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
} = require("../controllers/offerController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/public", getPublicOffers);
router.get("/", requireSignIn, isAdmin, getAllOffers);
router.post("/", requireSignIn, isAdmin, createOffer);
router.put("/:id", requireSignIn, isAdmin, updateOffer);
router.delete("/:id", requireSignIn, isAdmin, deleteOffer);

module.exports = router;
