import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeywordResolver } from './graphql/keyword.resolver';
import { Keyword, KeywordSchema } from './keyword.schema';
import { KeywordLoaderService } from './services/keyword.loader.service';
import { KeywordService } from './services/keyword.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Keyword.name, schema: KeywordSchema }])
  ],
  providers: [KeywordService, KeywordLoaderService, KeywordResolver],
  exports: [KeywordService]
})
export class KeywordModule {}
