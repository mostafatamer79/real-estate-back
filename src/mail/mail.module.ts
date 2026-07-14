import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
const mailgunTransport = require('nodemailer-mailgun-transport');

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('MailModule');
        const transport = buildTransport(config, logger);

        return {
          transport,
          defaults: {
            from:
              config.get('EMAIL_FROM') ||
              config.get('SMTP_FROM') ||
              `"No Reply" <${config.get('SMTP_USER') || 'noreply@example.com'}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

function buildTransport(config: ConfigService, logger: Logger) {
  const postmarkToken = config.get('POSTMARK_SERVER_TOKEN');
  if (postmarkToken) {
    logger.log('Using Postmark (SMTP) email transport');
    return {
      host: 'smtp.postmarkapp.com',
      port: 587,
      secure: false,
      auth: {
        user: postmarkToken,
        pass: postmarkToken,
      },
    };
  }

  const mailgunApiKey = config.get('MAILGUN_API_KEY');
  const mailgunDomain = config.get('MAILGUN_DOMAIN');
  if (mailgunApiKey && mailgunDomain) {
    logger.log('Using Mailgun email transport');
    return mailgunTransport({
      auth: {
        api_key: mailgunApiKey,
        domain: mailgunDomain,
      },
      // host: 'api.eu.mailgun.net' // Uncomment this if your Mailgun account is in the EU region
    });
  }

  const smtpHost = config.get('SMTP_HOST');
  const smtpUser = config.get('SMTP_USER');
  const smtpPass = config.get('SMTP_PASSWORD') || config.get('SMTP_PASS');
  if (smtpHost && smtpUser && smtpPass) {
    logger.log('Using generic SMTP email transport');
    return {
      host: smtpHost,
      port: parseInt(config.get('SMTP_PORT') || '587', 10),
      secure: config.get('SMTP_SECURE') === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };
  }

  logger.warn(
    'No email provider configured. Set POSTMARK_SERVER_TOKEN, MAILGUN_API_KEY+MAILGUN_DOMAIN, or SMTP_* variables.',
  );
  return undefined;
}
