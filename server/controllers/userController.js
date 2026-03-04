const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// remove a user by id (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }
    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// admin creates a new user (can set isAdmin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashed = await require("bcryptjs").hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      isAdmin: Boolean(isAdmin)
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};