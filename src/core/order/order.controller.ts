import {
  Controller,
  Get,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res
} from '@nestjs/common';
import { OrderService } from './services/order.service';
import { Request, Response } from 'express';
import { Auth } from '../auth/decorator/auth.decorator';
import { AuthTypeEnum } from 'src/common/enum/auth.enum';

@Controller('/order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('/pending')
  // @Auth(AuthTypeEnum.ADMIN)
  // TODO: Auth decorator only accepts private auth type, discuss to add admin there
  async getPendingTemplate(
    @Query('articleId', new ParseUUIDPipe())
    articleId: string,
    @Res()
    response: Response
  ) {
    return this.orderService.getPendingTemplate(articleId, response);
  }

  @Post('/upload-update')
  // @Auth(AuthTypeEnum.ADMIN)
  async uploadUpdate(
    @Req()
    request: Request
  ) {
    return this.orderService.uploadUpdate(request);
  }
}
