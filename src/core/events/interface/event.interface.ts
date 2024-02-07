import { EventActionEnum } from '../enum/event.action.enum';

export interface IEvent<T extends object = object> {
  action: EventActionEnum;
  data: any;
}
