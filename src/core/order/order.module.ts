import { Module } from '@nestjs/common';
import { OrderService } from './services/order.service';
import { OrderLoaderService } from './services/order.loader.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicationModule } from '../publication/publication.module';
import { ArticleModule } from '../article/article.module';
import { OrderResolver } from './graphql/order.resolver';
import { Order, OrderSchema } from './order.schema';
import { BundleModule } from '../bundle/bundle.module';
import { OrderController } from './order.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    PublicationModule,
    BundleModule,
    ArticleModule
  ],
  providers: [OrderService, OrderLoaderService, OrderResolver],
  exports: [OrderService],
  controllers: [OrderController]
})
export class OrderModule {}
