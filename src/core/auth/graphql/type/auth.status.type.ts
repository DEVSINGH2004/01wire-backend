import { Field, ObjectType } from '@nestjs/graphql';
import { AuthStatusEnum } from '../../enum/auth.status.enum';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

@ObjectType('AuthStatusType')
export class AuthStatusType {
  @Field(() => UserTypeEnum, { nullable: true })
  type?: UserTypeEnum;

  @Field(() => AuthStatusEnum, { nullable: true })
  status?: AuthStatusEnum;

  @Field(() => String, { nullable: true })
  token?: string;

  @Field(() => Date, { nullable: true })
  expireAt?: Date;
}
