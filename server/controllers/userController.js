const User = require("../models/User");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    
    // Aggregate orders for all users to get real-time metrics
    const ordersData = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Map the aggregated data back to the user list
    const usersWithStats = users.map(user => {
      const stats = ordersData.find(o => o._id && o._id.toString() === user._id.toString());
      return {
        ...user,
        ordersCount: stats ? stats.ordersCount : 0,
        totalSpent: stats ? stats.totalSpent : 0
      };
    });

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await User.findById(req.user._id).select("-password");
    if (!profile) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { name, email, password, profileImage, phone, address } = req.body;
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== currentUser.email) {
      const emailInUse = await User.findOne({ email, _id: { $ne: currentUser._id } }).select("_id");
      if (emailInUse) {
        return res.status(400).json({ message: "Email already in use" });
      }
      currentUser.email = email;
    }

    if (name !== undefined) {
      currentUser.name = name;
    }

    if (password) {
      currentUser.password = await bcrypt.hash(password, 10);
    }

    if (profileImage !== undefined) {
      currentUser.profileImage = String(profileImage || "");
    }

    if (phone !== undefined) {
      currentUser.phone = String(phone || "").trim();
    }

    if (address !== undefined) {
      currentUser.address = String(address || "").trim();
    }

    await currentUser.save();

    res.json({
      _id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      isAdmin: currentUser.isAdmin,
      isSuperAdmin: currentUser.isSuperAdmin,
      profileImage: currentUser.profileImage || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
      createdAt: currentUser.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// remove a user by id (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }
    const targetUser = await User.findById(id).select("isSuperAdmin");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (targetUser.isSuperAdmin) {
      return res.status(403).json({ message: "Cannot delete super admin" });
    }
    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// super admin creates sub-admin accounts only
exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      isAdmin: true,
      isSuperAdmin: false,
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (targetUser.isSuperAdmin) return res.status(403).json({ message: "Cannot block super admin" });
    
    targetUser.isBlocked = isBlocked;
    await targetUser.save();
    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    
    const tempPassword = Math.random().toString(36).slice(-8);
    targetUser.password = await bcrypt.hash(tempPassword, 10);
    await targetUser.save();
    
    res.json({ message: `Password reset successfully. Temporary password: ${tempPassword}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.impersonateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    
    const token = jwt.sign({ id: targetUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
