import { Module } from '@nestjs/common';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])
  ],
  providers: [OrderService]
})
export class OrderModule {}
