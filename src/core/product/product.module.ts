import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.schema';
import { ProductResolver } from './graphql/product.resolver';
import { ProductLoaderService } from './services/product.loader.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
  providers: [ProductService, ProductResolver, ProductLoaderService]
})
export class ProductModule {}
