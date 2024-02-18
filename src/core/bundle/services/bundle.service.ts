import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bundle } from '../bundle.schema';
import { Model } from 'mongoose';

@Injectable()
export class BundleService {
  constructor(
    @InjectModel(Bundle.name)
    protected model: Model<Bundle>
  ) {}
}
