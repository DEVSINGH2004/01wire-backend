import { Field, ObjectType } from '@nestjs/graphql';
import { KeywordTypeEnum } from '../../enum/keyword.type.enum';

@ObjectType('KeywordType')
export class KeywordType {
  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => KeywordTypeEnum)
  type: KeywordTypeEnum;

  @Field(() => String)
  userId: string;

  @Field(() => [String])
  keywords: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
