import { Router } from "express";
import eventController from "../controllers/event.controller.js";
import eventVoteController from "../controllers/eventVote.controller.js";
import eventInviteController from "../controllers/eventInvite.controller.js";

const eventRouter = Router();

eventRouter.route('/add')
	.post(eventController.add);

eventRouter.route('/')
	.get(eventController.getAllById);

eventRouter.route('/:id')
.get(eventController.getEventById);

eventRouter.route("/:id/status")
	.put(eventController.updateStatus);
eventRouter.route("/:id/end")
	.put(eventController.endEvent);

eventRouter.route("/:id/join")
	.post(eventController.joinPublicEvent);

eventRouter.route("/:eventId/votes")
	.put(eventVoteController.upsertVotes)
	.get(eventVoteController.getMyVotes);

eventRouter.route('/:id/votes/summary')
	.get(eventVoteController.getVotesSummary);

eventRouter.route('/:id/votes/close')
	.put(eventVoteController.closeVotes);

eventRouter.route('/:id/final')
	.put(eventVoteController.setFinalChoices);

//   invite
eventRouter.route("/:eventId/invite/:friendId")
	.post(eventInviteController.inviteUser)
	.delete(eventInviteController.removeParticipant);
eventRouter.route("/:eventId/accept")
	.put(eventInviteController.acceptInvite);
eventRouter.route("/:eventId/decline")
	.put(eventInviteController.declineInvite);

export default eventRouter;
