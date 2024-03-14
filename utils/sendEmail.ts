const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require("nodemailer");

module.exports = async (email: any, subject: any, text: any) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME || "default@gmail.com",
        pass: process.env.EMAIL_PASSWORD || "password",
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME || "default@gmail.com",
      to: email,
      subject: subject,
      text: text,
    });
    console.log("email sent successfully");
  } catch (error) {
    console.log(error);
  }
};
