import nodemailer from "nodemailer";
export const sendQuestion = async (req, res) => {
  const { name, email, message } = req.body;
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "andrzejchutas@gmail.com",
      pass: "andrzejchutas8!",
    },
  });
  const mail = {
    from: "andrzejchutas@gmail.com",
    to: "wiktor.michalski@outlook.com",
    subject: `Form message from ${name}`,
    text: `Wiadomość od ${name} / ${email}: \n ${message}`,
  };
  transporter.sendMail(mail, (error, info) => {
    if (error) {
      console.log(error);
    }
  });
};
