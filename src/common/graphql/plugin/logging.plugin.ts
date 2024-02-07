import { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { IGraphqlContext } from '../interface/context.interface';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin<IGraphqlContext> {
  async requestDidStart() {
    return {
      async willSendResponse(
        requestContext: GraphQLRequestContext<IGraphqlContext>
      ) {
        if (requestContext.operationName === 'IntrospectionQuery') {
          return;
        }
        const {
          contextValue: { logger },
          errors
        } = requestContext;

        logger.fields['responseBody'] = requestContext.response.body;
        if (errors && errors.length) {
          logger.fields['errors'] = errors;
          logger.error('Request error - willSendResponse');
        } else {
          logger.fields['respCode'] = 200;
          logger.log('Request success - willSendResponse');
        }
      }
    };
  }
}
