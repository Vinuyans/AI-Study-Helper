import { Router } from "express";
import multer from "multer"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileRouter = Router();

// Storage engine
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"), // folder must exist
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

fileRouter.post("/upload", upload.array("files"), (req, res) => {
  console.log("Uploaded:", req.files.length, "files");
  res.json({
    message: "Files uploaded successfully",
    count: req.files.length,
  });
});

export default fileRouter;