import { Module } from '@nestjs/common';
import { EventService } from './services/event.service';
import { SlackService } from '../services/slack.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [SseModule],
  providers: [EventService, SlackService]
})
export class EventModule {}
