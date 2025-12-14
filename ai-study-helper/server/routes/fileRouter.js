import { Router } from "express";
import multer from "multer"
import path from "path";
import { fileURLToPath } from "url";
import officeParser from "officeparser"
import { PDFExtract } from "pdf.js-extract";
import { v4 as uuidv4 } from 'uuid';
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileRouter = Router();
const UPLOADS_DIR = path.join(__dirname, 'uploads/');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const newFilename = uniqueId + fileExtension;
    cb(null, newFilename);
  }
});

async function getBufferFromDisk(filePath) {
    return fs.readFile(filePath); 
}

async function parsePdfBuffer(buffer) {
  const pdfExtract = new PDFExtract();
  const options = {};
  const data = await pdfExtract.extractBuffer(buffer, options);
  let text = "";
  data.pages.forEach(page => {
    page.content.forEach(item => {
      text += item.str + " ";
    });
    text += "\n";
  });

  return text;
}

const upload = multer({ storage }); // keep files in memory

fileRouter.post("/parse", upload.single("file"), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
  }
  try {
    const buffer = await getBufferFromDisk(req.file.path);
    const mimetype = req.file.mimetype.toLowerCase();
    let text;
    if (mimetype === "application/pdf") {
      text = await parsePdfBuffer(buffer);
    } else if (mimetype == "text/plain") {
      text = buffer.toString();
    } else {
      text = await officeParser.parseOfficeAsync(buffer);
    }
    console.log("Text: ", text)
    res.json({
      data: text,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

fileRouter.get("/context-all", async (req, res) => {
  try {
    const filenames = await fs.readdir(UPLOADS_DIR);
    const uploadedFiles = filenames.filter(name => !name.startsWith('.'));
    let combinedContext = [];
    await Promise.all(uploadedFiles.map(async (filename) => {
      const filePath = path.join(UPLOADS_DIR, filename);
      let text = '';
      const mimetype = mime.lookup(filename) || 'application/octet-stream';
      try {
        const buffer = await getBufferFromDisk(filePath);
          if (mimetype === "application/pdf") {
            text = await parsePdfBuffer(buffer);
          } else if (mimetype.includes("text/")) {
            text = buffer.toString();
          } else if (mimetype.includes("application/vnd.openxmlformats-officedocument")) {
            text = await officeParser.parseOfficeAsync(buffer);
          } else {
              return;
          }
          if (text.trim().length > 0) {
            combinedContext.push(
              `--- DOCUMENT START: ${filename} ---\n${text}\n--- DOCUMENT END: ${filename} ---`
            );
          }
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error);\
      }
    }));
    const finalContext = combinedContext.join('\n\n');
    res.json({
        message: `Successfully processed ${combinedContext.length} document(s).`,
        total_files_processed: combinedContext.length,
        combined_context: finalContext
    });
  } catch (err) {
    console.error("Error analyzing all files:", err);
    res.status(500).json({ error: "Failed to analyze documents." });
  }
});

export default fileRouter;