import { db } from '../database/mongo.js';

export const users = db.collection('users');
export const tweets = db.collection('tweets');
export const notifications = db.collection('notifications');
export const chats = db.collection('chats');
export const lists = db.collection('lists');
export const follows = db.collection('follows');
export const communities = db.collection('communities');
export const likes = db.collection('likes');
export const bookmarks = db.collection('bookmarks');
