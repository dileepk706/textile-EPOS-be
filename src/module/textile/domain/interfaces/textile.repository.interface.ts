import { ITextile } from '@/module/textile/domain/interfaces/textile.entity.interface.js';

export default interface ITextileRepository {
  create(data: Partial<ITextile>): Promise<ITextile>;
  findById(id: string): Promise<ITextile | null>;
  findFirst(): Promise<ITextile | null>;
  findByCode(code: string): Promise<ITextile | null>;
  update(id: string, data: Partial<ITextile>): Promise<ITextile | null>;
  delete(id: string): Promise<boolean>;
}
