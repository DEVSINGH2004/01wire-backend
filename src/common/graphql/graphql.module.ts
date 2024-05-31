import {
  ApolloDriver,
  ApolloDriverConfig,
  ForbiddenError
} from '@nestjs/apollo';
import { Module, UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import gql from 'graphql-tag';
import { verify } from 'jsonwebtoken';
import { UserService } from 'src/core/user/services/user.service';
import { UserModule } from 'src/core/user/user.module';
import { UserTypeEnum } from '../../core/user/enum/user.type.enum';
import Logger from '../logger';
import { ConfigVariablesType } from './../../config/';
import { IGraphqlContext } from './interface/context.interface';
import { LoggingPlugin } from './plugin/logging.plugin';

const UNVERIFIED_EMAIL_ALLOWED_OPERATIONS: string[] = [];

const getToken = (authToken: string): string => {
  const match = authToken.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new UnauthorizedException();
  }
  return match[1];
};

const decodeToken = (tokenString: string, configService: ConfigService) => {
  const decoded = verify(tokenString, configService.get('auth').jwtSecret);
  if (!decoded) {
    throw new UnauthorizedException();
  }
  return decoded;
};

const genCtx = async (
  { req, res }: { req: Request; res: Response },
  configService: ConfigService,
  userService: UserService
): Promise<IGraphqlContext> => {
  const { body, headers } = req;

  let parsedQuery;
  try {
    parsedQuery = gql(body.query);
  } catch (error) {
    throw new Error('error parsing GraphQL query');
  }

  // Safely accessing operation name
  const operationName =
    parsedQuery.definitions[0]?.selectionSet?.selections[0]?.name?.value;
  if (!operationName) {
    throw new Error('operation name could not be determined from the query');
  }

  try {
    if (!headers.authorization) {
      throw new UnauthorizedException('authorization token not found');
    }
    const token = getToken(headers.authorization);
    const decoded: any = decodeToken(token, configService);

    const type: UserTypeEnum = decoded.type || UserTypeEnum.USER;

    const userObj = await userService.load(decoded.userId);
    if (
      type === UserTypeEnum.USER &&
      (!userObj?.email || !userObj.isEmailVerified) &&
      !UNVERIFIED_EMAIL_ALLOWED_OPERATIONS.includes(operationName)
    ) {
      throw new ForbiddenError('email not verified yet');
    }

    const ctx: IGraphqlContext = {
      me: {
        type,
        token: headers.authorization,
        userId: decoded.userId,
        user: userObj
      },
      req,
      res,
      logger: Logger.createInstance()
    };

    return ctx;
  } catch (err) {
    const allowedOperations = configService.get<string>('allowedOperations');
    const isOperationAllowed = allowedOperations.includes(operationName);

    if (isOperationAllowed) {
      return { me: null, req, res, logger: Logger.createInstance() };
    }

    throw err;
  }
};

@Module({
  providers: [LoggingPlugin],
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: async (
        configService: ConfigService<ConfigVariablesType>,
        userService: UserService
      ) => {
        return {
          csrfPrevention: false,
          introspection: true,
          playground: true,
          autoSchemaFile: true,
          context: (param: { req: Request; res: Response }) =>
            genCtx(param, configService, userService)
        };
      },
      imports: [ConfigModule, UserModule],
      inject: [ConfigService, UserService]
    })
  ]
})
export class GraphqlModule {}
