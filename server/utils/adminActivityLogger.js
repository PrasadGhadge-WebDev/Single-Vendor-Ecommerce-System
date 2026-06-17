const AdminActivityLog = require("../models/AdminActivityLog");

exports.logAdminActivity = async ({ adminId, activity, module, status }) => {
  try {
    await AdminActivityLog.create({
      admin: adminId,
      activity,
      module,
      status,
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
};
