import { Field, InputType, PickType } from '@nestjs/graphql';
import { ClientSocialInput } from './client.social.input';
import { ClientType } from '../type/client.type';

@InputType()
export class ClientCreateInput extends PickType(
  ClientType,
  ['title', 'type', 'category', 'email', 'website'] as const,
  InputType
) {
  @Field(() => String, { nullable: true })
  ticker?: string;

  @Field(() => ClientSocialInput, { nullable: true })
  social?: ClientSocialInput;
}
