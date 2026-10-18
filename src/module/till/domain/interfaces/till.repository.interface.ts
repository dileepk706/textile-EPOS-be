import { ITill } from '@/module/till/domain/interfaces/till.entity.interface.js';

export default interface ITillRepository {
  create(data: Partial<ITill>): Promise<ITill>;
  findById(id: string): Promise<ITill | null>;
  findByCode(code: string, textileId?: string | null): Promise<ITill | null>;
  findWithPassword(id: string): Promise<(ITill & { password?: string }) | null>;
  findAll(filter?: Record<string, any>): Promise<ITill[]>;
  update(id: string, data: Partial<ITill>): Promise<ITill | null>;
  delete(id: string): Promise<boolean>;
  getCashBalance(idOrCode: string): Promise<number | null>;
}
