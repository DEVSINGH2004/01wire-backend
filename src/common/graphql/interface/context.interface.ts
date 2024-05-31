import { Request, Response } from 'express';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import Logger from 'src/common/logger';
import { UserTypeWithoutDocument } from 'src/core/user/user.schema';

export interface IGraphqlContext {
  me?: IMe;
  req: Request;
  res: Response;
  logger: Logger;
}

export interface IMe {
  userId: string;
  token: string;
  type: UserTypeEnum;
  user: UserTypeWithoutDocument;
}
