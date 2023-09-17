import nodemailer from "nodemailer";
import Joi from "joi";

const transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: "bot15121@outlook.com",
    pass: "haslo15121",
  },
});
export const sendQuestion = async (req, res) => {
  const { name, email, message } = req.body;
  const schema = Joi.object().keys({
    email: Joi.string().email().max(50).required(),
    name: Joi.string().alphanum().max(30).required(),
    message: Joi.string().max(331).required(),
  });
  const dataToValidate = {
    email: email,
    name: name,
    message: message,
  };
  const valid = schema.validate(dataToValidate);
  if (valid.error || !email || !name || !message) {
    return res.status(404).send();
  }
  const mailOptions = {
    from: "bot15121@outlook.com",
    to: "wiktor.michalski@outlook.com",
    subject: `Question from ${email}`,
    text: `Question from ${name} sent via Portfolio\n\n${message}`,
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

  const mailOptions = {
    from: "bot15121@outlook.com",
    to: "kasia.szeller@outlook.com",
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
