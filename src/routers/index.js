import { Router } from "express";
import authRouter from "./auth.router.js";

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
