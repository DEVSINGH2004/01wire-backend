import { Field, InputType, PartialType, PickType } from '@nestjs/graphql';
import { UserType } from '../type/user.type';

@InputType()
export class UserFilterInput extends PartialType(
  PickType(UserType, ['email', 'fullName'] as const),
  InputType
) {

  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;
}
