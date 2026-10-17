import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { sendSuccess } from '@/shared/response_handler.js';
import ITextileController from '@/module/textile/domain/interfaces/textile.controller.interface.js';
import ITextileService from '@/module/textile/domain/interfaces/textile.service.interface.js';

@injectable()
export default class TextileController implements ITextileController {
  constructor(@inject('ITextileService') private readonly textileService: ITextileService) {}

  getTextile = async (req: Request, res: Response) => {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const queryId = typeof req.query.id === 'string' ? req.query.id : undefined;
    const textileId = paramId || queryId || req.user?.textile_id;

    const textile = await this.textileService.getCurrentTextile(textileId || undefined);
    return sendSuccess(res, textile, 'Textile details retrieved successfully', httpStatus.OK);
  };

  updateTextile = async (req: Request, res: Response) => {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const textileId = paramId || req.user?.textile_id;

    const textile = await this.textileService.updateCurrentTextile(
      req.body,
      textileId || undefined,
    );
    return sendSuccess(res, { textile }, 'Textile details updated successfully', httpStatus.OK);
  };

  createTextile = async (req: Request, res: Response) => {
    const textile = await this.textileService.create(req.body);
    return sendSuccess(res, { textile }, 'Textile created successfully', httpStatus.CREATED);
  };
}
