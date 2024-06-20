import { FilterQuery, Schema } from 'mongoose';

const DELETED_AT_FIELD_NAME = 'deletedAt';

export const softDeletePlugin = async <T>(schema: Schema<T>) => {
  // Add a deletedAt field to the schema
  schema.add({
    deletedAt: { type: Date, default: null }
  } as any);

  // Define a static method to perform soft deletion
  schema.statics.softDelete = function (conditions: FilterQuery<T>) {
    const update = {
      $set: { [DELETED_AT_FIELD_NAME]: new Date() }
    };
    return this.updateMany(conditions, update);
  };

  // Define a query middleware to exclude soft-deleted documents
  schema.pre(['find', 'findOne'], function () {
    const query = this.getQuery();
    if (Object(query).hasOwnProperty(DELETED_AT_FIELD_NAME)) {
      // Hacky solution: if deletedAt is sent true then we need to include deleted docs as well
      if (query.deletedAt === true) {
        delete query.deletedAt;
      }
      return;
    }
    this.where({ deletedAt: null });
  });
};
