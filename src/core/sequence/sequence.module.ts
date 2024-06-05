import { Module } from '@nestjs/common';
import { SequenceService } from './sequence.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Sequence, SequenceSchema } from './sequence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Sequence.name,
        schema: SequenceSchema
      }
    ])
  ],
  providers: [SequenceService],
  exports: [SequenceService]
})
export class SequenceModule {}
