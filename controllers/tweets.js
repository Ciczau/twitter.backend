import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

import {
    notifications,
    tweets,
    likes,
    follows,
    users,
    bookmarks,
} from '../database/collections.js';

cloudinary.config({
    cloud_name: 'df4tupotg',
    api_key: '626447796253867',
    api_secret: 'mPXy5pytK8szulO6NY69mlAtP8Y',
});

export function generateRandomCode() {
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';

    for (let i = 0; i < 16; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }

    return code;
}

export const postTweet = async (req, res) => {
    try {
        const { file } = req;
        const { nick, text, parentId, audience, audienceName, refreshToken } =
            req.body;
        if (!refreshToken) return res.status(404).send();
        const checkToken = await users.findOne({ refreshToken: refreshToken });
        if (!checkToken) return res.status(409).send();
        let reply = 0;
        const user = await users.findOne({ nick: nick });
        let notification = {
            nick: '',
            type: 'retweet',
            date: '',
            user: null,
            content: null,
        };
        if (parentId) {
            reply = 1;
            const id = new ObjectId(parentId);
            const parentTweet = await tweets.findOne({ _id: id });
            await tweets.updateOne(
                { _id: id },
                { $set: { retweets: parentTweet.retweets + 1 } }
            );
            notification.nick = parentTweet.nick;
            notification.user = user;
        }
        const imageId = generateRandomCode();
        if (file) {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                public_id: imageId,
                invalidate: true,
            });

            if (uploadResult) {
                await fs.promises.unlink(file.path);
            }
        }
        if (!nick || !text) return res.status(400).send({ msg: 'Error' });
        const date = new Date();
        notification.date = date;
        let array = [];
        await tweets.insertOne({
            nick: nick,
            text: text,
            date: date,
            likes: 0,
            retweets: 0,
            bookmarks: 0,
            reposts: 0,
            repostBy: array,
            reply: reply,
            audience: audience,
            audienceName: audienceName,
            parentId: parentId,
            imageId: file
                ? `https://res.cloudinary.com/df4tupotg/image/upload/${imageId}`
                : '',
            views: 0,
        });

        await users.updateOne(
            { nick: nick },
            { $set: { tweets: user.tweets + 1 } }
        );
        const newTweet = await tweets.findOne({ nick: nick, date: date });
        notification.content = newTweet;
        if (reply === 1) {
            await notifications.insertOne({
                nick: notification.nick,
                type: notification.type,
                date: notification.date,
                user: notification.user,
                content: notification.content,
            });
        }
        return res.status(200).send({ msg: 'Success', newTweet });
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
};

export const getTweets = async (req, res) => {
    const response = await tweets
        .find({ audience: '' })
        .sort({ _id: -1 })
        .toArray();
    const result = [];
    response.forEach((item) => {
        result.push(item);
        item.repostBy?.forEach((repost) => {
            result.push({ ...item, repost: [repost] });
        });
    });
    result.reverse().sort((a, b) => {
        const aRepost = a.repostBy;
        const bRepost = b.repostBy;
        const aDate = aRepost?.date ? aRepost.date : a.date;
        const bDate = bRepost?.date ? bRepost.date : b.date;
        return new Date(bDate) - new Date(aDate);
    });
    await tweets.updateMany({ audience: '' }, { $inc: { views: 1 } });
    return res.status(200).send({ result });
};

export const getSingleTweet = async (req, res) => {
    const { tweetId } = req.body;
    if (!tweetId) return res.status(404).send();
    const _id = new ObjectId(tweetId);
    const result = await tweets.findOne({ _id: _id });
    return res.status(200).send({ result });
};

export const getUserTweets = async (req, res) => {
    const { nick } = req.body;
    const response = await tweets
        .find({
            $or: [{ nick: nick }, { repostBy: { $in: [nick] } }],
            reply: 0,
        })
        .sort({ _id: -1 })
        .toArray();

    const result = [];
    response.forEach((item) => {
        result.push(item);
        item.repostBy?.forEach((repost) => {
            if (repost.nick === nick) {
                result.push({ ...item, repost: [repost] });
            }
        });
    });
    result.reverse().sort((a, b) => {
        const aRepost = a.repostBy.find((repost) => repost.nick === nick);
        const bRepost = b.repostBy.find((repost) => repost.nick === nick);
        const aDate = aRepost ? aRepost.date : a.date;
        const bDate = bRepost ? bRepost.date : b.date;
        return new Date(bDate) - new Date(aDate);
    });
    return res.status(200).send({ result });
};

export const getUserReplies = async (req, res) => {
    const { nick } = req.body;
    const result = await tweets
        .find({ nick: nick, reply: 1 })
        .sort({ _id: -1 })
        .toArray();
    return res.status(200).send({ result });
};

export const getUserLikes = async (req, res) => {
    const { nick } = req.body;
    const like = await likes.find({ userId: nick }).toArray();
    const likesTab = like.map((el) => {
        return new ObjectId(el.tweetId);
    });
    let result = [];
    for (let i = likesTab.length - 1; i >= 0; i--) {
        const record = await tweets.findOne({ _id: likesTab[i] });
        result.push(record);
    }

    return res.status(200).send({ result });
};
export const getUserBookmarks = async (req, res) => {
    const { nick } = req.body;
    const bookmarkList = await bookmarks.find({ userId: nick }).toArray();
    const bookmarkTab = bookmarkList.map((el) => {
        return new ObjectId(el.tweetId);
    });
    let result = [];
    for (let i = bookmarkTab.length - 1; i >= 0; i--) {
        const record = await tweets.findOne({ _id: bookmarkTab[i] });
        result.push(record);
    }

    return res.status(200).send({ result });
};
export const tweetLike = async (req, res) => {
    const { tweetId, nick, mode, refreshToken } = req.body;
    if (!refreshToken) return res.status(404).send();
    const checkToken = await users.findOne({ refreshToken: refreshToken });
    if (!checkToken) return res.status(409).send();
    if (!tweetId || !nick) return res.status(400).send({ msg: 'Error' });
    const id = new ObjectId(tweetId);
    if (!mode) {
        const date = new Date();
        await likes.insertOne({
            tweetId: tweetId,
            userId: nick,
            date: date,
        });
    } else {
        await likes.deleteOne({ tweetId: tweetId, userId: nick });
    }

    const tweet = await tweets.findOne({ _id: id });
    const like = tweet.likes + (mode ? -1 : 1);
    await tweets.updateOne(
        { _id: id },
        {
            $set: { likes: like },
        }
    );
    const date = new Date();
    if (nick !== tweet.nick) {
        const user = await users.findOne({ nick: nick });
        await notifications.insertOne({
            nick: tweet.nick,
            type: 'like',
            date: date,
            user: user,
            content: tweet,
        });
    }
    return res.status(200).send({ msg: 'Success' });
};

export const handleBookmark = async (req, res) => {
    const { tweetId, nick, mode, refreshToken } = req.body;
    if (!refreshToken) return res.status(404).send();
    const checkToken = await users.findOne({ refreshToken: refreshToken });
    if (!checkToken) return res.status(409).send();
    if (!tweetId || !nick) return res.status(400).send({ msg: 'Error' });
    const id = new ObjectId(tweetId);
    if (!mode) {
        const date = new Date();
        await bookmarks.insertOne({
            tweetId: tweetId,
            userId: nick,
            date: date,
        });
    } else {
        await bookmarks.deleteOne({ tweetId: tweetId, userId: nick });
    }
    const tweet = await tweets.findOne({ _id: id });
    const bookmark = tweet.bookmarks + (mode ? -1 : 1);
    await tweets.updateOne(
        { _id: id },
        {
            $set: { bookmarks: bookmark },
        }
    );
    return res.status(200).send({ msg: 'Success' });
};

export const getLikes = async (req, res) => {
    const { nick } = req.body;
    const likedTweets = await likes.find({ userId: nick }).toArray();
    const result = likedTweets.map((el) => el.tweetId);
    return res.status(200).send({ result });
};

export const getBookmarks = async (req, res) => {
    const { nick } = req.body;
    const bookmarkTweets = await bookmarks.find({ userId: nick }).toArray();
    const result = bookmarkTweets.map((el) => el.tweetId);
    return res.status(200).send({ result });
};

export const getReplies = async (req, res) => {
    const { tweetId } = req.body;

    const result = await tweets
        .find({ parentId: tweetId })
        .sort({ _id: -1 })
        .toArray();
    return res.status(200).send({ result });
};

export const getTweetsByKey = async (req, res) => {
    const { key } = req.body;

    const result = await tweets
        .find({ text: { $regex: key, $options: 'i' }, audience: '' })
        .toArray();
    return res.status(200).send({ result });
};
export const repostTweet = async (req, res) => {
    const { tweetId, nick, mode, refreshToken } = req.body;
    if (!refreshToken) return res.status(404).send();
    const checkToken = await users.findOne({ refreshToken: refreshToken });
    if (!checkToken) return res.status(409).send();
    const id = new ObjectId(tweetId);
    const tweet = await tweets.findOne({ _id: id });
    let reposters = tweet.repostBy;
    const date = new Date();
    if (!mode) {
        reposters.push({ nick: nick, date: date });
    } else {
        reposters = reposters.filter((item) => item.nick !== nick);
    }
    await tweets.updateOne(
        { _id: id },
        {
            $set: {
                repostBy: reposters,
                reposts: tweet.reposts + (mode ? -1 : 1),
            },
        }
    );
    const user = await users.findOne({ nick: nick });
    if (!mode) {
        await notifications.insertOne({
            nick: tweet.nick,
            type: 'repost',
            date: date,
            user: user,
            content: tweet,
        });
    } else {
        const id = new ObjectId(tweet._id);
        await notifications.deleteOne({
            nick: tweet.nick,
            type: 'repost',
            'content._id': id,
        });
    }
    return res.status(200).send();
};
export const getUserFollowingTweets = async (req, res) => {
    const { nick } = req.body;
    if (!nick) return res.status(404).send();
    const following = await follows.find({ followBy: nick }).toArray();
    let result = [];
    for (let i = 0; i < following.length; i++) {
        const tweetList = await tweets
            .find({ nick: following[i].userToFollow })
            .toArray();
        for (let j = 0; j < tweetList.length; j++) {
            result.push(tweetList[j]);
        }
    }
    return res.status(200).send({ result });
};
