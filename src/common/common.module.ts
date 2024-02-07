import { Global, Module } from '@nestjs/common';
import { MongoModule } from './mongo/mongo.module';
import { ConfigModule } from './config/config.module';
import { AwsModule } from './aws/aws.module';
import { RedisModule } from './redis/redis.module';
import { GraphqlModule } from './graphql/graphql.module';

@Global()
@Module({
  imports: [ConfigModule, AwsModule, MongoModule, RedisModule, GraphqlModule],
  exports: [ConfigModule, AwsModule, MongoModule, RedisModule, GraphqlModule]
})
export class CommonModule {}
