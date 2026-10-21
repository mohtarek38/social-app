import mongoose, { Model, ProjectionType, QueryOptions, FilterQuery } from 'mongoose';

export abstract class BaseRepository<T> {
  constructor(private model: Model<T>) {}

  async createNewDocument(document: Partial<T>): Promise<T> {
    return await this.model.create(document);
  }

  async findOneDocument(filters: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
    return await this.model.findOne(filters, projection, options);
  }

  async findDocumentById(id: mongoose.Schema.Types.ObjectId, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
    return await this.model.findById(id, projection, options);
  }

  updateOneDocument() {}

  updateMultipleDocuments() {}

  async deleteOneDocument(filters: FilterQuery<T>) {
    return await this.model.deleteOne(filters);
  }

  async deleteMultipleDocuments(filters: FilterQuery<T>) {
    return await this.model.deleteMany(filters);
  }

  async findAndUpdateDocument(_id: mongoose.Schema.Types.ObjectId, update: Partial<T>, options?: QueryOptions<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(_id, update, { new: true, ...options });
  }

  async findAndDeleteDocument(_id: mongoose.Schema.Types.ObjectId) {
    return await this.model.findOneAndUpdate({ _id }, { isDeleted: true }, { new: true });
  }

  async findDocuments(filters: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T[]> {
    return await this.model.find(filters, projection, options);
  }
}
