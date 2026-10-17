import { Request, Response } from 'express';

export default interface IPurchaseController {
  createPurchase(req: Request, res: Response): Promise<Response>;

  // Invoices
  getInvoices(req: Request, res: Response): Promise<Response>;
  getInvoiceById(req: Request, res: Response): Promise<Response>;
  updateInvoice(req: Request, res: Response): Promise<Response>;
  deleteInvoice(req: Request, res: Response): Promise<Response>;

  // Batches
  getBatches(req: Request, res: Response): Promise<Response>;
  getBatchById(req: Request, res: Response): Promise<Response>;
  getBatchesByProductId(req: Request, res: Response): Promise<Response>;

  // Reports
  getPurchaseReport(req: Request, res: Response): Promise<Response>;

  // Line items
  getPurchases(req: Request, res: Response): Promise<Response>;
  getPurchaseById(req: Request, res: Response): Promise<Response>;
}
