import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Publication, PublicationSchema } from './publication.schema';
import { PublicationLoaderService } from './services/publication.loader.service';
import { PublicationResolver } from './graphql/publication.resolver';
import { PublicationService } from './services/publication.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Publication.name, schema: PublicationSchema }])
  ],
  providers: [PublicationService, PublicationResolver, PublicationLoaderService]
})
export class PublicationModule {}
