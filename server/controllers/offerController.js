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

exports.getPublicOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ status: { $in: ["Active", "Scheduled"] } })
      .populate("products", "name slug image")
      .sort({ createdAt: -1 });
    
    const now = new Date();
    const publicOffers = offers.map((offer) => {
      const startsAt = offer.startDate ? new Date(offer.startDate) : null;
      const expiresAt = offer.endDate ? new Date(offer.endDate) : null;
      
      let currentStatus = offer.status; // "Active", "Scheduled", "Expired"
      
      if (currentStatus !== "Inactive" && currentStatus !== "Draft") {
        if (startsAt && now < startsAt) {
          currentStatus = "Scheduled";
        } else if (expiresAt && now > expiresAt) {
          currentStatus = "Expired";
        } else {
          currentStatus = "Active";
        }
      }

      return {
        ...offer.toObject(),
        displayStatus: currentStatus,
        isCurrentlyValid: currentStatus === "Active",
      };
    });
    // Return only currently valid offers for the public badge
    res.status(200).json(publicOffers.filter(o => o.isCurrentlyValid));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.code) {
      payload.code = String(payload.code).toUpperCase();
    }

    if (payload.applicableOn === "All Products" && payload.status === "Active") {
      const newStartDate = new Date(payload.startDate);
      const newEndDate = new Date(payload.endDate);

      const existingOffer = await Offer.findOne({
        applicableOn: "All Products",
        status: "Active",
        startDate: { $lte: newEndDate },
        endDate: { $gte: newStartDate }
      });

      if (existingOffer) {
        return res.status(400).json({ message: "Another active 'All Products' offer already exists for the selected date range. Please choose different dates or deactivate the existing offer." });
      }
    }

    const offer = await Offer.create(payload);
    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("products", "name slug")
      .sort({ createdAt: -1 });
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate("products", "name slug");
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.status(200).json(offer);
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

    if (updatePayload.applicableOn === "All Products" && updatePayload.status === "Active") {
      // Fetch the current offer to ensure we have dates if they weren't provided in the payload (e.g. quick toggle)
      const currentOffer = await Offer.findById(req.params.id);
      if (!currentOffer) return res.status(404).json({ message: "Offer not found" });

      const newStartDate = new Date(updatePayload.startDate || currentOffer.startDate);
      const newEndDate = new Date(updatePayload.endDate || currentOffer.endDate);

      const existingOffer = await Offer.findOne({ 
        applicableOn: "All Products", 
        status: "Active", 
        _id: { $ne: req.params.id },
        startDate: { $lte: newEndDate },
        endDate: { $gte: newStartDate }
      });

      if (existingOffer) {
        return res.status(400).json({ message: "Another active 'All Products' offer already exists for the selected date range. Please choose different dates or deactivate the existing offer." });
      }
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
