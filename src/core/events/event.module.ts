import { Module } from '@nestjs/common';
import { EventService } from './services/event.service';
import { SlackService } from '../services/slack.service';
import { SseModule } from '../sse/sse.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [SseModule, OrderModule],
  providers: [EventService, SlackService]
})
export class EventModule {}
