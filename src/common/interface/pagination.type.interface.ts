export interface IPaginationType {
  currentPage: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
