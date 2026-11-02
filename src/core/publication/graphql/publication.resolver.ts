import {
  Resolver,
  Query,
  Args,
  Mutation,
  Context,
  ResolveField,
  Parent,
  Float
} from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { PublicationType } from './type/publication.type';
import { PublicationService } from '../services/publication.service';
import { PublicationPaginationType } from './type/publication.pagination.type';
import { PublicationFilterInput } from './input/publication.filter.input';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { PublicationCreateInput } from './input/publication.create.input';
import { PublicationUpdateInput } from './input/publication.update.input';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import { Publication } from '../publication.schema';
import {
  PublicationBulkInput,
  PublicationImportInput,
  PublicationSettingsInput
} from './input/publication.admin.input';
import {
  PublicationBulkResultType,
  PublicationImportResultType,
  PublicationSettingsType
} from './type/publication.admin.type';

const isAdmin = (ctx: IGraphqlContext) => ctx?.me?.user?.type === UserTypeEnum.ADMIN;

@Resolver(() => PublicationType)
export class PublicationResolver {
  constructor(private publicationService: PublicationService) {}

  @Query(() => PublicationPaginationType)
  async filterPublicationsPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: PublicationFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.publicationService.getFilteredPaginated(
      paginationInput,
      filterInput,
      me
    );
  }

  // Every visible offering, for the Marketplace page
  @Query(() => [PublicationType])
  async marketplaceListings() {
    return this.publicationService.getMarketplaceListings();
  }

  @Query(() => PublicationType, { nullable: true })
  async getPublicationById(
    @Args('id') id: string,
    @Context() { me }: IGraphqlContext
  ) {
    const obj = await this.publicationService.getById(id);
    // Customers only see what the catalog list shows them
    if (
      obj &&
      me?.user?.type !== UserTypeEnum.ADMIN &&
      obj.visibility !== VisibilityEnum.PUBLISHED
    )
      return null;
    return obj;
  }

  @Query(() => PublicationSettingsType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async getPublicationSettings() {
    return this.publicationService.getSettings();
  }

  @Mutation(() => PublicationType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async createPublication(
    @Args('params') params: PublicationCreateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.publicationService.create(params);
  }

  @Mutation(() => PublicationType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updatePublication(
    @Args('params') params: PublicationUpdateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.publicationService.update(params);
  }

  @Mutation(() => PublicationType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updatePublicationVisibility(
    @Args('id') id: string,
    @Args('visibility', { type: () => VisibilityEnum })
    visibility: VisibilityEnum
  ) {
    return this.publicationService.update({
      id,
      visibility
    });
  }

  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async deletePublication(
    @Args('id')
    id: string
  ): Promise<boolean> {
    return this.publicationService.delete(id);
  }

  @Mutation(() => PublicationBulkResultType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async bulkUpdatePublications(@Args('params') params: PublicationBulkInput) {
    return this.publicationService.bulk(params);
  }

  @Mutation(() => PublicationSettingsType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updatePublicationSettings(@Args('params') params: PublicationSettingsInput) {
    return this.publicationService.updateSettings(params);
  }

  @Mutation(() => PublicationImportResultType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async importPublications(@Args('params') params: PublicationImportInput) {
    return this.publicationService.importRows(params);
  }

  // ---- Admin-only fields: null for everyone else, wherever a publication is returned ----
  @ResolveField(() => Float, { nullable: true })
  vendorPriceInr(@Parent() p: Publication, @Context() ctx: IGraphqlContext) {
    return isAdmin(ctx) ? p.vendorPriceInr : null;
  }

  @ResolveField(() => Float, { nullable: true })
  markupPercent(@Parent() p: Publication, @Context() ctx: IGraphqlContext) {
    return isAdmin(ctx) ? p.markupPercent : null;
  }

  @ResolveField(() => Float, { nullable: true })
  gstPercent(@Parent() p: Publication, @Context() ctx: IGraphqlContext) {
    return isAdmin(ctx) ? p.gstPercent : null;
  }

  @ResolveField(() => String, { nullable: true })
  sourceVendor(@Parent() p: Publication, @Context() ctx: IGraphqlContext) {
    return isAdmin(ctx) ? p.sourceVendor : null;
  }

  @ResolveField(() => String, { nullable: true })
  internalNotes(@Parent() p: Publication, @Context() ctx: IGraphqlContext) {
    return isAdmin(ctx) ? p.internalNotes : null;
  }

  @ResolveField(() => String, { nullable: true })
  importBatch(@Parent() p: Publication, @Context() ctx: IGraphqlContext) {
    return isAdmin(ctx) ? p.importBatch : null;
  }
}
