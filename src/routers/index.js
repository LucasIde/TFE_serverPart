import { Router } from "express";
import authRouter from "./auth.router";

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
