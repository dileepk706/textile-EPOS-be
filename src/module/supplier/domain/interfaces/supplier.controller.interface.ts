import { Request, Response } from 'express';

export default interface ISupplierController {
  createSupplier(req: Request, res: Response): Promise<Response>;
  getSuppliers(req: Request, res: Response): Promise<Response>;
  getSupplierById(req: Request, res: Response): Promise<Response>;
  updateSupplier(req: Request, res: Response): Promise<Response>;
  deleteSupplier(req: Request, res: Response): Promise<Response>;
}
