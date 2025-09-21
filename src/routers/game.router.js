import { Router } from "express";
import gameController from "../controllers/game.controller.js";

const gameRouter = Router();

gameRouter.route('/search')
	.get(gameController.getByName);

gameRouter.route('/add')
	.post(gameController.add);

export default gameRouter;
