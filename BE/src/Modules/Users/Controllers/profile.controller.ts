import { Router } from "express";

import ProfileService from "../Services/profile.service";
import { AuthenticationMiddleware, Multer, validationMiddleware } from "../../../Middlewares/middleware.barrel";
import { friendRequestValidator, respondToFriendshipValidator, updateProfileValidator } from "../../../Validators";

const profileController = Router();


// Get Private User Profile
profileController.get("/", AuthenticationMiddleware, ProfileService.getLoggedInProfile);

// Get Public User Profile
profileController.get("/public/:userId", ProfileService.getPublicProfile);

//Get User Profile Picture
profileController.get("/get-profile-picture", AuthenticationMiddleware, ProfileService.updateProfile);

//Update User Profile
profileController.put("/update", validationMiddleware(updateProfileValidator), AuthenticationMiddleware, ProfileService.updateProfile);

//Delete User Profile
profileController.delete("/delete-account", AuthenticationMiddleware, ProfileService.deleteAccount);

//Upload Profile Picture
profileController.post(
  "/upload-profile-picture",
  AuthenticationMiddleware,
  Multer().single("profilePicture"),
  ProfileService.uploadProfilePicture
);
//Upload cover Photo

//List all users

// renew signed url
profileController.post("/renew-signed-url", AuthenticationMiddleware, ProfileService.renewSignedUrl);

// Send friend request
profileController.post("/send-friend-request", AuthenticationMiddleware, ProfileService.sendFriendRequest);

// List Pending Friend Requests
profileController.get("/friend-requests",validationMiddleware(friendRequestValidator), AuthenticationMiddleware, ProfileService.listRequests);

// Respond to Friend Request
profileController.post("/respond-friend-request", validationMiddleware(respondToFriendshipValidator),AuthenticationMiddleware, ProfileService.respondToFriendRequest);

// Create Group
profileController.post("/create-group", AuthenticationMiddleware, ProfileService.createGroup);

export { profileController };
