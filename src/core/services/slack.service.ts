import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IncomingWebhook as SlackIncomingWebhook,
  IncomingWebhookSendArguments
} from '@slack/webhook';
import { ConfigVariablesType } from 'src/config';

@Injectable()
export class SlackService {
  private _logger = new Logger(SlackService.name);
  private _client: SlackIncomingWebhook;

  constructor(private _configService: ConfigService<ConfigVariablesType>) {
    const _slackCfg = this._configService.get('slack', { infer: true });
    this._client = new SlackIncomingWebhook(_slackCfg.webhookUrl);
  }

  async send(params: string | IncomingWebhookSendArguments) {
    try {
      await this._client.send(params);
    } catch (e) {
      this._logger.error(e);
    }
  }
}
