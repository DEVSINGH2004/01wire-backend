import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sequence } from './sequence.schema';

@Injectable()
export class SequenceService {
  constructor(@InjectModel(Sequence.name) private model: Model<Sequence>) {}

  async getNextSequence(name: string): Promise<number> {
    const obj = await this.model.findOneAndUpdate(
      { name },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return obj.value;
  }
}
