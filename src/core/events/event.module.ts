import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { SlackService } from '../services/slack.service';
import { SseModule } from '../sse/sse.module';
import { TransactionModule } from '../transaction/transaction.module';
import { EventService } from './services/event.service';

@Module({
  imports: [SseModule, OrderModule, TransactionModule],
  providers: [EventService, SlackService]
})
export class EventModule {}
