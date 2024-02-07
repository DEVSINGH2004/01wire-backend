import { Injectable } from '@nestjs/common';
import { SendEmailCommandInput, SES } from '@aws-sdk/client-ses';
import { ConfigVariablesType } from 'src/config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SesService {
  constructor(
    private _ses: SES,
    private _configService: ConfigService<ConfigVariablesType>
  ) {}

  async sendEmail(receivers: string[], subject: string, body: string) {
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
