import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import ITextileRepository from '@/module/textile/domain/interfaces/textile.repository.interface.js';
import ITextileService from '@/module/textile/domain/interfaces/textile.service.interface.js';
import { ITextile } from '@/module/textile/domain/interfaces/textile.entity.interface.js';
import { CreateTextileDto } from '@/module/textile/application/dtos/create-textile.dto.js';
import { UpdateTextileDto } from '@/module/textile/application/dtos/update-textile.dto.js';

@injectable()
export default class TextileService implements ITextileService {
  constructor(
    @inject('ITextileRepository') private readonly textileRepository: ITextileRepository,
  ) {}

  async create(data: CreateTextileDto): Promise<ITextile> {
    if (data.code) {
      const existing = await this.textileRepository.findByCode(data.code);
      if (existing) {
        throw new ApiError(`Textile with code '${data.code}' already exists`, httpStatus.CONFLICT);
      }
    }

    const payload: Partial<ITextile> = {
      ...data,
      is_active: true,
      currency: data.currency || 'INR',
    };

    return this.textileRepository.create(payload);
  }

  async getCurrentTextile(id?: string): Promise<ITextile> {
    if (id) {
      const textile = await this.textileRepository.findById(id);
      if (textile) return textile;
    }

    // In single-tenant mode, fallback to the primary active textile store
    const defaultTextile = await this.textileRepository.findFirst();
    if (!defaultTextile) {
      throw new ApiError('Textile store not configured yet. Please seed or create a store.', httpStatus.NOT_FOUND);
    }

    return defaultTextile;
  }

  async getTextileById(id: string): Promise<ITextile> {
    const textile = await this.textileRepository.findById(id);
    if (!textile) {
      throw new ApiError(`Textile with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return textile;
  }

  async updateTextile(id: string, data: UpdateTextileDto): Promise<ITextile> {
    const existing = await this.textileRepository.findById(id);
    if (!existing) {
      throw new ApiError(`Textile with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    const updated = await this.textileRepository.update(id, data);
    if (!updated) {
      throw new ApiError('Failed to update textile store', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async updateCurrentTextile(data: UpdateTextileDto, currentId?: string): Promise<ITextile> {
    let targetId = currentId;

    if (!targetId) {
      const current = await this.textileRepository.findFirst();
      if (!current || !current.id) {
        throw new ApiError('Textile store not found to update', httpStatus.NOT_FOUND);
      }
      targetId = current.id;
    }

    return this.updateTextile(targetId, data);
  }
}
