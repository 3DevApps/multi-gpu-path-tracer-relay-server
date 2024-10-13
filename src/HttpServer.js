const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { jobManager } = require("../instances.js");

const upload = multer({
  dest: path.join(__dirname, "../tmp"),
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// File upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) {
    res.status(400).send("Job ID is required");
    return;
  }

  if (!req.file) {
    res.status(400).send("File upload failed");
    return;
  }

  const filePath = req.file.path;
  const ext = req.file.originalname.split(".").pop();
  const fileName = `${jobId}.${ext}`;

  await jobManager.sendFile(filePath, fileName);

  // Remove the file after it has been sent
  fs.unlinkSync(filePath);

  res.status(200).send(`File ${fileName} uploaded successfully`);
});

module.exports = app;
