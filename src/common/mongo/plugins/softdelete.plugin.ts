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
    if (Object(this.getQuery()).hasOwnProperty(DELETED_AT_FIELD_NAME)) return;
    this.where({ deletedAt: null });
  });
};
