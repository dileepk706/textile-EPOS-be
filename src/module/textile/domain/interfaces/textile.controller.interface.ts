import { Request, Response } from 'express';

export default interface ITextileController {
  getTextile(req: Request, res: Response): Promise<any>;
  updateTextile(req: Request, res: Response): Promise<any>;
  createTextile(req: Request, res: Response): Promise<any>;
}
