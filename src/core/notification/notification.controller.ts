import { Controller, Get, Header, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

const page = (title: string, text: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
  `<body style="font-family:Arial,sans-serif;background:#f2f5f8;margin:0;padding:48px 16px">` +
  `<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;text-align:center">` +
  `<h2 style="margin:0 0 12px;color:#344767">${title}</h2><p style="color:#555;line-height:1.5;margin:0">${text}</p></div></body></html>`;

// Link at the bottom of reminder emails: GET /email/unsubscribe?u=<userId>&t=<signature>
@Controller('email')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('/unsubscribe')
  @Header('content-type', 'text/html; charset=utf-8')
  async unsubscribe(@Query('u') userId: string, @Query('t') token: string) {
    const ok = await this.notificationService.unsubscribe(userId, token);
    return ok
      ? page('You are unsubscribed', 'You will no longer get cart or unfinished-PR reminder emails from 01 Wire. Receipts for your purchases will still be sent.')
      : page('Link not valid', 'This unsubscribe link is not valid. Please use the link from the latest email, or contact the 01 Wire team.');
  }
}
