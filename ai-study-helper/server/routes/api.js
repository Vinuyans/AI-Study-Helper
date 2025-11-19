
import { Router } from "express";
import fileRouter from "./fileRouter.js";

const api = Router();

api.use("/file", fileRouter)

export default api;