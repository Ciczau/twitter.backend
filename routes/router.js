import express from "express";
import { sendQuestion } from "../controllers/question.js";
import { users } from "./users.js";
import { tweets } from "./tweets.js";
import { lists } from "./lists.js";
import { chat } from "./chat.js";
import { communities } from "./communities.js";

export const router = express();
router.use(users);
router.use(tweets);
router.use(lists);
router.use(chat);
router.use(communities);

router.post("/portfolio/question/send", sendQuestion);
