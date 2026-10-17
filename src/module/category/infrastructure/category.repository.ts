import { injectable } from 'tsyringe';
import CategoryModel from '@/module/category/infrastructure/category.schema.js';
import ICategoryRepository from '@/module/category/domain/interfaces/category.repository.interface.js';
import { ICategory } from '@/module/category/domain/interfaces/category.entity.interface.js';

@injectable()
export default class CategoryRepository implements ICategoryRepository {
  async create(data: Partial<ICategory>): Promise<ICategory> {
    const category = await CategoryModel.create(data);
    return category.toJSON() as ICategory;
  }

  async findById(id: string): Promise<ICategory | null> {
    const category = await CategoryModel.findById(id);
    return category ? (category.toJSON() as ICategory) : null;
  }

  async findByName(name: string, textileId?: string | null): Promise<ICategory | null> {
    const query: Record<string, any> = {
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const category = await CategoryModel.findOne(query);
    return category ? (category.toJSON() as ICategory) : null;
  }

  async findAll(filter: Record<string, any> = {}): Promise<ICategory[]> {
    const categories = await CategoryModel.find(filter).sort({ name: 1 });
    return categories.map((c) => c.toJSON() as ICategory);
  }

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    const updated = await CategoryModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return updated ? (updated.toJSON() as ICategory) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await CategoryModel.findByIdAndUpdate(id, { $set: { deleted: 'true', is_active: false } });
    return !!result;
  }
}
