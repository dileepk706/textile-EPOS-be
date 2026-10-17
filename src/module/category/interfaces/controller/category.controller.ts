import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { sendSuccess } from '@/shared/response_handler.js';
import ICategoryController from '@/module/category/domain/interfaces/category.controller.interface.js';
import ICategoryService, { CategoryContext } from '@/module/category/domain/interfaces/category.service.interface.js';

@injectable()
export default class CategoryController implements ICategoryController {
  constructor(
    @inject('ICategoryService') private readonly categoryService: ICategoryService,
  ) {}

  private getContext(req: Request): CategoryContext {
    return {
      userId: req.user?.user_id ? String(req.user.user_id) : undefined,
      textileId: (req.user?.textiles_id || req.user?.textile_id) ? String(req.user.textiles_id || req.user.textile_id) : undefined,
      tenantId: req.user?.tenant_id ? String(req.user.tenant_id) : undefined,
    };
  }

  private getParamId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  createCategory = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const category = await this.categoryService.createCategory(req.body, context);
    return sendSuccess(res, { category }, 'Category created successfully', httpStatus.CREATED);
  };

  getCategories = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.is_active !== undefined) {
      filter.is_active = req.query.is_active === 'true';
    }

    const categories = await this.categoryService.getCategories(filter, context);
    return sendSuccess(res, { categories, count: categories.length }, 'Categories retrieved successfully', httpStatus.OK);
  };

  getCategoryById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const category = await this.categoryService.getCategoryById(id);
    return sendSuccess(res, { category }, 'Category retrieved successfully', httpStatus.OK);
  };

  updateCategory = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const category = await this.categoryService.updateCategory(id, req.body);
    return sendSuccess(res, { category }, 'Category updated successfully', httpStatus.OK);
  };

  deleteCategory = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    await this.categoryService.deleteCategory(id);
    return sendSuccess(res, {}, 'Category deleted successfully', httpStatus.OK);
  };
}
