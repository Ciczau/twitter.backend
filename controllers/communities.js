import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();
import { generateRandomCode } from "./users.js";

import { tweets, communities } from "../database/collections.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createCommunity = async (req, res) => {
  const { file } = req;
  const { name, nick } = req.body;
  const imageId = generateRandomCode();
  if (file) {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      public_id: imageId,
    });

    if (uploadResult) {
      await fs.promises.unlink(file.path);
    }
  }
  let members = [nick];
  const addComunity = await communities.insertOne({
    name: name,
    members: members,
    avatar: `https://res.cloudinary.com/df4tupotg/image/upload/${imageId}`,
  });
  const newCommunity = await communities.findOne({
    _id: addComunity.insertedId,
  });
  return res.status(200).send({ newCommunity });
};
export const getUserCommunities = async (req, res) => {
  const { nick } = req.body;
  const result = await communities.find({ members: { $in: [nick] } }).toArray();
  return res.status(200).send({ result });
};
export const joinCommunity = async (req, res) => {
  const { nick, community, joined } = req.body;
  const update = joined
    ? { $pull: { members: nick } }
    : { $push: { members: nick } };
  await communities.updateOne({ _id: new ObjectId(community) }, update);
  return res.status(200).send();
};
export const GetCommunitiesByKey = async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(200).send({ result: [] });
  const result = await communities
    .find({
      name: { $regex: key, $options: "i" },
    })
    .sort({ _id: -1 })
    .toArray();
  return res.status(200).send({ result });
};
export const getCommunity = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(404).send();
  const communityId = new ObjectId(id);
  const result = await communities.findOne({ _id: communityId });
  return res.status(200).send({ result });
};
export const getCommunityTweets = async (req, res) => {
  const { communityId } = req.body;
  const result = await tweets.find({ audience: communityId }).toArray();
  return res.status(200).send({ result });
};
export const getUserCommunitiesTweets = async (req, res) => {
  const { nick } = req.body;
  if (!nick) return res.status(404).send();
  const communitiesList = await communities
    .find({
      members: { $in: [nick] },
    })
    .toArray();

  let tempResult = [];
  for (let i = 0; i < communitiesList.length; i++) {
    const tweetList = await tweets
      .find({ audience: communitiesList[i]._id.toString() })
      .toArray();
    for (let j = 0; j < tweetList.length; j++) {
      tempResult.push(tweetList[j]);
    }
  }
  let result = [];
  tempResult.forEach((item) => {
    result.push(item);
    item.repostBy?.forEach((repost) => {
      if (repost.nick === nick) {
        result.push({ ...item, repost: repost });
      }
    });
  });
  result.reverse().sort((a, b) => {
    const aDate = a.repost !== undefined ? a.repost.date : a.date;
    const bDate = b.repost !== undefined ? b.repost.date : b.date;
    return new Date(bDate) - new Date(aDate);
  });

  return res.status(200).send({ result });
};
