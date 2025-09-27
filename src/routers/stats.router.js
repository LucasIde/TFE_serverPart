import { Router } from "express";
import statsController from "../controllers/stats.Controller.js";

const statsRouter = Router();

statsRouter.route('/')
	.get(statsController.getStats);

export default statsRouter;
