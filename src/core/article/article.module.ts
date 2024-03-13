import { Module } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './article.schema';
import { ArticleLoaderService } from './services/article.loader.service';
import { ArticleResolver } from './graphql/article.resolver';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    ClientModule,
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }])
  ],
  providers: [ArticleService, ArticleLoaderService, ArticleResolver]
})
export class ArticleModule {}
