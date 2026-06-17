const express = require("express");
const {
  getPublicOffers,
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getPublicOfferById,
} = require("../controllers/offerController");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/public", getPublicOffers);
router.get("/public/:id", getPublicOfferById);
router.get("/", requireSignIn, isAdmin, getAllOffers);
router.get("/:id", requireSignIn, isAdmin, getOfferById);
router.post("/", requireSignIn, isAdmin, createOffer);
router.put("/:id", requireSignIn, isAdmin, updateOffer);
router.delete("/:id", requireSignIn, isAdmin, deleteOffer);

module.exports = router;
