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


  async sendMarketingRequestNotification(email: string, requestType: string, id: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'طلب تسويق جديد',
        template: './marketing-request', 
        context: {
          type: requestType,
          id: id,
        },
      });
      console.log(`Marketing notification sent to ${email}`);
    } catch (error) {
      console.error(`Error sending marketing email to ${email}:`, error);
      // Don't throw, just log
    }
  }

  async sendNewServiceRequestNotification(email: string, serviceRequest: any) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'إشعار بطلب خدمة جديد يحتاج للمراجعة',
        template: './admin-notification',
        context: {
          id: serviceRequest.id.substring(0, 8),
          category: serviceRequest.category,
          serviceType: serviceRequest.serviceType,
          clientName: serviceRequest.clientName,
          phone: serviceRequest.phone,
        },
      });
      console.log(`Admin notification sent to ${email}`);
    } catch (error) {
      console.error(`Error sending admin notification email to ${email}:`, error);
    }
  }

  async sendMarketingEmail(email: string, subject: string, content: string, category: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        template: './marketing-campaign', 
        context: {
          category,
          content,
        },
      });
      console.log(`Marketing email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending marketing email to ${email}:`, error);
    }
  }

  async sendLegalRequestNotification(email: string, request: any) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'طلب خدمة قانونية جديد',
        template: './legal-request',
        context: {
          id: request.id.substring(0, 8),
          serviceType: request.serviceType,
          clientName: request.clientName,
          phone: request.phone,
          city: request.city,
          district: request.district,
          description: request.description || '',
          firstParty: request.firstParty,
          secondParty: request.secondParty,
        },
      });
      console.log(`Legal request notification sent to ${email}`);
    } catch (error) {
      console.error(`Error sending legal request email to ${email}:`, error);
    }
  }

  async sendLegalInvoiceToClient(email: string, request: any) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'فاتورة طلبك القانوني - يرجى الرد',
        template: './legal-invoice',
        context: {
          id: request.id.substring(0, 8),
          invoiceNumber: request.invoiceNumber,
          serviceType: request.serviceType,
          invoicePrice: request.invoicePrice,
          clientName: request.clientName,
        },
      });
      console.log(`Legal invoice sent to client at ${email}`);
    } catch (error) {
      console.error(`Error sending legal invoice email to ${email}:`, error);
    }
  }

  async sendLegalDecisionNotification(email: string, request: any, decision: 'accepted' | 'rejected') {
    try {
      const subject = decision === 'accepted' 
        ? `العميل قبل الفاتورة - ${request.serviceType}` 
        : `العميل رفض الفاتورة - ${request.serviceType}`;
      await this.mailerService.sendMail({
        to: email,
        subject,
        template: './legal-decision',
        context: {
          id: request.id.substring(0, 8),
          invoiceNumber: request.invoiceNumber,
          serviceType: request.serviceType,
          invoicePrice: request.invoicePrice,
          clientName: request.clientName,
          decision,
          decisionText: decision === 'accepted' ? 'قَبِل' : 'رَفَض',
        },
      });
      console.log(`Legal decision notification sent to ${email}`);
    } catch (error) {
      console.error(`Error sending legal decision email to ${email}:`, error);
    }
  }
}

