import { notifications } from '../database/collections.js';

export const GetNotifications = async (req, res) => {
    const { nick } = req.body;
    const nots = await notifications
        .find({ nick: nick })
        .sort({ _id: -1 })
        .toArray();
    return res.status(200).send({ nots });
};
