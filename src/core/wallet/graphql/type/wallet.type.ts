import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('WalletType')
export class WalletType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Float)
  balance: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
