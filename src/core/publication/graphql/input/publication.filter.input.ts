import { Field, ID, InputType } from '@nestjs/graphql';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

@InputType()
export class PublicationFilterInput {
  @Field(() => [ID], { nullable: true })
  filterIds: string[];

  @Field(() => [VisibilityEnum], { nullable: true })
  visibility: VisibilityEnum[];
}
