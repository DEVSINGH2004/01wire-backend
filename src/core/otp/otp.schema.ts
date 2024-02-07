import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { OtpTypeEnum } from './enum/otp.type.enum';
import { OtpStatusEnum } from './enum/otp.status.enum';

type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
class Otp extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  userId: string;

  @Prop({
    type: String,
    enum: OtpTypeEnum,
    required: true
  })
  type: OtpTypeEnum;

  @Prop({
    type: String,
    required: true
  })
  receiver: string;

  @Prop({
    type: String,
    enum: OtpStatusEnum,
    default: OtpStatusEnum.PENDING
  })
  status: OtpStatusEnum;

  @Prop({
    type: String,
    required: true
  })
  otp: string;

  @Prop({
    type: Number,
    default: 0,
    required: true
  })
  attempts: number;

  @Prop({
    type: Date,
    default: null
  })
  verifiedAt: Date;

  @Prop({
    type: Date,
    default: null
  })
  expireAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const OtpSchema = SchemaFactory.createForClass(Otp);

type OtpTypeWithoutDocument = Omit<Otp, keyof Document> & { _id: string };

export { Otp, OtpDocument, OtpSchema, OtpTypeWithoutDocument };
