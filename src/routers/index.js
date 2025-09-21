import { Router } from "express";
import authRouter from "./auth.router.js";
import gameRouter from "./game.router.js";

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use("/games", gameRouter);
