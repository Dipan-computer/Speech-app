 const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();

// Node 18+ has fetch built in.
// If your Node version is older and fetch is undefined,
// run: npm install node-fetch
// then uncomment the next 2 lines:
// const fetchModule = require("node-fetch");
// const fetch = fetchModule.default || fetchModule;

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());

// -------------------- Multer Setup --------------------
const upload = multer({ dest: "uploads/" });

// -------------------- MongoDB Connection --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected (cloud)");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// -------------------- Schema --------------------
const transcriptionSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: "recording.webm",
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Transcription = mongoose.model("Transcription", transcriptionSchema);

// -------------------- Health Route --------------------
app.get("/", (req, res) => {
  res.send("Server running on port " + PORT);
});

// -------------------- History Routes --------------------
app.get("/history", async (req, res) => {
  try {
    const items = await Transcription.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("History fetch error:", error.message);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

app.delete("/history/:id", async (req, res) => {
  try {
    const deleted = await Transcription.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
});

// -------------------- Upload + Transcribe Route --------------------
app.post("/upload", upload.single("audio"), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ text: "No audio file uploaded" });
    }

    filePath = req.file.path;

    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(500).json({ text: "Deepgram API key missing" });
    }

    console.log("Uploaded file:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    const audioBuffer = fs.readFileSync(filePath);

    const dgResponse = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": req.file.mimetype || "application/octet-stream",
        },
        body: audioBuffer,
      }
    );

    const data = await dgResponse.json();
    console.log("DEEPGRAM STATUS:", dgResponse.status);
    console.log("DEEPGRAM RESPONSE:", JSON.stringify(data, null, 2));

    if (!dgResponse.ok) {
      return res.status(dgResponse.status).json({
        text: data?.err_msg || data?.message || "Deepgram request failed",
      });
    }

    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!transcript.trim()) {
      return res.json({ text: "No speech detected in the audio" });
    }

    const saved = await Transcription.create({
      fileName: req.file.originalname || "recording.webm",
      text: transcript,
    });

    return res.json({
      _id: saved._id,
      fileName: saved.fileName,
      text: saved.text,
      createdAt: saved.createdAt,
    });
  } catch (error) {
    console.error("Upload route error full:", error);
    return res.status(500).json({
      text: error.message || "Upload failed",
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
});
// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});