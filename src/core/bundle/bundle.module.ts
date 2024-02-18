import { Module } from '@nestjs/common';
import { BundleService } from './services/bundle.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Bundle, BundleSchema } from './bundle.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bundle.name, schema: BundleSchema }])
  ],
  providers: [BundleService]
})
export class BundleModule {}
