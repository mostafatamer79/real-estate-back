import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
const mailgunTransport = require('nodemailer-mailgun-transport');

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: mailgunTransport({
          auth: {
            api_key: config.get('MAILGUN_API_KEY'),
            domain: config.get('MAILGUN_DOMAIN'),
          },
          // host: 'api.eu.mailgun.net' // Uncomment this if your Mailgun account is in the EU region
        }),
        defaults: {
          from: config.get('SMTP_FROM') || `"No Reply" <${config.get('SMTP_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
