import { Field, ID, InputType } from '@nestjs/graphql';
import { ClientTypeEnum } from '../../enum/client.type.enum';
import { ClientCategoryEnum } from '../../enum/client.category.enum';
import { ClientSocialInput } from './client.social.input';

@InputType()
export class ClientUpdateInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => ClientTypeEnum, { nullable: true })
  type?: ClientTypeEnum;

  @Field(() => ClientCategoryEnum, { nullable: true })
  category?: ClientCategoryEnum;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  website?: string;

  @Field(() => String, { nullable: true })
  ticker?: string;

  @Field(() => ClientSocialInput, { nullable: true })
  social?: ClientSocialInput;
}
