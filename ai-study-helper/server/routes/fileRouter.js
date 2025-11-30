import { Router } from "express";
import multer from "multer"
import path from "path";
import { fileURLToPath } from "url";
import officeParser from "officeparser"
import { PDFExtract } from "pdf.js-extract";

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

const upload = multer({ storage: multer.memoryStorage() }); // keep files in memory

fileRouter.post("/parse", upload.single("file"), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const mimetype = req.file.mimetype.toLowerCase();
    let text;
    if (mimetype === "application/pdf") {
      text = await parsePdfBuffer(buffer);
    } else {
      text = await officeParser.parseOfficeAsync(buffer);
    }
    console.log("Text: ", text)
    res.json({ data: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default fileRouter;