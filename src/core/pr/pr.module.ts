import { Module } from '@nestjs/common';
import { PrService } from './services/pr.service';
import { PrLoaderService } from './services/pr.loader.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Pr, PrSchema } from './pr.schema';
import { PublicationModule } from '../publication/publication.module';
import { ArticleModule } from '../article/article.module';
import { PrResolver } from './graphql/pr.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pr.name, schema: PrSchema }]),
    PublicationModule,
    ArticleModule
  ],
  providers: [PrService, PrLoaderService, PrResolver]
})
export class PrModule {}
