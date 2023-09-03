import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();
const connection = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.ulu0evt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(connection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const connectToDB = await client.connect();
export const db = await connectToDB.db();
