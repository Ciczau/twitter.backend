import express from "express";
import multer from "multer";
import {
  deleteTweet,
  getBookmarks,
  getLikes,
  getReplies,
  getSingleTweet,
  getTweets,
  getTweetsByKey,
  getUserBookmarks,
  getUserFollowingTweets,
  getUserLikes,
  getUserReplies,
  getUserTweets,
  handleBookmark,
  postTweet,
  repostTweet,
  tweetLike,
} from "../controllers/tweets.js";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

export const tweets = express();

tweets.post("/tweet/create", upload.single("file"), postTweet);
tweets.post("/tweet/like", tweetLike);
tweets.post("/tweet/bookmark", handleBookmark);
tweets.post("/tweet/likes", getLikes);
tweets.post("/tweet/bookmarks/get", getBookmarks);
tweets.post("/tweet/repost", repostTweet);
tweets.post("/tweets/user/get/following", getUserFollowingTweets);

tweets.get("/tweet/get", getTweets);
tweets.post("/tweet/get/replies", getReplies);
tweets.post("/tweet/getone", getSingleTweet);
tweets.post("/tweet/get/search", getTweetsByKey);
tweets.post("/tweet/delete", deleteTweet);
tweets.post("/user/tweets", getUserTweets);
tweets.post("/user/replies", getUserReplies);
tweets.post("/user/likes", getUserLikes);
tweets.post("/user/bookmarks", getUserBookmarks);
