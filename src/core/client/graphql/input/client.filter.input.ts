import { Field, InputType, PartialType, PickType } from '@nestjs/graphql';
import { ClientCategoryEnum } from '../../enum/client.category.enum';
import { ClientCreateInput } from './client.create.input';

@InputType()
export class ClientFilterInput extends PartialType(
  PickType(ClientCreateInput, ['title', 'type'] as const),
  InputType
) {
  @Field(() => [ClientCategoryEnum], { nullable: true })
  categories?: ClientCategoryEnum[];
}
