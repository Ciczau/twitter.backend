import { users, follows, notifications } from '../database/collections.js';

export const FollowUser = async (req, res) => {
    const { user, userToFollow } = req.body;
    if (!user || !userToFollow) return res.status(400).send();
    await follows.insertOne({
        followBy: user,
        userToFollow: userToFollow,
    });
    const userData = await users.findOne({ nick: user });
    await users.updateOne(
        { nick: user },
        { $set: { following: userData.following + 1 } }
    );
    const userToFollowData = await users.findOne({ nick: userToFollow });
    await users.updateOne(
        { nick: userToFollow },
        { $set: { followers: userToFollowData.followers + 1 } }
    );
    const date = new Date();
    await notifications.insertOne({
        nick: userToFollow,
        type: 'follow',
        date: date,
        user: userData,
    });
    return res.status(200).send();
};

export const GetFollowing = async (req, res) => {
    const { user } = req.body;
    const following = await follows.find({ followBy: user }).toArray();
    const list = following.map((follow) => {
        return follow.userToFollow;
    });
    return res.status(200).send({ list });
};
export const GetFollowers = async (req, res) => {
    const { user } = req.body;
    const following = await follows.find({ userToFollow: user }).toArray();
    const list = following.map((follow) => {
        return follow.followBy;
    });
    return res.status(200).send({ list });
};

export const unFollow = async (req, res) => {
    const { user, userToFollow } = req.body;
    if (!user || !userToFollow) return res.status(400).send();
    await follows.deleteOne({
        followBy: user,
        userToFollow: userToFollow,
    });
    const userData = await users.findOne({ nick: user });
    await users.updateOne(
        { nick: user },
        { $set: { following: userData.following - 1 } }
    );
    const userToFollowData = await users.findOne({ nick: userToFollow });
    await users.updateOne(
        { nick: userToFollow },
        { $set: { followers: userToFollowData.followers - 1 } }
    );
    return res.status(200).send();
};

export const CheckIfFollowing = async (req, res) => {
    const { follower, following } = req.body;
    const check = await follows.findOne({
        followBy: follower,
        userToFollow: following,
    });
    const result = check ? true : false;
    return res.status(200).send({ result });
};
