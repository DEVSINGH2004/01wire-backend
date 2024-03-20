import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('WalletType')
export class WalletType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Int)
  balance: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
