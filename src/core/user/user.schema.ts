import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { RoleEnum } from './enum/role.enum';
import { UserTypeEnum } from './enum/user.type.enum';

type UserDocument = User & Document;

@Schema({ timestamps: true })
class User extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    default: null
  })
  fullName: string;

  @Prop({
    type: String,
    unique: true
  })
  walletId: string;

  @Prop({
    type: String,
    enum: UserTypeEnum,
    default: UserTypeEnum.USER
  })
  type: UserTypeEnum;

  @Prop({
    type: String,
    required: true,
    index: true,
    unique: true
  })
  email: string;

  @Prop({
    type: String,
    default: null
  })
  phoneNumber: string;

  @Prop({
    type: String,
    default: null,
    select: false
  })
  password: string;

  /**Email with all dots removed*/
  @Prop({
    type: String,
    required: true
  })
  rawEmail?: string;

  @Prop({
    type: Boolean,
    default: false
  })
  isEmailVerified: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  isKycVerified: boolean;

  @Prop({
    type: Boolean,
    default: false
  })
  isBlocked: boolean;

  @Prop({
    type: [String],
    enum: RoleEnum
  })
  roles: RoleEnum[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

type UserTypeWithoutDocument = Omit<User, keyof Document> & { _id: string };

export { User, UserDocument, UserSchema, UserTypeWithoutDocument };
