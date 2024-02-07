import { MessageEvent } from '@nestjs/common';

export interface ISseMessage<T extends object = object> extends MessageEvent {
  data: { event: string; data: T };
}
