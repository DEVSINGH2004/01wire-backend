import { SseClientType } from './type/sse.client.type';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { ISseMessage } from './interface/sse.message';

@Injectable()
export class SseService {
  private _clientMap: {
    [userId: string]: {
      [connectionId: string]: SseClientType;
    };
  };

  constructor() {
    this._clientMap = {};
  }

  private _dispatch(client: SseClientType, message: ISseMessage) {
    client.request.logger.log({
      message: 'Sending sse-message to client',
      'sse-message': message
    });
    client.subject.next(message);
  }

  subscribe(request: Request, response: Response, userId?: string) {
    const id = uuid();
    const isAuthenticated = !!userId;
    if (!userId) {
      userId = id;
    }
    const client = {
      isAuthenticated,
      subject: new Subject<ISseMessage>(),
      response,
      request,
      userId
    };

    if (!this._clientMap[userId]) this._clientMap[userId] = {};
    this._clientMap[userId][id] = client;

    request.on('close', () => {
      const client = this._clientMap[userId][id];
      if (!client) return;
      client.request.logger.log('Closing sse-connection');
      client.subject.complete();
      delete this._clientMap[userId][id];

      if (!Object.keys(this._clientMap[userId]).length) {
        delete this._clientMap[userId];
      }
    });
    return client.subject.asObservable();
  }

  async send(userId: string, message: ISseMessage) {
    const connections = this._clientMap[userId];
    if (!connections) return;
    for (const conn of Object.values(connections))
      this._dispatch(conn, message);
  }

  async broadcast<T extends Record<string, any> = Record<string, any>>(
    event: string,
    payload: T,
    isAuthenticated = false
  ) {
    const message: ISseMessage<T> = {
      data: { event, data: payload }
    };

    Object.values(this._clientMap).forEach((client) => {
      const connections = Object.values(client);
      connections.forEach((conn) => {
        if (isAuthenticated) {
          if (conn.isAuthenticated) this._dispatch(conn, message);
        } else this._dispatch(conn, message);
      });
    });
  }
}
