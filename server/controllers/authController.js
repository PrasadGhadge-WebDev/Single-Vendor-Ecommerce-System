const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.sendOtp = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (String(phone).length !== 10) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    // Mock OTP generation
    const otp = "123456";
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.findOneAndUpdate(
      { phone },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    console.log(`OTP for ${phone}: ${otp}`); // For debugging
    res.status(200).json({ success: true, message: "OTP sent successfully (123456)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOtpAndRegister = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const otpData = await Otp.findOne({ phone, otp });

    if (!otpData) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid, now find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const phoneStr = String(phone);
      user = await User.create({
        phone: phoneStr,
        name: `User_${phoneStr.slice(-4)}`, // Temporary default name
        isAdmin: false,
        isSuperAdmin: false,
      });
    } else if (!user.name || (typeof user.name === "string" && user.name.startsWith("User_"))) {
      // If user exists but has a default name, consider them "new" for the details step
      isNewUser = true;
    }

    // Delete OTP after verification
    await Otp.deleteOne({ _id: otpData._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email || "",
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      isNewUser,
      token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      isSuperAdmin: false,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists. Please use a different one." });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Mobile and password are required" });
    }

    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeRegistration = async (req, res) => {
  try {
    const { userId, name, email, password } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ message: "User ID and Name are required" });
    }

    const updateData = { name };
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists. Please use a different one." });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.logoutUser = async (req, res) => {
  res.status(200).json({ success: true, message: "Logout successful" });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: "Email or Mobile is required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found with this Email/Mobile" });
    }

    // Generate OTP
    const otp = "123456"; // Mock OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP tracking by identifier (email or phone)
    await Otp.findOneAndUpdate(
      { $or: [{ email: identifier }, { phone: identifier }] },
      { email: user.email, phone: user.phone, otp, expiresAt },
      { upsert: true, new: true }
    );

    console.log(`Reset OTP for ${identifier}: ${otp}`);
    res.status(200).json({ success: true, message: "OTP sent successfully (123456)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ message: "Identifier and OTP are required" });
    }

    const otpData = await Otp.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      otp,
    });

    if (!otpData) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpData = await Otp.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      otp,
    });

    if (!otpData) {
      return res.status(400).json({ message: "OTP verification failed or session expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { $or: [{ email: identifier }, { phone: identifier }] },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete OTP after successful reset
    await Otp.deleteOne({ _id: otpData._id });

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists. Please use a different one." });
    }
    res.status(500).json({ message: error.message });
  }
};
