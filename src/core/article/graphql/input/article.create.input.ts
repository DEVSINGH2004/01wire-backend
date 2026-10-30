import { Field, InputType, OmitType } from '@nestjs/graphql';
import { ArticleType } from '../type/article.type';
import { ArticleMediaContactInput } from './article.media.contact.input';

@InputType()
export class ArticleCreateInput extends OmitType(
  ArticleType,
  [
    'id',
    'prId',
    'userId',
    'status',
    'mediaContact',
    'createdAt',
    'updatedAt'
  ] as const,
  InputType
) {
  @Field(() => ArticleMediaContactInput, { nullable: true })
  mediaContact: ArticleMediaContactInput;

  // Optional "Sub-heading" in the PR form
  @Field(() => String, { nullable: true })
  summary: string;

  // Required on create (ArticleCreateDto enforces it); optional on ArticleType
  @Field(() => String)
  featureImage: string;
}
