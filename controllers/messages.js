import { db } from '../database/mongo.js';
import { generateRandomCode } from './users.js';
import { v2 as cloudinary } from 'cloudinary';
import { chats, users } from '../database/collections.js';

cloudinary.config({
    cloud_name: 'df4tupotg',
    api_key: '626447796253867',
    api_secret: 'mPXy5pytK8szulO6NY69mlAtP8Y',
});

export const newChat = async (req, res) => {
    const { firstUser, secondUser } = req.body;
    const id = generateRandomCode();
    const userArray = [firstUser, secondUser];
    const isChatAlreadyCreated = await chats.findOne({ userArray: userArray });
    if (isChatAlreadyCreated)
        return res.send({ chatId: isChatAlreadyCreated.id });
    const newChat = await chats.insertOne({ id: id, userArray: userArray });
    db.createCollection(id);

    const user = await users.findOne({ nick: secondUser });
    const chat = { user: user, id: newChat.insertedId.toString() };
    return res.status(200).send({ chat });
};

export const getUserChats = async (req, res) => {
    const { nick } = req.body;
    const userChats = await chats
        .find({ userArray: { $in: [nick] } })
        .toArray();
    let tab = [];
    for (let i = 0; i < userChats.length; i++) {
        const user =
            userChats[i].userArray[0] === nick
                ? userChats[i].userArray[1]
                : userChats[i].userArray[0];
        const userData = await users.findOne({ nick: user });
        tab.push({ user: userData, id: userChats[i].id });
    }
    return res.status(200).send({ tab });
};

export const sendMessage = async (req, res) => {
    try {
        const { file } = req;
        const { sender, receiver, message, id, refreshToken } = req.body;
        if (!refreshToken) return res.status(404).send();
        const checkToken = await users.findOne({ refreshToken: refreshToken });
        if (!checkToken) return res.status(409).send();

        const chatCollection = db.collection(id);
        if (message) {
            await chatCollection.insertOne({
                sender: sender,
                receiver: receiver,
                message: message,
                image: '',
            });
        }
        const fileName = generateRandomCode();
        if (file) {
            await cloudinary.uploader.upload(file.path, {
                public_id: fileName,
            });
            await chatCollection.insertOne({
                sender: sender,
                receiver: receiver,
                message: '',
                image: `https://res.cloudinary.com/df4tupotg/image/upload/${fileName}`,
            });
        }
        const imageUrl = file
            ? `https://res.cloudinary.com/df4tupotg/image/upload/${fileName}`
            : undefined;
        return res.status(200).send({ imageUrl });
    } catch (err) {
        return res.status(404).send();
    }
};

export const getChat = async (req, res) => {
    const { id } = req.body;

    if (!id) return res.status(404).send();
    const chatCollection = db.collection(id);
    const chat = await chatCollection.find({}).sort({ _id: -1 }).toArray();
    return res.status(200).send({ chat });
};
