import { Request, Response } from 'express';

export default interface ICategoryController {
  createCategory(req: Request, res: Response): Promise<any>;
  getCategories(req: Request, res: Response): Promise<any>;
  getCategoryById(req: Request, res: Response): Promise<any>;
  updateCategory(req: Request, res: Response): Promise<any>;
  deleteCategory(req: Request, res: Response): Promise<any>;
}
