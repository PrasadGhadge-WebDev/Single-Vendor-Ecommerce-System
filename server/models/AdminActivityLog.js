const mongoose = require("mongoose");

const adminActivityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activity: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Success",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminActivityLog", adminActivityLogSchema);
