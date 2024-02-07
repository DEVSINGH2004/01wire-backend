declare module 'mongoose' {
  export interface Model<TRawDocType> {
    softDelete(query: FilterQuery<TRawDocType>): Promise<UpdateWriteOpResult>;
  }
}
