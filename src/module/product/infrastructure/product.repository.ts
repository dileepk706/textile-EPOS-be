import mongoose, { PipelineStage } from 'mongoose';
import { injectable } from 'tsyringe';
import ProductModel from '@/module/product/infrastructure/product.schema.js';
import ProductBatchModel from '@/module/purchase/infrastructure/product-batch.schema.js';
import IProductRepository from '@/module/product/domain/interfaces/product.repository.interface.js';
import { IProduct } from '@/module/product/domain/interfaces/product.entity.interface.js';

@injectable()
export default class ProductRepository implements IProductRepository {
  private getStockAggregationPipeline(filter: Record<string, any> = {}): PipelineStage[] {
    const matchFilter: Record<string, any> = { ...filter };

    if (matchFilter._id && typeof matchFilter._id === 'string' && mongoose.Types.ObjectId.isValid(matchFilter._id)) {
      matchFilter._id = new mongoose.Types.ObjectId(matchFilter._id);
    }
    if (matchFilter.id) {
      if (typeof matchFilter.id === 'string' && mongoose.Types.ObjectId.isValid(matchFilter.id)) {
        matchFilter._id = new mongoose.Types.ObjectId(matchFilter.id);
      }
      delete matchFilter.id;
    }

    const batchCollection = ProductBatchModel.collection.name || 'productbatches';

    return [
      { $match: matchFilter },
      {
        $lookup: {
          from: batchCollection,
          let: {
            productIdStr: { $toString: '$_id' },
            productIdObj: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$product_id', '$$productIdStr'] },
                        { $eq: ['$product_id', '$$productIdObj'] },
                      ],
                    },
                    { $ne: ['$deleted', 'true'] },
                    { $ne: ['$status', 'CANCELLED'] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                total_available: {
                  $sum: { $ifNull: ['$quantity_available', 0] },
                },
              },
            },
          ],
          as: 'batch_stock',
        },
      },
      {
        $addFields: {
          quantity_available: {
            $ifNull: [{ $arrayElemAt: ['$batch_stock.total_available', 0] }, 0],
          },
          id: { $toString: '$_id' },
          _id: { $toString: '$_id' },
        },
      },
      {
        $project: {
          batch_stock: 0,
          __v: 0,
        },
      },
      { $sort: { name: 1 } },
    ];
  }

  async create(data: Partial<IProduct>): Promise<IProduct> {
    const product = await ProductModel.create(data);
    return product.toJSON() as IProduct;
  }

  async findById(id: string): Promise<IProduct | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const pipeline = this.getStockAggregationPipeline({ _id: id, deleted: 'false' });
    const results = await ProductModel.aggregate<IProduct>(pipeline);
    return results[0] || null;
  }

  async findByBarcode(barcode: string, textileId?: string | null): Promise<IProduct | null> {
    const query: Record<string, any> = {
      barcode: barcode.trim(),
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const pipeline = this.getStockAggregationPipeline(query);
    const results = await ProductModel.aggregate<IProduct>(pipeline);
    return results[0] || null;
  }

  async findAll(filter: Record<string, any> = {}): Promise<IProduct[]> {
    const pipeline = this.getStockAggregationPipeline(filter);
    return ProductModel.aggregate<IProduct>(pipeline);
  }

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    const updated = await ProductModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    if (!updated) return null;
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndUpdate(id, { $set: { deleted: 'true', is_active: false } });
    return !!result;
  }
}
