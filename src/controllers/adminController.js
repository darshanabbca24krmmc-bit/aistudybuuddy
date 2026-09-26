const User = require("../models/User");
const Material = require("../models/Material");

const getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ users });
};

const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await Material.deleteMany({ user: req.params.id });

  res.json({ message: "User and their materials deleted" });
};

const getStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalMaterials = await Material.countDocuments();
  res.json({ totalUsers, totalMaterials });
};

module.exports = { getUsers, deleteUser, getStats };
