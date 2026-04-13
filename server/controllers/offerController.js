const Offer = require("../models/Offer");

const startOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

const isOfferCurrentlyValid = (offer) => {
  const now = new Date();
  if (!offer.isActive) return false;
  const startsAt = offer.startsAt ? startOfDay(offer.startsAt) : null;
  const expiresAt = offer.expiresAt ? endOfDay(offer.expiresAt) : null;
  if (startsAt && now < startsAt) return false;
  if (expiresAt && now > expiresAt) return false;
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
