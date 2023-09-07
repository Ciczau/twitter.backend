import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();
const connection = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.jlaatf0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(connection, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connectToDB = await client.connect();
const db = await connectToDB.db();

const questions = db.collection("questions");
export const sendQuestion = async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(404).send();
  await questions.insertOne({ name: name, email: email, message: message });
  return res.status(200).send();
};
