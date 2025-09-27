import { Router } from "express";
import friendController from "../controllers/friend.controller.js";

const friendRouter = Router();

// Rechercher un user
friendRouter.route("/search")
  .get(friendController.searchUsers);
friendRouter.route("/search/user")
  .get(friendController.searchAllUsers);

// Envoyer une demande d’ami
friendRouter.route("/:friendId")
  .post(friendController.sendRequest) // envoyer
  .delete(friendController.removeFriend); // supprimer

// Accepter une demande
friendRouter.route("/:friendId/accept")
  .put(friendController.acceptRequest);

// Refuser une demande
friendRouter.route("/:friendId/decline")
  .put(friendController.declineRequest);

// Lister mes amis & demandes
friendRouter.route("/")
  .get(friendController.listFriends);

export default friendRouter;
