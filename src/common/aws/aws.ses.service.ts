import { Injectable, Logger } from '@nestjs/common';
import { SendEmailCommandInput, SES } from '@aws-sdk/client-ses';
import { ConfigVariablesType } from 'src/config';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const SEND_TIMEOUT_MS = 15000; // a broken mail setup fails fast instead of hanging a request

// Sends every email of the app, through the first one that is set up:
//   1. Brevo email API (BREVO_API_KEY) - HTTPS, works on Render's free plan
//   2. SMTP, e.g. Gmail (SMTP_HOST) - Render's free plan blocks SMTP ports
//   3. AWS SES
@Injectable()
export class SesService {
  private readonly _logger = new Logger(SesService.name);
  private _smtp: nodemailer.Transporter = null;
  private readonly _brevo: { apiKey: string; apiUrl: string; from: string };

  constructor(
    private _ses: SES,
    private _configService: ConfigService<ConfigVariablesType>
  ) {
    this._brevo = this._configService.get('brevo', { infer: true });
    const smtp = this._configService.get('smtp', { infer: true });
    if (this._brevo?.apiKey) {
      this._logger.log(`Emails go through the Brevo API as ${this._brevo.from}`);
    } else if (smtp?.host) {
      this._smtp = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
        connectionTimeout: SEND_TIMEOUT_MS,
        greetingTimeout: SEND_TIMEOUT_MS,
        socketTimeout: SEND_TIMEOUT_MS
      });
      this._logger.log(`Emails go through SMTP ${smtp.host}:${smtp.port} as ${smtp.from}`);
    } else {
      this._logger.log('Emails go through AWS SES');
    }
  }

  async sendEmail(receivers: string[], subject: string, body: string) {
    if (this._brevo?.apiKey) return this.sendWithBrevo(receivers, subject, body);
    if (this._smtp) {
      const from = this._configService.get('smtp.from', { infer: true });
      return this._smtp.sendMail({ from: `"01 Wire" <${from}>`, to: receivers, subject, html: body });
    }
    const senderEmail = this._configService.get('aws.ses.senderEmail', {
      infer: true
    });
    const params: SendEmailCommandInput = {
      Source: senderEmail,
      Destination: {
        ToAddresses: receivers
      },
      ReplyToAddresses: [],
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: body
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      }
    };
    return this._ses.sendEmail(params);
  }

  // https://developers.brevo.com/reference/sendtransacemail
  private async sendWithBrevo(receivers: string[], subject: string, html: string) {
    const res = await fetch(`${this._brevo.apiUrl}/smtp/email`, {
      method: 'POST',
      headers: { 'api-key': this._brevo.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: '01 Wire', email: this._brevo.from },
        to: receivers.map((email) => ({ email })),
        subject,
        htmlContent: html
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${text.slice(0, 200)}`);
    return JSON.parse(text || '{}');
  }
}
