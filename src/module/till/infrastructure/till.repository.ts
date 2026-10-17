import { injectable } from 'tsyringe';
import TillModel from '@/module/till/infrastructure/till.schema.js';
import ITillRepository from '@/module/till/domain/interfaces/till.repository.interface.js';
import { ITill } from '@/module/till/domain/interfaces/till.entity.interface.js';

@injectable()
export default class TillRepository implements ITillRepository {
  async create(data: Partial<ITill>): Promise<ITill> {
    const till = await TillModel.create(data);
    return till.toJSON() as ITill;
  }

  async findById(id: string): Promise<ITill | null> {
    const till = await TillModel.findById(id);
    return till ? (till.toJSON() as ITill) : null;
  }

  async findByCode(code: string, textileId?: string | null): Promise<ITill | null> {
    const query: Record<string, any> = { code: code.toUpperCase().trim() };
    if (textileId) {
      query.textile_id = textileId;
    }
    const till = await TillModel.findOne(query);
    return till ? (till.toJSON() as ITill) : null;
  }

  async findWithPassword(id: string): Promise<(ITill & { password?: string }) | null> {
    const till = await TillModel.findById(id);
    if (!till) return null;
    const json = till.toJSON() as ITill;
    return {
      ...json,
      password: till.password,
    };
  }

  async findAll(filter: Record<string, any> = {}): Promise<ITill[]> {
    const tills = await TillModel.find(filter).sort({ createdAt: -1 });
    return tills.map((t) => t.toJSON() as ITill);
  }

  async update(id: string, data: Partial<ITill>): Promise<ITill | null> {
    const updated = await TillModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return updated ? (updated.toJSON() as ITill) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await TillModel.findByIdAndDelete(id);
    return !!result;
  }
}
