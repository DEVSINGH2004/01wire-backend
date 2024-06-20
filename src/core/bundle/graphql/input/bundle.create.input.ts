import { Field, InputType, OmitType } from '@nestjs/graphql';
import { BundleType } from '../type/bundle.type';

@InputType()
export class BundleCreateInput extends OmitType(
  BundleType,
  [
    'id',
    'traffic',
    'visibility',
    'notes',
    'description',
    'createdAt',
    'updatedAt'
  ] as const,
  InputType
) {
  @Field(() => String, { nullable: true })
  description: string;
}
