import { Model, FilterQuery } from 'mongoose';
export abstract class FindOneAndFind<T> {
  protected abstract model: Model<T>;

  async findOne(query: FilterQuery<T> = {}): Promise<T> {
    return this.model.findOne(query);
  }

  async find(query: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(query);
  }
}
