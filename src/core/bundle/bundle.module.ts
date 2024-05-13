import { Module } from '@nestjs/common';
import { BundleService } from './services/bundle.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Bundle, BundleSchema } from './bundle.schema';
import { BundleLoaderService } from './services/bundle.loader.service';
import { BundleResolver } from './graphql/bundle.resolver';
import { PublicationModule } from '../publication/publication.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bundle.name, schema: BundleSchema }]),
    PublicationModule
  ],
  providers: [BundleService, BundleLoaderService, BundleResolver],
  exports:[BundleService]
})
export class BundleModule {}
