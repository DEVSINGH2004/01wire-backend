import { Field, ID, InputType } from '@nestjs/graphql';
import { PrStatusEnum } from '../../enum/pr.status.enum';

@InputType()
export class PrUpdateStatusInput {
  @Field(() => ID)
  id: string;

  @Field(() => PrStatusEnum)
  status: PrStatusEnum;

  @Field(() => String, { nullable: true })
  rejectionReason: string;
}
