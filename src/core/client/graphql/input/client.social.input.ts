import { InputType, PartialType } from '@nestjs/graphql';
import { ClientSocialType } from '../type/client.social.type';

@InputType()
export class ClientSocialInput extends PartialType(
  ClientSocialType,
  InputType
) {}
