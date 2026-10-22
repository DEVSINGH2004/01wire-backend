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
import { GraphQLError } from 'graphql';
import { TokenExpiredError, verify } from 'jsonwebtoken';
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

// Clean, uniform auth error: HTTP 401 + code UNAUTHENTICATED, no library text
const unauthenticated = (message: string) =>
  new GraphQLError(message, {
    extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } }
  });

const badRequest = (message: string) =>
  new GraphQLError(message, {
    extensions: { code: 'GRAPHQL_PARSE_FAILED', http: { status: 400 } }
  });

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
    throw badRequest('error parsing GraphQL query');
  }

  // Safely accessing operation name
  const operationName =
    parsedQuery.definitions[0]?.selectionSet?.selections[0]?.name?.value;
  if (!operationName) {
    throw badRequest('operation name could not be determined from the query');
  }

  // Every top-level field across every operation in the document. Fragment
  // spreads / inline fragments have no name and yield undefined, so they can
  // never match the public allow-list.
  const topLevelFields: string[] = parsedQuery.definitions
    .filter((def) => def.kind === 'OperationDefinition')
    .flatMap((def) =>
      def.selectionSet.selections.map((sel) => sel.name?.value)
    );

  try {
    if (!headers.authorization) {
      throw new UnauthorizedException('authorization token not found');
    }
    const token = getToken(headers.authorization);
    const decoded: any = decodeToken(token, configService);

    const userType: UserTypeEnum = decoded.userType || UserTypeEnum.USER;

    const userObj = await userService.load(decoded.userId);
    if (!userObj) {
      throw unauthenticated('Invalid session, please log in again');
    }
    if (
      userType === UserTypeEnum.USER &&
      (!userObj?.email || !userObj.isEmailVerified) &&
      !UNVERIFIED_EMAIL_ALLOWED_OPERATIONS.includes(operationName)
    ) {
      throw new ForbiddenError('email not verified yet');
    }

    const ctx: IGraphqlContext = {
      me: {
        userType,
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
    // Run anonymously only if EVERY requested field is public; otherwise a
    // public field placed first would smuggle private fields in with me: null.
    const isOperationAllowed =
      topLevelFields.length > 0 &&
      topLevelFields.every((field) => allowedOperations.includes(field));

    if (isOperationAllowed) {
      return { me: null, req, res, logger: Logger.createInstance() };
    }

    if (err instanceof GraphQLError) throw err;
    if (!headers.authorization) throw unauthenticated('Not logged in');
    if (err instanceof TokenExpiredError) {
      throw unauthenticated('Session expired, please log in again');
    }
    // Any other token problem (malformed, bad signature, bad Bearer format)
    if (
      err instanceof UnauthorizedException ||
      err?.name === 'JsonWebTokenError'
    ) {
      throw unauthenticated('Invalid session, please log in again');
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
          // Stack traces (file paths) only for local development
          includeStacktraceInErrorResponses: process.env.NODE_ENV === 'local',
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
