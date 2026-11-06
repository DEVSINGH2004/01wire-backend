import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Publication, PublicationSchema } from '../publication/publication.schema';
import { OfflineOrder, OfflineOrderSchema } from './offline-order.schema';
import { OfflineOrdersService } from './offline-orders.service';
import { OfflineOrdersResolver } from './offline-orders.resolver';

// Admin "Offline Orders": orders taken outside the dashboard, imported from the monthly sheet
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OfflineOrder.name, schema: OfflineOrderSchema },
      { name: Publication.name, schema: PublicationSchema }
    ])
  ],
  providers: [OfflineOrdersService, OfflineOrdersResolver],
  exports: [OfflineOrdersService]
})
export class OfflineOrdersModule {}
