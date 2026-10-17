import { Request, Response } from 'express';

export default interface IProductController {
  createProduct(req: Request, res: Response): Promise<any>;
  getProducts(req: Request, res: Response): Promise<any>;
  getProductById(req: Request, res: Response): Promise<any>;
  getProductByBarcode(req: Request, res: Response): Promise<any>;
  updateProduct(req: Request, res: Response): Promise<any>;
  deleteProduct(req: Request, res: Response): Promise<any>;
}
