import { ITextile } from '@/module/textile/domain/interfaces/textile.entity.interface.js';
import { CreateTextileDto } from '@/module/textile/application/dtos/create-textile.dto.js';
import { UpdateTextileDto } from '@/module/textile/application/dtos/update-textile.dto.js';

export default interface ITextileService {
  create(data: CreateTextileDto): Promise<ITextile>;
  getCurrentTextile(id?: string): Promise<ITextile>;
  getTextileById(id: string): Promise<ITextile>;
  updateTextile(id: string, data: UpdateTextileDto): Promise<ITextile>;
  updateCurrentTextile(data: UpdateTextileDto, currentId?: string): Promise<ITextile>;
}
