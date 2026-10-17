import { ITill } from '@/module/till/domain/interfaces/till.entity.interface.js';
import { CreateTillDto } from '@/module/till/application/dtos/create-till.dto.js';
import { OpenTillDto } from '@/module/till/application/dtos/open-till.dto.js';
import { CloseTillDto } from '@/module/till/application/dtos/close-till.dto.js';
import { UpdateTillPasswordDto } from '@/module/till/application/dtos/update-till-password.dto.js';
import { BlockTillDto } from '@/module/till/application/dtos/block-till.dto.js';

export interface TillContext {
  userId?: string;
  textileId?: string;
  tenantId?: string;
}

export default interface ITillService {
  createTill(data: CreateTillDto, context: TillContext): Promise<ITill>;
  getTills(filter?: Record<string, any>, context?: TillContext): Promise<ITill[]>;
  getTillById(id: string): Promise<ITill>;
  openTill(id: string, data: OpenTillDto, context: TillContext): Promise<ITill>;
  closeTill(id: string, data: CloseTillDto, context: TillContext): Promise<ITill>;
  unlinkTill(id: string, context: TillContext): Promise<ITill>;
  linkTill(id: string, password: string, deviceInfo?: string, context?: TillContext): Promise<ITill>;
  blockTill(id: string, data: BlockTillDto): Promise<ITill>;
  updatePassword(id: string, data: UpdateTillPasswordDto): Promise<ITill>;
}
