import { Field, InputType } from '@nestjs/graphql';
import { ClientTypeEnum } from '../../enum/client.type.enum';
import { ClientCategoryEnum } from '../../enum/client.category.enum';

@InputType()
export class ClientCreateInput {
  @Field(() => String)
  title: string;

  @Field(() => ClientTypeEnum)
  type: ClientTypeEnum;

  @Field(() => ClientCategoryEnum)
  category: ClientCategoryEnum;

  @Field(() => String)
  email: string;

  @Field(() => String)
  website: string;
}
