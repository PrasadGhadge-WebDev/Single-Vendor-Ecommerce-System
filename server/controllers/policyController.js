exports.getReplacementPolicy = async (req, res) => {
  res.status(200).json({
    title: "Replacement Policy",
    replacementWindowDays: 7,
    orderCancellationWindowHours: 24,
    policyPoints: [
      "Replacement request can be raised within 7 days from delivery date.",
      "Product should be unused, with original packaging and invoice.",
      "Replacement is applicable only for damaged, defective, or wrong items.",
      "No replacement on products marked as non-returnable at purchase time.",
      "Order cancellation is allowed before shipping or within 24 hours of order placement.",
    ],
  });
};
