import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import * as Fs from 'fs';
import * as path from 'path';
import { SesService } from 'src/common/aws/aws.ses.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly sesService: SesService,
    private configService: ConfigService
  ) {}

  async compileTemplate(templateName: string, params: Record<string, any>) {
    const source = Fs.readFileSync(
      path.join(
        __dirname,
        '..',
        '..',
        '..',
        'templates',
        `${templateName}.hbs`
      ),
      'utf8'
    );
    const template = Handlebars.compile(source);
    return template(params);
  }

  // Any template in /templates, sent to one address
  async sendTemplate(receiver: string, subject: string, templateName: string, params: Record<string, any>) {
    const body = await this.compileTemplate(templateName, params);
    // Local testing only: write the email to a folder instead of sending it
    const outbox = process.env.EMAIL_OUTBOX_DIR;
    if (outbox && process.env.NODE_ENV !== 'production') {
      Fs.mkdirSync(outbox, { recursive: true });
      const file = `${Date.now()}-${templateName}-${receiver.replace(/[^a-z0-9@.-]/gi, '_')}.html`;
      Fs.writeFileSync(path.join(outbox, file), `<!-- To: ${receiver} | Subject: ${subject} -->
${body}`);
      return;
    }
    await this.sesService.sendEmail([receiver], subject, body);
  }

  async sendVerificationOtp(params: {
    receiver: string;
    otp: string;
    validity: Date;
  }) {
    const { receiver, otp, validity } = params;
    let subject = null;
    subject = `${this.configService.get('app.appName', {
      infer: true
    })} - Verification OTP`;
    const body = await this.compileTemplate('otp.verification', {
      email: receiver,
      otp,
      validity
    });

    await this.sesService.sendEmail([receiver], subject, body);
  }

  async sendWelcomeEmail(params: { receiver: string }) {
    const { receiver } = params;
    let subject = null;
    subject = `Welcome to ${this.configService.get('app.appName', {
      infer: true
    })}`;
    const body = await this.compileTemplate('welcome.email', {
      email: receiver
    });

    await this.sesService.sendEmail([receiver], subject, body);
  }

  async sendRechargeAkcnowledgement(params: {
    receiver: string;
    credits: number;
    balance: number;
  }) {
    const { receiver, balance, credits } = params;
    let subject = null;
    subject = `${this.configService.get('app.appName', {
      infer: true
    })} - Recharge success for ${credits} credits`;
    const body = await this.compileTemplate('recharge.acknowledgement', {
      credits,
      balance
    });

    await this.sesService.sendEmail([receiver], subject, body);
  }
}
