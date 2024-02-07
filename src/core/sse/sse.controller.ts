import { Controller, Req, Res, Sse } from '@nestjs/common';
import { SseService } from './sse.service';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { ISseMessage } from './interface/sse.message';
import { UserId } from 'src/common/decorator/userId.decorator';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('/subscribe')
  subscribe(
    @Req() req: Request,
    @Res() res: Response,
    @UserId() userId: string | undefined
  ): Observable<ISseMessage> {
    if (userId) req.logger.fields['uid'] = userId;
    return this.sseService.subscribe(req, res, userId);
  }
}
