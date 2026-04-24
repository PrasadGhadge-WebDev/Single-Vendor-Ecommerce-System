const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.requireSignIn = async (req, res, next) => {
  console.log(`Auth Check: ${req.method} ${req.originalUrl}`);
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Bootstrap one super admin from the first admin account if none exists yet.
      if (req.user.isAdmin && !req.user.isSuperAdmin) {
        const existingSuperAdmin = await User.findOne({ isSuperAdmin: true }).select("_id");
        if (!existingSuperAdmin) {
          req.user.isSuperAdmin = true;
          await User.findByIdAndUpdate(req.user._id, { isSuperAdmin: true, isAdmin: true });
        }
      }
      return next();
    } catch (err) {
      console.warn("Auth token error:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    res.status(401).json({ message: `Not authorized for ${req.originalUrl}` });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Admin only" });
  }
};

exports.isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Super admin only" });
  }
};

// Aliases for alternative naming
exports.protect = exports.requireSignIn;
exports.admin = exports.isAdmin;
