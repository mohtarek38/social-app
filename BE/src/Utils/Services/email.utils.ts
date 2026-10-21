import nodemailer from "nodemailer";
import { EventEmitter } from "node:events";
import { IEmailArguments } from "../../Common/Interfaces/interface.barrel";

export const sendEmail = async ({ to, subject, content, attachments = [] }: IEmailArguments) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", //smtp.gmail.com
    port: 465,
    secure: true,
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `no-reply <${process.env.USER_EMAIL}>`,
    to,
    subject,
    html: content,
    attachments,
  });

  console.log("info:", info);
  return info;
};

export const emitter = new EventEmitter();

emitter.on("sendEmail", (args) => {
  //sendEmail
  console.log(args.content);
  // sendEmail(args);
});
