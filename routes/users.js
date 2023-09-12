import express from "express";
import {
  EditProfile,
  GetAllUsers,
  GetEachOtherFollows,
  GetUser,
  GetUsers,
  GetUsersByKey,
  Login,
  Logout,
  Register,
  refreshToken,
} from "../controllers/users.js";
import {
  CheckIfFollowing,
  FollowUser,
  GetFollowers,
  GetFollowing,
  unFollow,
} from "../controllers/follows.js";

import { GetNotifications } from "../controllers/notifications.js";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

export const users = express();

users.post("/user/register", Register);
users.post("/user/login", Login);
users.post("/user/logout", Logout);
users.post("/user/edit", upload.single("file"), EditProfile);
users.post("/user", GetUser);
users.post("/users", GetUsers);
users.post("/token", refreshToken);
users.post("/users/get/search", GetUsersByKey);
users.post("/users/get/follow", GetEachOtherFollows);
users.get("/users/all", GetAllUsers);

users.post("/follow/add", FollowUser);
users.post("/follow/followers", GetFollowers);
users.post("/follow/following", GetFollowing);
users.post("/follow/delete", unFollow);
users.post("/follow/check", CheckIfFollowing);

users.post("/notifications/get", GetNotifications);
