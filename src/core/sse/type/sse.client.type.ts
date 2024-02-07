import { Request, Response } from 'express';
import { Subject } from 'rxjs';
import { ISseMessage } from '../interface/sse.message';

export type SseClientType = {
  isAuthenticated: boolean;
  subject: Subject<ISseMessage>;
  response: Response;
  request: Request;
  userId?: string;
};
