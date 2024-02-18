import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserTypeEnum } from '../../enum/user.type.enum';

@ObjectType('UserType')
export class UserType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  fullName: string;

  @Field(() => UserTypeEnum)
  type: UserTypeEnum;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  phoneNumber?: string;

  @Field(() => Boolean)
  isEmailVerified: boolean;

  @Field(() => Boolean)
  isKycVerified: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
