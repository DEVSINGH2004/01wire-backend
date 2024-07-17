import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class WalletBalanceUpdateInput {
  @Field(() => Int)
  amount: number;

  @Field(() => String)
  notes: string;

  @Field(() => ID)
  userId: string;
}
