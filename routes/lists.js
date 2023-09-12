import express from "express";
import {
  GetListsByKey,
  addMembersToList,
  createList,
  followList,
  getList,
  getListTweets,
  getUserList,
} from "../controllers/lists.js";
export const lists = express();

lists.post("/lists/create", createList);
lists.post("/lists/create/users", addMembersToList);
lists.post("/lists/user/get", getUserList);
lists.post("/lists/get/bykey", GetListsByKey);
lists.post("/list/get", getList);
lists.post("/list/get/tweets", getListTweets);
lists.post("/list/follow", followList);
