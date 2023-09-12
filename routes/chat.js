import express from "express";
import {
  getChat,
  getUserChats,
  newChat,
  sendMessage,
} from "../controllers/messages.js";
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
export const chat = express();

chat.post("/chat/create", newChat);
chat.post("/chats/get", getUserChats);
chat.post("/chat/message/send", upload.single("file"), sendMessage);
chat.post("/chat/get", getChat);
