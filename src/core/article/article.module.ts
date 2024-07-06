import { Module, forwardRef } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './article.schema';
import { ArticleLoaderService } from './services/article.loader.service';
import { ArticleResolver } from './graphql/article.resolver';
import { ClientModule } from '../client/client.module';
import { PublicationModule } from '../publication/publication.module';
import { BundleModule } from '../bundle/bundle.module';
import { WalletModule } from '../wallet/wallet.module';
import { SequenceModule } from '../sequence/sequence.module';
import { UserModule } from '../user/user.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
    ClientModule,
    BundleModule,
    PublicationModule,
    WalletModule,
    SequenceModule,
    UserModule,
    forwardRef(() => OrderModule)
  ],
  providers: [ArticleService, ArticleLoaderService, ArticleResolver],
  exports: [ArticleService]
})
export class ArticleModule {}
