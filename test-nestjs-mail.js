const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { MailService } = require('./dist/mail/mail.service');
const { MailerService } = require('@nestjs-modules/mailer');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const mailerService = app.get(MailerService);
  const originalSend = mailerService.transporter.send;
  mailerService.transporter.send = function(mail, callback) {
    console.log("SEND CALLED WITH:", Object.keys(mail.data));
    console.log("HTML:", mail.data.html ? mail.data.html.substring(0, 50) : 'none');
    console.log("TEMPLATE:", mail.data.template);
    return originalSend.call(this, mail, callback);
  };
  
  const mailService = app.get(MailService);
  
  try {
    await mailService.sendOtp('info@digitalbrokerage.sa', '123456');
    console.log('OTP Email sent successfully via NestJS');
  } catch (err) {
    console.error('Failed to send OTP:', err);
  }
  
  await app.close();
}

bootstrap();
