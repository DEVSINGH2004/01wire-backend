import { Field, InputType } from '@nestjs/graphql';
import { ClientTypeEnum } from '../../enum/client.type.enum';
import { ClientCategoryEnum } from '../../enum/client.category.enum';

@InputType()
export class ClientFilterInput {
  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => ClientTypeEnum, { nullable: true })
  type?: ClientTypeEnum;

  @Field(() => [ClientCategoryEnum], { nullable: true })
  categories?: ClientCategoryEnum[];
}
