
import { Router } from "express";
import fileRouter from "./fileRouter.js";
import chatBotRouter from "./chatBotRouter.js";

const api = Router();

api.use("/file", fileRouter);
api.use("/chat", chatBotRouter);

export default api;