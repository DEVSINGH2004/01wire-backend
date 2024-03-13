import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from './client.schema';
import { ClientResolver } from './graphql/client.resolver';
import { ClientLoaderService } from './services/client.loader.service';
import { ClientService } from './services/client.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }])
  ],
  providers: [ClientService, ClientResolver, ClientLoaderService],
  exports: [ClientService]
})
export class ClientModule {}
