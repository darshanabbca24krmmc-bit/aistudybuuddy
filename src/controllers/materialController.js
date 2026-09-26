const fs = require("fs");
const Material = require("../models/Material");
const { askGemini } = require("../utils/gemini");

const uploadMaterial = async (req, res) => {
  const { title } = req.body;
  let content = "";

  if (req.file) {
    content = fs.readFileSync(req.file.path, "utf-8");
  } else if (req.body.content) {
    content = req.body.content;
  } else {
    return res.status(400).json({ message: "No file or content provided" });
  }

  const material = await Material.create({
    user: req.user.id,
    title: title || req.file?.originalname || "Untitled",
    content,
    filename: req.file?.filename,
  });

  res.status(201).json({ message: "Material uploaded", material });
};

const getMaterials = async (req, res) => {
  const materials = await Material.find({ user: req.user.id }).select("-content");
  res.json({ materials });
};

const getMaterial = async (req, res) => {
  const material = await Material.findOne({ _id: req.params.id, user: req.user.id });
  if (!material) return res.status(404).json({ message: "Material not found" });
  res.json({ material });
};

const deleteMaterial = async (req, res) => {
  const material = await Material.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!material) return res.status(404).json({ message: "Material not found" });
  res.json({ message: "Material deleted" });
};

const getOwnedMaterial = async (id, userId) => {
  const material = await Material.findOne({ _id: id, user: userId });
  return material;
};

const summarize = async (req, res) => {
  const material = await getOwnedMaterial(req.params.id, req.user.id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const prompt = `Summarize the following study material concisely for exam revision:\n\n${material.content}`;
  const summary = await askGemini(prompt);

  material.summary = summary;
  await material.save();

  res.json({ summary });
};

const flashcards = async (req, res) => {
  const material = await getOwnedMaterial(req.params.id, req.user.id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const count = req.body.count || 5;
  const prompt = `Create ${count} flashcards (question and answer pairs) from this study material. Respond ONLY with a JSON array like [{"question":"...","answer":"..."}], no other text:\n\n${material.content}`;

  const raw = await askGemini(prompt);
  let cards;
  try {
    cards = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return res.status(502).json({ message: "AI returned an unexpected format", raw });
  }

  material.flashcards = cards;
  await material.save();

  res.json({ flashcards: cards });
};

const quiz = async (req, res) => {
  const material = await getOwnedMaterial(req.params.id, req.user.id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const count = req.body.count || 5;
  const prompt = `Create a ${count}-question multiple choice quiz from this study material. Respond ONLY with a JSON array like [{"question":"...","options":["A","B","C","D"],"answer":"A"}], no other text:\n\n${material.content}`;

  const raw = await askGemini(prompt);
  let questions;
  try {
    questions = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return res.status(502).json({ message: "AI returned an unexpected format", raw });
  }

  material.quiz = questions;
  await material.save();

  res.json({ quiz: questions });
};

const studyPlan = async (req, res) => {
  const material = await getOwnedMaterial(req.params.id, req.user.id);
  if (!material) return res.status(404).json({ message: "Material not found" });

  const { goal, hoursPerDay, days } = req.body;
  const prompt = `Create a personalized ${days}-day study plan, ${hoursPerDay} hours per day, for this goal: "${goal}", based on this study material:\n\n${material.content}`;

  const plan = await askGemini(prompt);

  material.studyPlan = plan;
  await material.save();

  res.json({ studyPlan: plan });
};

module.exports = {
  uploadMaterial,
  getMaterials,
  getMaterial,
  deleteMaterial,
  summarize,
  flashcards,
  quiz,
  studyPlan,
};
