import { Module } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './article.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }])
  ],
  providers: [ArticleService]
})
export class ArticleModule {}
