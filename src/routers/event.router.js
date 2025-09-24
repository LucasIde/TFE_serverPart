import { Router } from "express";
import eventController from "../controllers/event.controller.js";
import eventVoteController from "../controllers/eventVote.controller.js";

const eventRouter = Router();

eventRouter.route('/add')
	.post(eventController.add);

eventRouter.route('/')
	.get(eventController.getAllById);

eventRouter.route('/:id')
	.get(eventController.getEventById);

eventRouter.route("/:eventId/votes")
	.put(eventVoteController.upsertVotes)
	.get(eventVoteController.getMyVotes);

eventRouter.route('/:id/votes/summary')
  .get(eventVoteController.getVotesSummary);

  eventRouter.route('/:id/votes/close')
  .put(eventVoteController.closeVotes);

eventRouter.route('/:id/final')
  .put(eventVoteController.setFinalChoices);

export default eventRouter;