import { Field, InputType, Int } from '@nestjs/graphql';
import { MAX_PER_PAGE } from 'src/common/dto/pagination.input.dto';

@InputType()
export class PaginationInput {
  @Field(() => Int, {
    description: '0-indexed page number: 0 is the first page. Must be >= 0.'
  })
  readonly currentPage: number;

  @Field(() => Int, {
    description: `Items per page, 1 to ${MAX_PER_PAGE}. Larger values are capped at ${MAX_PER_PAGE}; paginationInfo.perPage returns the value actually used.`
  })
  readonly perPage: number;
}
