import { Field, InputType } from '@nestjs/graphql';
import { KeywordTypeEnum } from '../../enum/keyword.type.enum';

@InputType()
export class KeywordFilterInput {
  @Field(() => KeywordTypeEnum, { nullable: true })
  type?: KeywordTypeEnum;
}
