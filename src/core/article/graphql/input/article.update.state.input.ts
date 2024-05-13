import { Field, ID, InputType } from '@nestjs/graphql';
import { ArticleStatusEnum } from '../../enum/article.status.enum';

@InputType()
export class ArticleUpdateStateInput {
  @Field(() => ID)
  id: string;

  @Field(() => ArticleStatusEnum)
  status: ArticleStatusEnum;

  @Field(() => String, { nullable: true })
  rejectionReason: string;
}
