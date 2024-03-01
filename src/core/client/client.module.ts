import { Module } from '@nestjs/common';
import { ClientService } from './services/client.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from './client.schema';
import { ClientLoaderService } from './services/client.loader.service';
import { ClientResolver } from './graphql/client.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }])
  ],
  providers: [ClientService, ClientResolver, ClientLoaderService]
})
export class ClientModule {}
