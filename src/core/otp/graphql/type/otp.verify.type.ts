import { Field, ObjectType } from '@nestjs/graphql';
import { AuthStatusEnum } from 'src/core/auth/enum/auth.status.enum';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

@ObjectType('OtpVerifyType')
export class OtpVerifyType {
  @Field(() => UserTypeEnum, { nullable: true })
  type?: UserTypeEnum;

  @Field(() => String)
  token: string;

  @Field(() => Date, { nullable: true })
  expireAt?: Date;
}
