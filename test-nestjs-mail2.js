const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { MailService } = require('./dist/mail/mail.service');
const { MailerService } = require('@nestjs-modules/mailer');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const mailerService = app.get(MailerService);
  const originalSendMail = mailerService.sendMail;
  mailerService.sendMail = async function(mailOptions) {
    console.log("SENDMAIL OPTIONS:", mailOptions);
    return originalSendMail.call(this, mailOptions);
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
