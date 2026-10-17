import { Request, Response } from 'express';

export default interface ISalesController {
  createSale(req: Request, res: Response): Promise<Response>;

  // Invoices
  getInvoices(req: Request, res: Response): Promise<Response>;
  getInvoiceById(req: Request, res: Response): Promise<Response>;
  cancelInvoice(req: Request, res: Response): Promise<Response>;

  // Transactions (Line items)
  getTransactions(req: Request, res: Response): Promise<Response>;
  getTransactionById(req: Request, res: Response): Promise<Response>;

  // Report
  getSalesReport(req: Request, res: Response): Promise<Response>;
}
