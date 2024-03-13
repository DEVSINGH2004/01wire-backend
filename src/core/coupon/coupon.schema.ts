import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { CouponTypeEnum } from './enum/coupon.type.enum';
import { CouponStatusEnum } from './enum/coupon.status.enum';
import { CouponCategoryEnum } from './enum/coupon.category.enum';

type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
class Coupon extends Document {
  @Prop({
    type: String,
    default: () => uuid.v4()
  })
  _id: string;

  @Prop({
    type: String,
    default: null
  })
  userId: string;

  @Prop({
    type: String,
    enum: CouponTypeEnum,
    required: true
  })
  type: CouponTypeEnum;

  @Prop({
    type: String,
    enum: CouponCategoryEnum,
    required: true
  })
  category: CouponCategoryEnum;

  @Prop({
    type: String,
    enum: CouponStatusEnum,
    default: CouponStatusEnum.INACTIVE
  })
  status: CouponStatusEnum;

  @Prop({
    type: String,
    unique: true,
    required: true
  })
  code: string;

  @Prop({
    type: Number,
    required: true
  })
  value: number;

  @Prop({
    type: Number,
    default: 1
  })
  limit: number;

  @Prop({
    type: Number,
    default: 0
  })
  used: number;

  @Prop({ type: Date, default: null })
  expireAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const CouponSchema = SchemaFactory.createForClass(Coupon);

type CouponTypeWithoutDocument = Omit<Coupon, keyof Document> & {
  _id: string;
};

export { Coupon, CouponDocument, CouponSchema, CouponTypeWithoutDocument };
