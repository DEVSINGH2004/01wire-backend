import { Injectable, Logger } from '@nestjs/common';
import { SendEmailCommandInput, SES } from '@aws-sdk/client-ses';
import { ConfigVariablesType } from 'src/config';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Sends every email of the app. Uses SMTP (e.g. Gmail) when SMTP_HOST is set, otherwise AWS SES.
@Injectable()
export class SesService {
  private readonly _logger = new Logger(SesService.name);
  private _smtp: nodemailer.Transporter = null;

  constructor(
    private _ses: SES,
    private _configService: ConfigService<ConfigVariablesType>
  ) {
    const smtp = this._configService.get('smtp', { infer: true });
    if (smtp?.host) {
      this._smtp = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined
      });
      this._logger.log(`Emails go through SMTP ${smtp.host}:${smtp.port} as ${smtp.from}`);
    } else {
      this._logger.log('Emails go through AWS SES');
    }
  }

  async sendEmail(receivers: string[], subject: string, body: string) {
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
}
