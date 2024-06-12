import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ClientTypeEnum } from '../../enum/client.type.enum';
import { ClientCategoryEnum } from '../../enum/client.category.enum';
import { ClientSocialType } from './client.social.type';

@ObjectType('ClientType')
export class ClientType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

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

  @Field(() => String, { nullable: true })
  ticker: string;

  @Field(() => String, { nullable: true })
  logo: string;

  @Field(() => String, { nullable: true })
  notes: string;

  @Field(() => ClientSocialType, { nullable: true })
  social: ClientSocialType;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
