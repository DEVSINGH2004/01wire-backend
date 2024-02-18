import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ArticleStatusEnum } from '../../enum/article.status.enum';

@ObjectType('ArticleType')
export class ArticleType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  content: string;

  @Field(() => String)
  summary: string;

  @Field(() => String)
  featureImage: string;

  @Field(() => [String])
  articleImages: string[];

  @Field(() => ArticleStatusEnum)
  status: ArticleStatusEnum;

  @Field(() => [String])
  notes: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
