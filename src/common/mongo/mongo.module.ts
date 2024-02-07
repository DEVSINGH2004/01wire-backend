import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { softDeletePlugin } from './plugins/softdelete.plugin';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // add a global plugin
        mongoose.plugin(softDeletePlugin);

        return {
          uri: `${configService.get('db').mongo.uri}/${
            configService.get('db').mongo.dbName
          }`,
          useNewUrlParser: true,
          useUnifiedTopology: true
        };
      }
    })
  ]
})
export class MongoModule {}
