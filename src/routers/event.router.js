import { Router } from "express";
import eventController from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route('/add')
	.post(eventController.add);

eventRouter.route('/')
	.get(eventController.getAllById);

eventRouter.route('/:id')
	.get(eventController.getEventById);

export default eventRouter;
