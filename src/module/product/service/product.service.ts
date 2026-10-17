import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import IProductRepository from '@/module/product/domain/interfaces/product.repository.interface.js';
import IProductService, { ProductContext } from '@/module/product/domain/interfaces/product.service.interface.js';
import { IProduct } from '@/module/product/domain/interfaces/product.entity.interface.js';
import { CreateProductDto } from '@/module/product/application/dtos/create-product.dto.js';
import { UpdateProductDto } from '@/module/product/application/dtos/update-product.dto.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
export default class ProductService implements IProductService {
  constructor(
    @inject('IProductRepository') private readonly productRepository: IProductRepository,
  ) {}

  private async resolveTextileId(contextTextileId?: string): Promise<string | null> {
    if (contextTextileId) return contextTextileId;
    const defaultTextile = await TextileModel.findOne({ is_active: true });
    return defaultTextile ? defaultTextile._id.toString() : null;
  }

  private generateBarcode(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `${timestamp}${random}`;
  }

  async createProduct(data: CreateProductDto, context: ProductContext): Promise<IProduct> {
    const textileId = await this.resolveTextileId(context.textileId || data.textile_id || undefined);

    let barcode = data.barcode ? data.barcode.trim() : '';
    if (!barcode) {
      barcode = this.generateBarcode();
    }

    const existing = await this.productRepository.findByBarcode(barcode, textileId);
    if (existing) {
      throw new ApiError(`Product with barcode '${barcode}' already exists`, httpStatus.CONFLICT);
    }

    const payload: Partial<IProduct> = {
      name: data.name.trim(),
      description: data.description || '',
      barcode,
      deleted: data.deleted || 'false',
      unit: data.unit || 'pcs',
      sku: data.sku || barcode,
      brand: data.brand || '',
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };

    return this.productRepository.create(payload);
  }

  async getProducts(filter: Record<string, any> = {}, context?: ProductContext): Promise<IProduct[]> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }
    return this.productRepository.findAll(query);
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    if (!product || product.deleted === 'true') {
      throw new ApiError(`Product with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return product;
  }

  async getProductByBarcode(barcode: string, context?: ProductContext): Promise<IProduct> {
    const textileId = await this.resolveTextileId(context?.textileId);
    const product = await this.productRepository.findByBarcode(barcode, textileId);
    if (!product || product.deleted === 'true') {
      throw new ApiError(`Product with barcode '${barcode}' not found`, httpStatus.NOT_FOUND);
    }
    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    if (!product || product.deleted === 'true') {
      throw new ApiError(`Product with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (data.barcode && data.barcode.trim() !== product.barcode) {
      const conflict = await this.productRepository.findByBarcode(data.barcode, product.textile_id);
      if (conflict && conflict.id !== id) {
        throw new ApiError(`Product with barcode '${data.barcode}' already exists`, httpStatus.CONFLICT);
      }
    }

    const updated = await this.productRepository.update(id, data);
    if (!updated) {
      throw new ApiError('Failed to update product', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = await this.productRepository.findById(id);
    if (!product || product.deleted === 'true') {
      throw new ApiError(`Product with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return this.productRepository.delete(id);
  }
}
