import nodemailer from 'nodemailer';
import config from '../config/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static isEmailEnabled = false;

  /**
   * Initialize the email transporter
   */
  static initialize() {
    const emailConfig = config.email;

    // Check if email configuration is complete
    if (
      !emailConfig.host ||
      !emailConfig.port ||
      !emailConfig.user ||
      !emailConfig.password
    ) {
      console.warn(
        '⚠️ Email configuration is incomplete. Email functionality will be disabled.',
      );
      console.warn(
        'Missing: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD',
      );
      this.isEmailEnabled = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.port === 465, // true for 465, false for other ports
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
      });

      this.isEmailEnabled = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isEmailEnabled = false;
    }
  }

  /**
   * Check if email service is enabled
   */
  static isEnabled(): boolean {
    return this.isEmailEnabled && this.transporter !== null;
  }

  /**
   * Send an email
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isEnabled()) {
      console.log('Email service disabled - skipping email send');
      return;
    }

    try {
      const mailOptions = {
        from: config.email.from || config.email.user,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter!.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName?: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const subject = 'إعادة تعيين كلمة المرور - وظفني';

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 30px;
          }
          .reset-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .reset-button:hover {
            background-color: #1d4ed8;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">وظفني</div>
          </div>
          
          <h1 class="title">إعادة تعيين كلمة المرور</h1>
          
          <div class="content">
            <p>${firstName ? `مرحباً ${firstName}،` : 'مرحباً،'}</p>
            
            <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في وظفني.</p>
            
            <p>إذا كنت قد طلبت إعادة تعيين كلمة المرور، يرجى النقر على الزر أدناه:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">إعادة تعيين كلمة المرور</a>
            </div>
            
            <p>أو يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${resetUrl}
            </p>
          </div>
          
          <div class="warning">
            <strong>تنبيه:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
          </div>
          
          <div class="footer">
            <p>فريق وظفني</p>
            <p>إذا كان لديك أي استفسارات، يرجى التواصل معنا.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
مرحباً ${firstName ? firstName : ''}،

تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في وظفني.

إذا كنت قد طلبت إعادة تعيين كلمة المرور، يرجى زيارة الرابط التالي:
${resetUrl}

تنبيه: هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.

فريق وظفني
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}

// Initialize email service when module is loaded
EmailService.initialize();
