import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../user/user-entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOtp(user: any, otp: string) {
    const email = user.email || user; // Handle both User object and email string
    const name = user.firstName ? `${user.firstName}` : 'المستخدم';

    try {
      await this.mailerService.sendMail({
        to: email,
        // from: '"No Reply" <noreply@example.com>', // Override default from
        subject: 'كود التحقق - دير عقارك',
        template: './otp', // `.hbs` extension is appended automatically
        context: { 
          name: name,
          otp,
        },
      });
      console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        throw error;
    }
  }
}
