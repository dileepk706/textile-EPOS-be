import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import { hashPassword, comparePassword } from '@/utils/hash.util.js';
import ITillRepository from '@/module/till/domain/interfaces/till.repository.interface.js';
import ITillService, {
  TillContext,
} from '@/module/till/domain/interfaces/till.service.interface.js';
import { ITill } from '@/module/till/domain/interfaces/till.entity.interface.js';
import { CreateTillDto } from '@/module/till/application/dtos/create-till.dto.js';
import { OpenTillDto } from '@/module/till/application/dtos/open-till.dto.js';
import { CloseTillDto } from '@/module/till/application/dtos/close-till.dto.js';
import { UpdateTillPasswordDto } from '@/module/till/application/dtos/update-till-password.dto.js';
import { BlockTillDto } from '@/module/till/application/dtos/block-till.dto.js';
import { CashInTillDto } from '@/module/till/application/dtos/cash-in-till.dto.js';
import { CashOutTillDto } from '@/module/till/application/dtos/cash-out-till.dto.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
export default class TillService implements ITillService {
  constructor(@inject('ITillRepository') private readonly tillRepository: ITillRepository) {}

  private async resolveTextileId(contextTextileId?: string): Promise<string | null> {
    if (contextTextileId) return contextTextileId;
    const defaultTextile = await TextileModel.findOne({ is_active: true });
    return defaultTextile ? defaultTextile._id.toString() : null;
  }

  async createTill(data: CreateTillDto, context: TillContext): Promise<ITill> {
    const textileId = await this.resolveTextileId(
      context.textileId || data.textile_id || undefined,
    );

    let code = data.code ? data.code.toUpperCase().trim() : '';
    if (!code) {
      const existingTills = await this.tillRepository.findAll(
        textileId ? { textile_id: textileId } : {},
      );
      code = `TILL-${String(existingTills.length + 1).padStart(2, '0')}`;
    }

    const existing = await this.tillRepository.findByCode(code, textileId);
    if (existing) {
      throw new ApiError(`Till with code '${code}' already exists`, httpStatus.CONFLICT);
    }

    const hashedPassword = await hashPassword(data.password);
    const openingBalance = data.opening_balance || data.cash_in_till || 0;

    const payload: Partial<ITill> = {
      name: data.name.trim(),
      code,
      password: hashedPassword,
      status: 'closed',
      is_blocked: false,
      cash_in_till: openingBalance,
      opening_balance: openingBalance,
      closing_balance: null,
      discrepancy: null,
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
      is_linked: !!data.device_info,
      device_info: data.device_info || null,
      notes: data.notes || '',
    };

    return this.tillRepository.create(payload);
  }

  async getTills(filter: Record<string, any> = {}, context?: TillContext): Promise<ITill[]> {
    const query: Record<string, any> = { ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }
    return this.tillRepository.findAll(query);
  }

  async getTillById(id: string): Promise<ITill> {
    const till = await this.tillRepository.findById(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return till;
  }

  async openTill(id: string, data: OpenTillDto, context: TillContext): Promise<ITill> {
    const till = await this.tillRepository.findWithPassword(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (till.is_blocked || till.status === 'blocked') {
      throw new ApiError('Till is blocked. Please unblock before opening.', httpStatus.FORBIDDEN);
    }

    if (till.status === 'open') {
      throw new ApiError('Till is already open', httpStatus.BAD_REQUEST);
    }

    const isValid = await comparePassword(data.password, till.password);
    if (!isValid) {
      throw new Error('Invalid till PIN or password');
    }

    const updatePayload: Partial<ITill> = {
      status: 'open',
      opening_balance: data.opening_balance,
      cash_in_till: data.opening_balance,
      closing_balance: null,
      discrepancy: null,
      last_opened_at: new Date(),
      last_opened_by: context.userId || null,
      assigned_user_id: context.userId || till.assigned_user_id,
      device_info: data.device_info || till.device_info,
      is_linked: true,
      notes: data.notes || till.notes,
    };

    const updated = await this.tillRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to open till', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async closeTill(id: string, data: CloseTillDto, context: TillContext): Promise<ITill> {
    const till = await this.tillRepository.findWithPassword(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    const isValid = await comparePassword(data.password, till.password);
    if (!isValid) {
      throw new ApiError('Invalid till PIN or password', httpStatus.UNAUTHORIZED);
    }

    if (till.status !== 'open') {
      throw new ApiError(
        'Till is not currently open. Only open tills can be closed.',
        httpStatus.BAD_REQUEST,
      );
    }

    const discrepancy = Number((data.closing_balance - (till.cash_in_till || 0)).toFixed(2));
    console.log(data.closing_balance);

    const updatePayload: Partial<ITill> = {
      status: 'closed',
      closing_balance: data.closing_balance,
      discrepancy,
      last_closed_at: new Date(),
      last_closed_by: context.userId || null,
      notes: data.notes || till.notes,
    };

    const updated = await this.tillRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to close till', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async unlinkTill(id: string, _context: TillContext): Promise<ITill> {
    const till = await this.tillRepository.findById(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    const updatePayload: Partial<ITill> = {
      is_linked: false,
      device_info: null,
      assigned_user_id: null,
    };

    const updated = await this.tillRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to unlink till', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async linkTill(
    id: string,
    password: string,
    deviceInfo?: string,
    context?: TillContext,
  ): Promise<ITill> {
    const till = await this.tillRepository.findWithPassword(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (till.is_blocked || till.status === 'blocked') {
      throw new ApiError('Till is blocked. Cannot link device.', httpStatus.FORBIDDEN);
    }

    if (till.password) {
      const isMatch = await comparePassword(password, till.password);
      if (!isMatch) {
        throw new ApiError('Invalid till PIN or password', httpStatus.UNAUTHORIZED);
      }
    }

    const updatePayload: Partial<ITill> = {
      is_linked: true,
      device_info: deviceInfo || till.device_info || 'POS-Terminal',
      assigned_user_id: context?.userId || till.assigned_user_id,
    };

    const updated = await this.tillRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to link till', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async blockTill(id: string, data: BlockTillDto): Promise<ITill> {
    const till = await this.tillRepository.findById(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    const updatePayload: Partial<ITill> = {
      is_blocked: data.is_blocked,
      status: data.is_blocked ? 'blocked' : 'closed',
    };

    const updated = await this.tillRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to update till block status', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async updatePassword(id: string, data: UpdateTillPasswordDto): Promise<ITill> {
    const till = await this.tillRepository.findWithPassword(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (data.current_password && till.password) {
      const isMatch = await comparePassword(data.current_password, till.password);
      if (!isMatch) {
        throw new ApiError('Current password/PIN does not match', httpStatus.UNAUTHORIZED);
      }
    }

    const hashedPassword = await hashPassword(data.new_password);
    const updated = await this.tillRepository.update(id, { password: hashedPassword });
    if (!updated) {
      throw new ApiError('Failed to update till password', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async cashIn(id: string, data: CashInTillDto, _context?: TillContext): Promise<ITill> {
    const till = await this.tillRepository.findWithPassword(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (till.is_blocked || till.status === 'blocked') {
      throw new ApiError('Till is blocked. Cannot move cash.', httpStatus.FORBIDDEN);
    }

    if (till.status !== 'open') {
      throw new ApiError(
        'Till is not open. Cash can only be added to an open till.',
        httpStatus.BAD_REQUEST,
      );
    }

    const isValid = await comparePassword(data.password, till.password);
    if (!isValid) {
      throw new ApiError('Invalid till PIN or password', httpStatus.UNAUTHORIZED);
    }

    const currentCash = Number(till.cash_in_till || 0);
    const newCash = Number((currentCash + data.amount).toFixed(2));

    const noteEntry = data.notes || data.reason;
    const updatedNotes = noteEntry
      ? till.notes
        ? `${till.notes}; Cash In: +₹${data.amount} (${noteEntry})`
        : `Cash In: +₹${data.amount} (${noteEntry})`
      : till.notes;

    const updatePayload: Partial<ITill> = {
      cash_in_till: newCash,
      notes: updatedNotes,
    };

    const updated = await this.tillRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to update till cash balance', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async cashOut(id: string, data: CashOutTillDto, _context?: TillContext): Promise<ITill> {
    const till = await this.tillRepository.findWithPassword(id);
    if (!till) {
      throw new ApiError(`Till with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (till.is_blocked || till.status === 'blocked') {
      throw new ApiError('Till is blocked. Cannot move cash.', httpStatus.FORBIDDEN);
    }

    if (till.status !== 'open') {
      throw new ApiError(
        'Till is not open. Cash can only be taken from an open till.',
        httpStatus.BAD_REQUEST,
      );
    }

    const isValid = await comparePassword(data.password, till.password);
    if (!isValid) {
      throw new ApiError('Invalid till PIN or password', httpStatus.UNAUTHORIZED);
    }

    const currentCash = Number(till.cash_in_till || 0);
    if (currentCash < data.amount) {
      throw new ApiError(
        `Insufficient cash in till '${till.name}'. Available: ₹${currentCash.toFixed(2)}, Requested: ₹${data.amount.toFixed(2)}`,
        httpStatus.BAD_REQUEST,
      );
    }

    const newCash = Number((currentCash - data.amount).toFixed(2));

    const noteEntry = data.notes || data.reason;
    const updatedNotes = noteEntry
      ? till.notes
        ? `${till.notes}; Cash Out: -₹${data.amount} (${noteEntry})`
        : `Cash Out: -₹${data.amount} (${noteEntry})`
      : till.notes;

    const updatePayload: Partial<ITill> = {
      cash_in_till: newCash,
      notes: updatedNotes,
    };

    const updated = await this.tillRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to update till cash balance', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async getCashBalance(idOrCode: string): Promise<number> {
    const balance = await this.tillRepository.getCashBalance(idOrCode);
    if (balance === null) {
      throw new ApiError(`Till '${idOrCode}' not found`, httpStatus.NOT_FOUND);
    }
    return balance;
  }
}

