const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadMaterial,
  getMaterials,
  getMaterial,
  deleteMaterial,
  summarize,
  flashcards,
  quiz,
  studyPlan,
} = require("../controllers/materialController");

router.use(protect);

router.post("/upload", upload.single("file"), uploadMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterial);
router.delete("/:id", deleteMaterial);

router.post("/:id/summarize", summarize);
router.post("/:id/flashcards", flashcards);
router.post("/:id/quiz", quiz);
router.post("/:id/study-plan", studyPlan);

module.exports = router;
