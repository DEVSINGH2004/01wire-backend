import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { SlackService } from 'src/core/services/slack.service';
import { EventDomainEnum } from '../enum/event.domain.enum';
import { IEvent } from '../interface/event.interface';
import { SseService } from 'src/core/sse/sse.service';
import { EventActionEnum } from '../enum/event.action.enum';
import { OrderService } from 'src/core/order/services/order.service';

@Injectable()
export class EventService {
  private _eventsCfg;

  constructor(
    private configService: ConfigService,
    private slackService: SlackService,
    private sseService: SseService,
    private orderService: OrderService
  ) {
    this._eventsCfg = this.configService.get('events', { infer: true });
  }

  @OnEvent(EventDomainEnum.SLACK)
  async _handleSlack(ev: IEvent) {
    // console.log('EVENT: ', EventDomainEnum.SLACK, JSON.stringify(ev, null, 2));
    switch (ev.action) {
      case EventActionEnum.SEND: {
        if (!this._eventsCfg['slack.msg']) return;
        await this.slackService.send(ev.data);
        break;
      }
      default:
        console.error(
          `EVENT: ${EventDomainEnum.SLACK}.${ev.action} not handled`
        );
    }
  }

  @OnEvent(EventDomainEnum.SSE)
  async _handleSse(ev: IEvent) {
    const { userId, event, ...data } = ev.data;
    if (!userId)
      throw new Error(
        `EVENT: ${EventDomainEnum.SSE}.${ev.action} : userId not found`
      );
    // console.log('EVENT: ', EventDomainEnum.SSE, JSON.stringify(ev, null, 2));
    switch (ev.action) {
      case EventActionEnum.SEND: {
        await this.sseService.send(userId, { data: { event, data } });
        break;
      }
      default:
        console.error(`EVENT: ${EventDomainEnum.SSE}.${ev.action} not handled`);
    }
  }

  @OnEvent(EventDomainEnum.KEYWORD)
  async _handleKeyword(ev: IEvent) {
    console.log(
      'EVENT: ',
      EventDomainEnum.KEYWORD,
      JSON.stringify(ev, null, 2)
    );
    switch (ev.action) {
      case EventActionEnum.DELETE: {
        break;
      }
      case EventActionEnum.UPDATE: {
        break;
      }
      default:
        console.error(
          `EVENT: ${EventDomainEnum.KEYWORD}.${ev.action} not handled`
        );
    }
  }

  @OnEvent(EventDomainEnum.ORDER)
  async _handleOrder(e: IEvent) {
    console.log('EVENT: ', EventDomainEnum.ORDER, JSON.stringify(e, null, 2));
    switch (e.action) {
      case EventActionEnum.CREATE: {
        await this.orderService.createBulk(e.data);
        break;
      }
      default:
        console.error(
          `EVENT: ${EventDomainEnum.ORDER}.${e.action} not handled`
        );
    }
  }
}
