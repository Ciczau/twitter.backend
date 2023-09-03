import { generateRandomCode } from './users.js';
import { lists, tweets } from '../database/collections.js';

export const createList = async (req, res) => {
    const { creator, name, desc } = req.body;
    if (!creator || (!name && !desc)) return res.status(404).send();
    const id = generateRandomCode();
    let members = [creator.nick];
    let followers = [];
    await lists.insertOne({
        id: id,
        creator: creator,
        name: name,
        desc: desc,
        members: members,
        followers: followers,
    });
    const newList = await lists.findOne({ id: id });
    return res.status(200).send({ newList });
};

export const addMembersToList = async (req, res) => {
    const { membersArray, desc, name } = req.body;
    if (!membersArray) return res.status(404).send();
    const list = await lists.findOne({ desc: desc, name: name });
    let array = list.members;
    for (let i = 0; i < membersArray.length; i++) {
        if (!array.includes(membersArray[i])) {
            array.push(membersArray[i]);
        }
    }
    await lists.updateOne({ id: list.id }, { $set: { members: array } });
    return res.status(200).send({});
};
export const getUserList = async (req, res) => {
    const { nick } = req.body;
    if (!nick) return res.status(404).send();
    const result = await lists
        .find({
            $or: [{ members: { $in: [nick] } }, { followers: { $in: [nick] } }],
        })
        .sort({ _id: -1 })
        .toArray();
    return res.status(200).send({ result });
};

export const getList = async (req, res) => {
    const { id } = req.body;
    const result = await lists.findOne({ id: id });
    return res.status(200).send({ result });
};

export const getListTweets = async (req, res) => {
    const { listId } = req.body;
    if (!listId) return res.status(404).send();
    const list = await lists.findOne({ id: listId });
    let result = [];
    const userArray = list.members;
    for (let i = 0; i < userArray.length; i++) {
        const tweetList = await tweets
            .find({ nick: userArray[i], audience: '' })
            .toArray();
        for (let j = 0; j < tweetList.length; j++) {
            result.push(tweetList[j]);
        }
    }

    result.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    return res.status(200).send({ result });
};
export const followList = async (req, res) => {
    const { id, nick, isFollowing } = req.body;
    if (!id || !nick) return res.status(404).send();
    if (isFollowing) {
        await lists.updateOne({ id: id }, { $pull: { followers: nick } });
    } else {
        await lists.updateOne({ id: id }, { $push: { followers: nick } });
    }
    return res.status(200).send();
};

export const GetListsByKey = async (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(200).send({ result: [] });
    const result = await lists
        .find({
            name: { $regex: key, $options: 'i' },
        })
        .sort({ _id: -1 })
        .toArray();
    return res.status(200).send({ result });
};
