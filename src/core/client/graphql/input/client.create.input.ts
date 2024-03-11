import { Field, InputType, OmitType, PickType } from '@nestjs/graphql';
import { ClientSocialInput } from './client.social.input';
import { ClientType } from '../type/client.type';

@InputType()
export class ClientCreateInput extends OmitType(
  ClientType,
  ['id', 'userId', 'social', 'createdAt', 'updatedAt'] as const,
  InputType
) {
  @Field(() => ClientSocialInput, { nullable: true })
  social?: ClientSocialInput;
}
