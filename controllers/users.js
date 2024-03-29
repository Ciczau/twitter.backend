import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import Joi from "joi";
import { generateAccessToken, generateRefreshToken } from "./token.js";
import { users, follows, notifications } from "../database/collections.js";

cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_NAME}`,
  api_key: `${process.env.CLOUDINARY_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).send({ msg: "Error" });
  const user = await users.findOne({ refreshToken: refreshToken });
  if (!user)
    return res.status(409).send({ msg: "Cannot find user with this token" });
  const verifyToken = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
  if (!verifyToken) {
    return res.status(401).send({ msg: "Token not verified" });
  } else {
    const accessToken = generateAccessToken(
      user.nick,
      user.bio,
      user.name,
      user.avatar,
      user.tweets,
      user.followers,
      user.following
    );

    return res.status(200).send({ accessToken });
  }
};

export const Register = async (req, res) => {
  const { email, nick, password, repeatPassword } = req.body;
  const schema = Joi.object().keys({
    nick: Joi.string().alphanum().min(6).max(20).required(),
    password: Joi.string().alphanum().min(8).max(30).required(),
    repeatPassword: Joi.string().alphanum().min(8).max(30).required(),
    email: Joi.string().email().min(3).max(50).required(),
  });
  const dataToValidate = {
    nick: nick,
    password: password,
    repeatPassword: repeatPassword,
    email: email,
  };
  const valid = schema.validate(dataToValidate);
  if (valid.error || !email || !nick || !password || !repeatPassword) {
    return res.status(404).send();
  }
  if (password !== repeatPassword)
    return res
      .status(403)
      .send({ errorCode: 1, message: "Passwords did not match" });
  const searchForUserByMail = await users.findOne({ email: email });
  const searchForUserByNick = await users.findOne({ nick: nick });
  if (searchForUserByMail)
    return res.status(409).send({
      errorCode: 2,
      message: "Email already in use",
    });

  if (searchForUserByNick)
    return res
      .status(409)
      .send({ errorCode: 3, message: "Nick already in use" });
  const salt = await bcrypt.genSalt(10);
  const encryptedPassword = await bcrypt.hash(password, salt);
  const refreshToken = generateRefreshToken(nick);
  await users.insertOne({
    email: email,
    nick: nick,
    name: nick,
    bio: "",
    avatar: "https://res.cloudinary.com/df4tupotg/image/upload/defaultavatar",
    password: encryptedPassword,
    refreshToken: refreshToken,
    tweets: 0,
    following: 0,
    followers: 0,
  });
  return res.status(200).send({ msg: "Success", refreshToken });
};

export const Login = async (req, res) => {
  const { nick, password } = req.body;
  const schema = Joi.object().keys({
    nick: Joi.string().alphanum().min(6).max(20).required(),
    password: Joi.string().alphanum().min(8).max(30).required(),
  });
  const dataToValidate = {
    nick: nick,
    password: password,
  };
  const valid = schema.validate(dataToValidate);
  if (valid.error || !nick || !password) {
    return res.status(404).send();
  }
  const User = await users.findOne({ nick: nick });
  if (!User)
    return res
      .status(404)
      .send({ errorCode: 4, message: "User does not exists!" });
  const checkPassword = await bcrypt.compare(password, User.password);
  if (!checkPassword)
    return res.status(401).send({ errorCode: 5, message: "Wrong password" });
  const refreshToken = generateRefreshToken(nick);
  await users.updateOne(
    { nick: nick },
    {
      $set: { refreshToken: refreshToken },
    }
  );
  const date = new Date();
  await notifications.insertOne({ nick: nick, type: "login", date: date });
  return res.status(200).send({ msg: "Success", refreshToken });
};

export const Logout = async (req, res) => {
  const { nick } = req.body;
  if (!nick) return res.status(400).send();
  await users.updateOne({ nick: nick }, { $set: { refreshToken: "" } });
  return res.status(200).send();
};

export function generateRandomCode() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";

  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}

export const EditProfile = async (req, res) => {
  try {
    const { file } = req;
    const { name, bio, nick, refreshToken } = req.body;
    if (!refreshToken) return res.status(404).send();
    const checkToken = await users.findOne({ refreshToken: refreshToken });
    if (!checkToken) return res.status(409).send();
    const fileName = generateRandomCode();
    const user = await users.findOne({ nick: nick });
    await users.updateOne({ nick: nick }, { $set: { name: name, bio: bio } });

    if (file) {
      if (
        user.avatar !==
        "https://res.cloudinary.com/df4tupotg/image/upload/defaultavatar"
      ) {
        await cloudinary.uploader.destroy(user.avatar);
      }
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        public_id: fileName,
        invalidate: true,
      });
      await users.updateOne(
        { nick: nick },
        {
          $set: {
            avatar: `https://res.cloudinary.com/df4tupotg/image/upload/${fileName}`,
          },
        }
      );
      if (uploadResult) {
        await fs.promises.unlink(file.path);
      }
    }

    return res.status(200).send();
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

export const GetUser = async (req, res) => {
  const { nick } = req.body;
  if (!nick) return res.status(404).send();
  const user = await users.findOne({ nick: nick });
  if (!user) return res.status(404).send();
  return res.status(200).send({ user });
};

export const GetUsers = async (req, res) => {
  const { list } = req.body;
  if (!list) return res.status(400).send();
  const userList = [];
  for (let i = 0; i < list.length; i++) {
    const user = await users.findOne({ nick: list[i] });
    userList.push(user);
  }
  return res.status(200).send({ users: userList });
};

export const GetAllUsers = async (req, res) => {
  const users = await users.find({}).toArray();
  return res.status(200).send({ users });
};

export const GetUsersByKey = async (req, res) => {
  const { key } = req.body;
  const result = await users
    .find({
      nick: { $regex: key, $options: "i" },
    })
    .toArray();
  return res.status(200).send({ result });
};

export const GetEachOtherFollows = async (req, res) => {
  const { nick, key } = req.body;
  if (!nick) return res.status(404).send();
  let result = [];

  const followList = await follows
    .find({
      $or: [{ followBy: nick }, { userToFollow: nick }],
    })
    .toArray();

  let userNickList = [];
  for (let i = 0; i < followList.length; i++) {
    for (let j = 0; j < followList.length; j++) {
      if (
        followList[i].followBy === followList[j].userToFollow &&
        followList[i].followBy !== nick
      ) {
        userNickList.push(followList[i].followBy);
      }
    }
  }

  for (let i = 0; i < userNickList.length; i++) {
    const user = await users.findOne({ nick: userNickList[i] });
    result.push({ user: user, followEachOther: true });
  }
  let newResult = [];
  if (key !== "") {
    const usersByKey = await users
      .find({
        nick: { $regex: key, $options: "i" },
      })
      .toArray();
    for (let i = 0; i < usersByKey.length; i++) {
      const user = await users.findOne({ nick: usersByKey[i].nick });
      if (!result.find((el) => el.user.nick === user.nick)) {
        newResult.push({ user: user, followEachOther: false });
      } else {
        newResult.push({ user: user, followEachOther: true });
      }
    }
    result = newResult;
  }
  return res.status(200).send({ result });
};
