import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import ICategoryRepository from '@/module/category/domain/interfaces/category.repository.interface.js';
import ICategoryService, { CategoryContext } from '@/module/category/domain/interfaces/category.service.interface.js';
import { ICategory } from '@/module/category/domain/interfaces/category.entity.interface.js';
import { CreateCategoryDto } from '@/module/category/application/dtos/create-category.dto.js';
import { UpdateCategoryDto } from '@/module/category/application/dtos/update-category.dto.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
export default class CategoryService implements ICategoryService {
  constructor(
    @inject('ICategoryRepository') private readonly categoryRepository: ICategoryRepository,
  ) {}

  private async resolveTextileId(contextTextileId?: string): Promise<string | null> {
    if (contextTextileId) return contextTextileId;
    const defaultTextile = await TextileModel.findOne({ is_active: true });
    return defaultTextile ? defaultTextile._id.toString() : null;
  }

  async createCategory(data: CreateCategoryDto, context: CategoryContext): Promise<ICategory> {
    const textileId = await this.resolveTextileId(context.textileId || data.textile_id || undefined);

    const existing = await this.categoryRepository.findByName(data.name, textileId);
    if (existing) {
      throw new ApiError(`Category with name '${data.name}' already exists`, httpStatus.CONFLICT);
    }

    let code = data.code ? data.code.toUpperCase().trim() : '';
    if (!code) {
      code = data.name.trim().substring(0, 4).toUpperCase();
    }

    const payload: Partial<ICategory> = {
      name: data.name.trim(),
      description: data.description || '',
      code,
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
      is_active: data.is_active !== undefined ? data.is_active : true,
      deleted: 'false',
    };

    return this.categoryRepository.create(payload);
  }

  async getCategories(filter: Record<string, any> = {}, context?: CategoryContext): Promise<ICategory[]> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }
    return this.categoryRepository.findAll(query);
  }

  async getCategoryById(id: string): Promise<ICategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category || category.deleted === 'true') {
      throw new ApiError(`Category with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<ICategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category || category.deleted === 'true') {
      throw new ApiError(`Category with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (data.name && data.name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const conflict = await this.categoryRepository.findByName(data.name, category.textile_id);
      if (conflict && conflict.id !== id) {
        throw new ApiError(`Category with name '${data.name}' already exists`, httpStatus.CONFLICT);
      }
    }

    const updated = await this.categoryRepository.update(id, data);
    if (!updated) {
      throw new ApiError('Failed to update category', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(id);
    if (!category || category.deleted === 'true') {
      throw new ApiError(`Category with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return this.categoryRepository.delete(id);
  }
}
