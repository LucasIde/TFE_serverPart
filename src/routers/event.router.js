import { Router } from "express";
import eventController from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route('/add')
	.post(eventController.add);

eventRouter.route('/')
	.get(eventController.getById);

export default eventRouter;
