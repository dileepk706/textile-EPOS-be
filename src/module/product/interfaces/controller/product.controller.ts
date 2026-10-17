import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { sendSuccess } from '@/shared/response_handler.js';
import IProductController from '@/module/product/domain/interfaces/product.controller.interface.js';
import IProductService, { ProductContext } from '@/module/product/domain/interfaces/product.service.interface.js';

@injectable()
export default class ProductController implements IProductController {
  constructor(
    @inject('IProductService') private readonly productService: IProductService,
  ) {}

  private getContext(req: Request): ProductContext {
    return {
      userId: req.user?.user_id ? String(req.user.user_id) : undefined,
      textileId: (req.user?.textiles_id || req.user?.textile_id) ? String(req.user.textiles_id || req.user.textile_id) : undefined,
      tenantId: req.user?.tenant_id ? String(req.user.tenant_id) : undefined,
    };
  }

  private getParamId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  createProduct = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const product = await this.productService.createProduct(req.body, context);
    return sendSuccess(res, { product }, 'Product created successfully', httpStatus.CREATED);
  };

  getProducts = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { barcode: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.barcode) {
      filter.barcode = req.query.barcode;
    }
    if (req.query.is_active !== undefined) {
      filter.is_active = req.query.is_active === 'true';
    }

    const products = await this.productService.getProducts(filter, context);
    return sendSuccess(res, { products, count: products.length }, 'Products retrieved successfully', httpStatus.OK);
  };

  getProductById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const product = await this.productService.getProductById(id);
    return sendSuccess(res, { product }, 'Product retrieved successfully', httpStatus.OK);
  };

  getProductByBarcode = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const barcode = Array.isArray(req.params.barcode) ? req.params.barcode[0] : req.params.barcode;
    const product = await this.productService.getProductByBarcode(barcode, context);
    return sendSuccess(res, { product }, 'Product found by barcode', httpStatus.OK);
  };

  updateProduct = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const product = await this.productService.updateProduct(id, req.body);
    return sendSuccess(res, { product }, 'Product updated successfully', httpStatus.OK);
  };

  deleteProduct = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    await this.productService.deleteProduct(id);
    return sendSuccess(res, {}, 'Product deleted successfully', httpStatus.OK);
  };
}
