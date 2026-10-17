import { ICategory } from '@/module/category/domain/interfaces/category.entity.interface.js';

export default interface ICategoryRepository {
  create(data: Partial<ICategory>): Promise<ICategory>;
  findById(id: string): Promise<ICategory | null>;
  findByName(name: string, textileId?: string | null): Promise<ICategory | null>;
  findAll(filter?: Record<string, any>): Promise<ICategory[]>;
  update(id: string, data: Partial<ICategory>): Promise<ICategory | null>;
  delete(id: string): Promise<boolean>;
}
