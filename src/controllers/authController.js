const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../utils/tokens");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already registered" });

  const user = await User.create({ name, email, password, role });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.status(201).json({
    message: "Registered successfully",
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, role: user.role },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.json({
    message: "Logged in",
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, role: user.role },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

const logout = (req, res) => {
  res.json({ message: "Logged out" });
};

module.exports = { register, login, refresh, logout };
