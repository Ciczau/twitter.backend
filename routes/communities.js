import express from "express";
import multer from "multer";
import {
  GetCommunitiesByKey,
  createCommunity,
  getCommunity,
  getCommunityTweets,
  getUserCommunities,
  getUserCommunitiesTweets,
  joinCommunity,
} from "../controllers/communities.js";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
export const communities = express();

communities.post("/community/create", upload.single("file"), createCommunity);
communities.post("/community/join", joinCommunity);
communities.post("/community/get", getCommunity);
communities.post("/community/get/tweets", getCommunityTweets);
communities.post("/communities/user/get", getUserCommunities);
communities.post("/communities/get/bykey", GetCommunitiesByKey);
communities.post("/communities/user/get/tweets", getUserCommunitiesTweets);
