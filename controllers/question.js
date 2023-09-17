import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import Joi from "joi";
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
  if (
    !name ||
    name === "" ||
    !email ||
    email === "" ||
    !message ||
    message === ""
  )
    return res.status(404).send();
  await questions.insertOne({ name: name, email: email, message: message });
  return res.status(200).send();
};

export const sendContactQuestion = async (req, res) => {
  const { email, phone, text } = req.body;

  const schema = Joi.object().keys({
    email: Joi.string().email().min(3).max(50).required(),
    phone: Joi.string().alphanum().min(9).max(9).required(),
    text: Joi.string().max(255).required(),
  });
  const dataToValidate = {
    email: email,
    phone: phone,
    text: text,
  };
  const valid = schema.validate(dataToValidate);
  console.log(valid);
  if (valid.error || !email || !phone || !text) {
    return res.status(404).send();
  }
  const transporter = nodemailer.createTransport({
    service: "outlook",
    auth: {
      user: "bot15121@outlook.com",
      pass: "haslo15121",
    },
  });
  const mailOptions = {
    from: "bot15121@outlook.com",
    to: "wiktor.michalski@outlook.com",
    subject: `Question from ${email}`,
    text: `Question from ${email} sent via Law Site\n\n${text}\n\nPhone number: ${phone}\n`,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return res.status(400).send();
    } else {
      return res.status(200).send();
    }
  });
};
