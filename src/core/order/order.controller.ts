import {
  Controller,
  Get,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Auth } from '../auth/decorator/auth.decorator';
import { UserTypeEnum } from '../user/enum/user.type.enum';
import { OrderService } from './services/order.service';

@Controller('/order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('/pending')
  @Auth(UserTypeEnum.ADMIN)
  async getPendingTemplate(
    @Query('articleId', new ParseUUIDPipe())
    articleId: string,
    @Res()
    response: Response
  ) {
    return this.orderService.getPendingTemplate(articleId, response);
  }

  @Post('/upload-update')
  @Auth(UserTypeEnum.ADMIN)
  async uploadUpdate(
    @Req()
    request: Request
  ) {
    return this.orderService.uploadUpdate(request);
  }
}
