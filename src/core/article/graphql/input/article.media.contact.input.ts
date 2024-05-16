import { InputType, PartialType } from '@nestjs/graphql';
import { ArticleMediaContactType } from '../type/article.media.contact.type';

@InputType()
export class ArticleMediaContactInput extends PartialType(
  ArticleMediaContactType,
  InputType
) {}
