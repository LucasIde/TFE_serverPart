import { Router } from "express";
import authRouter from "./auth.router.js";
import gameRouter from "./game.router.js";
import eventRouter from "./event.router.js";

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use("/games", gameRouter);
apiRouter.use("/events", eventRouter);
