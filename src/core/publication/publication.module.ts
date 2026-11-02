import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Publication, PublicationSchema } from './publication.schema';
import {
  PublicationSettings,
  PublicationSettingsSchema
} from './publication.settings.schema';
import { PublicationLoaderService } from './services/publication.loader.service';
import { PublicationResolver } from './graphql/publication.resolver';
import { PublicationService } from './services/publication.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publication.name, schema: PublicationSchema },
      { name: PublicationSettings.name, schema: PublicationSettingsSchema }
    ])
  ],
  providers: [
    PublicationService,
    PublicationResolver,
    PublicationLoaderService
  ],
  exports: [PublicationService]
})
export class PublicationModule {}
