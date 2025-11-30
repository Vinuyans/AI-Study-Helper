import express from "express";
import cors from "cors";
import api from "./routes/api.js";
import bodyParser from "body-parser";

const app = express();
const PORT = 5000;

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});
app.use(express.static('public'));
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["POST", "GET", "OPTIONS"],
}));

app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

app.use("/api", api);

app.use(function (_, res) {
  res.status(404).send("404 NOT FOUND");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 