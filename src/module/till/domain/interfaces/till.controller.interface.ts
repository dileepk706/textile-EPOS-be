import { Request, Response } from 'express';

export default interface ITillController {
  createTill(req: Request, res: Response): Promise<any>;
  getTills(req: Request, res: Response): Promise<any>;
  getTillById(req: Request, res: Response): Promise<any>;
  openTill(req: Request, res: Response): Promise<any>;
  closeTill(req: Request, res: Response): Promise<any>;
  unlinkTill(req: Request, res: Response): Promise<any>;
  linkTill(req: Request, res: Response): Promise<any>;
  blockTill(req: Request, res: Response): Promise<any>;
  updatePassword(req: Request, res: Response): Promise<any>;
  cashIn(req: Request, res: Response): Promise<any>;
  cashOut(req: Request, res: Response): Promise<any>;
}

