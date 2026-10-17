import { ICategory } from '@/module/category/domain/interfaces/category.entity.interface.js';
import { CreateCategoryDto } from '@/module/category/application/dtos/create-category.dto.js';
import { UpdateCategoryDto } from '@/module/category/application/dtos/update-category.dto.js';

export interface CategoryContext {
  userId?: string;
  textileId?: string;
  tenantId?: string;
}

export default interface ICategoryService {
  createCategory(data: CreateCategoryDto, context: CategoryContext): Promise<ICategory>;
  getCategories(filter?: Record<string, any>, context?: CategoryContext): Promise<ICategory[]>;
  getCategoryById(id: string): Promise<ICategory>;
  updateCategory(id: string, data: UpdateCategoryDto): Promise<ICategory>;
  deleteCategory(id: string): Promise<boolean>;
}
