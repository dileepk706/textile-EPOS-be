import { injectable } from 'tsyringe';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';
import ITextileRepository from '@/module/textile/domain/interfaces/textile.repository.interface.js';
import { ITextile } from '@/module/textile/domain/interfaces/textile.entity.interface.js';

@injectable()
export default class TextileRepository implements ITextileRepository {
  async create(data: Partial<ITextile>): Promise<ITextile> {
    const textile = await TextileModel.create(data);
    return textile.toJSON() as ITextile;
  }

  async findById(id: string): Promise<ITextile | null> {
    const textile = await TextileModel.findById(id);
    return textile ? (textile.toJSON() as ITextile) : null;
  }

  async findFirst(): Promise<ITextile | null> {
    const textile = await TextileModel.findOne({ is_active: true });
    return textile ? (textile.toJSON() as ITextile) : null;
  }

  async findByCode(code: string): Promise<ITextile | null> {
    const textile = await TextileModel.findOne({ code });
    return textile ? (textile.toJSON() as ITextile) : null;
  }

  async update(id: string, data: Partial<ITextile>): Promise<ITextile | null> {
    const updated = await TextileModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return updated ? (updated.toJSON() as ITextile) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await TextileModel.findByIdAndDelete(id);
    return !!result;
  }
}
