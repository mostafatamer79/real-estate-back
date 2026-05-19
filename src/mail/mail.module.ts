import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        // Gmail (and many SMTP providers) often reject passwords copied with spaces.
        // App Passwords are typically displayed in 4-char groups; remove whitespace just in case.
        transport: {
          host: config.get('SMTP_HOST'),
          port: Number(config.get('SMTP_PORT') ?? 587),
          secure: Number(config.get('SMTP_PORT') ?? 587) === 465, // true for 465, false for other ports
          auth: {
            user: config.get('SMTP_USER'),
            pass: String(config.get('SMTP_PASS') ?? '').replace(/\s+/g, ''),
          },
          // Useful for port 587 (STARTTLS)
          requireTLS: Number(config.get('SMTP_PORT') ?? 587) === 587,
        },
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
