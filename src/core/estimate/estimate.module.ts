import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicationModule } from '../publication/publication.module';
import { Estimate, EstimateSchema } from './estimate.schema';
import { EstimateService } from './services/estimate.service';
import { EstimateLoaderService } from './services/estimate.loader.service';
import { EstimateResolver } from './graphql/estimate.resolver';
import { BundleModule } from '../bundle/bundle.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Estimate.name, schema: EstimateSchema }
    ]),
    PublicationModule,
    BundleModule
  ],
  providers: [EstimateService, EstimateLoaderService, EstimateResolver]
})
export class EstimateModule {}
