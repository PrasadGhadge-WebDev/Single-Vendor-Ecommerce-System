const Offer = require("../models/Offer");

const isOfferCurrentlyValid = (offer) => {
  const now = new Date();
  if (!offer.isActive) return false;
  if (offer.startsAt && now < offer.startsAt) return false;
  if (offer.expiresAt && now > offer.expiresAt) return false;
  return true;
};

exports.getPublicOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    const publicOffers = offers.map((offer) => ({
      ...offer.toObject(),
      isCurrentlyValid: isOfferCurrentlyValid(offer),
    }));
    res.status(200).json(publicOffers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      code: String(req.body.code || "").toUpperCase(),
    };
    const offer = await Offer.create(payload);
    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const updatePayload = { ...req.body };
    if (updatePayload.code) {
      updatePayload.code = String(updatePayload.code).toUpperCase();
    }
    const offer = await Offer.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
