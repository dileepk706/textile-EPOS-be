import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { sendSuccess } from '@/shared/response_handler.js';
import ITillController from '@/module/till/domain/interfaces/till.controller.interface.js';
import ITillService, {
  TillContext,
} from '@/module/till/domain/interfaces/till.service.interface.js';
import { ApiError } from '@/shared/middleware/error_handler.js';

@injectable()
export default class TillController implements ITillController {
  constructor(@inject('ITillService') private readonly tillService: ITillService) {}

  private getContext(req: Request): TillContext {
    return {
      userId: req.user?.user_id ? String(req.user.user_id) : undefined,
      textileId:
        req.user?.textiles_id || req.user?.textile_id
          ? String(req.user.textiles_id || req.user.textile_id)
          : undefined,
      tenantId: req.user?.tenant_id ? String(req.user.tenant_id) : undefined,
    };
  }

  private getParamId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  createTill = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const till = await this.tillService.createTill(req.body, context);
    return sendSuccess(res, { till }, 'Till created successfully', httpStatus.CREATED);
  };

  getTills = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.is_linked !== undefined) {
      filter.is_linked = req.query.is_linked === 'true';
    }
    if (req.query.is_blocked !== undefined) {
      filter.is_blocked = req.query.is_blocked === 'true';
    }

    const tills = await this.tillService.getTills(filter, context);
    return sendSuccess(
      res,
      { tills, count: tills.length },
      'Tills retrieved successfully',
      httpStatus.OK,
    );
  };

  getTillById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const till = await this.tillService.getTillById(id);
    return sendSuccess(res, { till }, 'Till retrieved successfully', httpStatus.OK);
  };

  openTill = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const context = this.getContext(req);
    if (!req.body.password) throw new ApiError('Password is required', httpStatus.FORBIDDEN);
    const till = await this.tillService.openTill(id, req.body, context);
    return sendSuccess(
      res,
      { till },
      'Till opened successfully with initial cash balance',
      httpStatus.OK,
    );
  };

  closeTill = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const context = this.getContext(req);
    if (!req.body.password) throw new ApiError('Password is required', httpStatus.FORBIDDEN);
    const till = await this.tillService.closeTill(id, req.body, context);
    return sendSuccess(
      res,
      { till },
      'Till closed successfully with closing balance',
      httpStatus.OK,
    );
  };

  unlinkTill = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const context = this.getContext(req);
    const till = await this.tillService.unlinkTill(id, context);
    return sendSuccess(res, { till }, 'Till unlinked from device successfully', httpStatus.OK);
  };

  linkTill = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const context = this.getContext(req);
    const { password, device_info } = req.body;
    const till = await this.tillService.linkTill(id, password, device_info, context);
    return sendSuccess(res, { till }, 'Till linked to device successfully', httpStatus.OK);
  };

  blockTill = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const till = await this.tillService.blockTill(id, req.body);
    const message = req.body.is_blocked
      ? 'Till blocked successfully'
      : 'Till unblocked successfully';
    return sendSuccess(res, { till }, message, httpStatus.OK);
  };

  updatePassword = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const till = await this.tillService.updatePassword(id, req.body);
    return sendSuccess(res, { till }, 'Till password/PIN updated successfully', httpStatus.OK);
  };

  cashIn = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const context = this.getContext(req);
    if (!req.body.password) {
      throw new ApiError('Password is required', httpStatus.BAD_REQUEST);
    }
    const till = await this.tillService.cashIn(id, req.body, context);
    return sendSuccess(
      res,
      { till },
      `Cash of ₹${req.body.amount} moved into till successfully`,
      httpStatus.OK,
    );
  };

  cashOut = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const context = this.getContext(req);
    if (!req.body.password) {
      throw new ApiError('Password is required', httpStatus.BAD_REQUEST);
    }
    const till = await this.tillService.cashOut(id, req.body, context);
    return sendSuccess(
      res,
      { till },
      `Cash of ₹${req.body.amount} taken from till successfully`,
      httpStatus.OK,
    );
  };
}
