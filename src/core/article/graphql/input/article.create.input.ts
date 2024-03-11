import { Field, InputType, OmitType, PickType } from '@nestjs/graphql';
import { ArticleType } from '../type/article.type';
import { ArticleMediaContactInput } from './article.media.contact.input';

@InputType()
export class ArticleCreateInput extends OmitType(
  ArticleType,
  ['id', 'userId', 'mediaContact', 'createdAt', 'updatedAt'] as const,
  InputType
) {
  @Field(() => ArticleMediaContactInput, { nullable: true })
  mediaContact: ArticleMediaContactInput;
}
