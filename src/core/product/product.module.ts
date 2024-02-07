import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
  providers: [ProductService]
})
export class ProductModule {}
