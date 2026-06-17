const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password").lean();
    
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

    if (req.body.wishlist !== undefined && Array.isArray(req.body.wishlist)) {
      currentUser.wishlist = req.body.wishlist;
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

// admin creates accounts
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, gender, dateOfBirth, status, customerType, phone, isAdmin } = req.body;
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
      isAdmin: isAdmin || false,
      isSuperAdmin: false,
      gender: gender || "Prefer Not to Say",
      dateOfBirth: dateOfBirth || null,
      status: status || "Active",
      isBlocked: status === "Blocked" || status === "Suspended",
      customerType: customerType || "Regular",
      phone: phone || "",
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

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("wishlist").select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get orders
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    
    const ordersCount = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = ordersCount > 0 ? totalSpent / ordersCount : 0;
    const wishlistCount = user.wishlist ? user.wishlist.length : 0;
    
    // Get cart
    const cart = await Cart.findOne({ userId: user._id }).populate("items.productId").lean();
    const cartCount = cart && cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    res.json({
      ...user,
      orders,
      cartItems: cart ? cart.items : [],
      stats: {
        ordersCount,
        totalSpent,
        avgOrderValue,
        wishlistCount,
        cartCount,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, email, gender, dateOfBirth, status, customerType, phone, 
      isVerified, isPhoneVerified, adminNotes, password, isAdmin,
      loyaltyPoints, preferences, shippingDetails, billingDetails 
    } = req.body;
    
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (email && email !== targetUser.email) {
      const exists = await User.findOne({ email, _id: { $ne: targetUser._id } });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      targetUser.email = email;
    }

    if (name !== undefined) targetUser.name = name;
    if (gender !== undefined) targetUser.gender = gender;
    if (dateOfBirth !== undefined) targetUser.dateOfBirth = dateOfBirth;
    if (status !== undefined) {
      targetUser.status = status;
      targetUser.isBlocked = status === "Blocked" || status === "Suspended";
    }
    if (customerType !== undefined) targetUser.customerType = customerType;
    if (phone !== undefined) targetUser.phone = phone;
    if (isVerified !== undefined) targetUser.isVerified = isVerified;
    if (isPhoneVerified !== undefined) targetUser.isPhoneVerified = isPhoneVerified;
    if (adminNotes !== undefined) targetUser.adminNotes = adminNotes;
    if (isAdmin !== undefined) targetUser.isAdmin = isAdmin;
    if (loyaltyPoints !== undefined) targetUser.loyaltyPoints = loyaltyPoints;
    if (preferences !== undefined) targetUser.preferences = preferences;
    if (shippingDetails !== undefined) targetUser.shippingDetails = shippingDetails;
    if (billingDetails !== undefined) targetUser.billingDetails = billingDetails;

    if (password) {
      targetUser.password = await bcrypt.hash(password, 10);
    }

    await targetUser.save();
    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bulkActionUsers = async (req, res) => {
  try {
    const { action, userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No users selected" });
    }

    // Prevent affecting super admins
    const targetUsers = await User.find({ _id: { $in: userIds }, isSuperAdmin: false });
    const targetIds = targetUsers.map(u => u._id);

    if (action === "activate") {
      await User.updateMany({ _id: { $in: targetIds } }, { $set: { status: "Active", isBlocked: false } });
    } else if (action === "block") {
      await User.updateMany({ _id: { $in: targetIds } }, { $set: { status: "Blocked", isBlocked: true } });
    } else if (action === "delete") {
      await User.deleteMany({ _id: { $in: targetIds } });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ message: `Bulk action '${action}' completed on ${targetIds.length} users` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const AdminActivityLog = require("../models/AdminActivityLog");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");
const { logAdminActivity } = require("../utils/adminActivityLogger");

exports.updateMySecurity = async (req, res) => {
  try {
    const { password, twoFactorEnabled } = req.body;
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    let updated = false;

    if (password) {
      currentUser.password = await bcrypt.hash(password, 10);
      updated = true;
    }

    if (twoFactorEnabled !== undefined) {
      currentUser.twoFactorAuth = {
        ...currentUser.twoFactorAuth,
        enabled: twoFactorEnabled
      };
      updated = true;
    }

    if (updated) {
      await currentUser.save();
      await logAdminActivity({
        adminId: currentUser._id,
        activity: "Updated Security Settings",
        module: "Security",
        status: "Success"
      });
    }

    res.json({ message: "Security settings updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMyNotifications = async (req, res) => {
  try {
    const preferences = req.body;
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    currentUser.notificationPreferences = {
      ...currentUser.notificationPreferences,
      ...preferences
    };

    await currentUser.save();
    
    await logAdminActivity({
      adminId: currentUser._id,
      activity: "Updated Notification Preferences",
      module: "Profile",
      status: "Success"
    });

    res.json(currentUser.notificationPreferences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyActivities = async (req, res) => {
  try {
    const activities = await AdminActivityLog.find({ admin: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalSuppliers = await Supplier.countDocuments();
    const totalPurchases = await Purchase.countDocuments();
    
    const currentUser = await User.findById(req.user._id).select("lastLoginDate");

    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalSuppliers,
      totalPurchases,
      lastLogin: currentUser?.lastLoginDate || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAdminPersonalProfile = async (req, res) => {
  try {
    const { name, email, phone, altMobile, gender, dateOfBirth, address, city, state, country, pincode, profileImage } = req.body;
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    if (email && email !== currentUser.email) {
      const emailInUse = await User.findOne({ email, _id: { $ne: currentUser._id } });
      if (emailInUse) return res.status(400).json({ message: "Email already in use" });
      currentUser.email = email;
    }

    if (name !== undefined) currentUser.name = name;
    if (phone !== undefined) currentUser.phone = phone;
    if (altMobile !== undefined) currentUser.altMobile = altMobile;
    if (gender !== undefined) currentUser.gender = gender;
    if (dateOfBirth !== undefined) currentUser.dateOfBirth = dateOfBirth;
    if (address !== undefined) currentUser.address = address;
    if (city !== undefined) currentUser.city = city;
    if (state !== undefined) currentUser.state = state;
    if (country !== undefined) currentUser.country = country;
    if (pincode !== undefined) currentUser.pincode = pincode;
    if (profileImage !== undefined) currentUser.profileImage = profileImage;

    await currentUser.save();
    
    await logAdminActivity({
      adminId: currentUser._id,
      activity: "Updated Profile Information",
      module: "Profile",
      status: "Success"
    });

    res.json(currentUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
