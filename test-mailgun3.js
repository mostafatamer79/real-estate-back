require('dotenv').config();
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');

const transport = nodemailer.createTransport(mailgunTransport({
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  }
}));

transport.sendMail({
  from: "Digital Brokerage <info@digitalbrokerage.sa>",
  to: "info@digitalbrokerage.sa",
  subject: "Test Format",
  html: "<b>Hello Format</b>"
}, function (err, info) {
  if (err) {
    console.log('Error: \n' + err);
  }
  else {
    console.log('Response: \n' + JSON.stringify(info));
  }
});
