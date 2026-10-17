import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import ISalesController from '@/module/sales/domain/interfaces/sales.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import { requireAdmin, requireManagerOrAdmin, requireStaff } from '@/shared/middleware/rbac.middleware.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createSaleSchema } from '@/module/sales/application/dtos/create-sale.dto.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const salesRouter = Router();

const getController = () => container.resolve<ISalesController>('ISalesController');

/**
 * @swagger
 * tags:
 *   name: Sales & Billing
 *   description: Point-of-Sale billing checkout, sales receipt invoices, line item transactions, and sales analytics
 */

// ================= BILLING / CREATE SALE =================
/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Complete POS sale transaction (generates SalesInvoice, records line items, decrements product batch stock & serials, and increments till cash)
 *     tags: [Sales & Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - till_id
 *               - items
 *             properties:
 *               till_id:
 *                 type: string
 *                 example: "6ad2db66112b8311b970a328"
 *                 description: Till/Terminal ID where this sale takes place
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, BANK_TRANSFER, CREDIT, SPLIT]
 *                 example: "CASH"
 *               total_paid:
 *                 type: number
 *                 example: 500
 *                 description: Amount paid by customer (if omitted, defaults to net amount)
 *               discount:
 *                 type: number
 *                 example: 50
 *               tax_amount:
 *                 type: number
 *                 example: 30
 *               notes:
 *                 type: string
 *                 example: "Customer requested gift wrap"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - batch_id
 *                     - product_id
 *                     - quantity
 *                     - unit_price
 *                   properties:
 *                     batch_id:
 *                       type: string
 *                       example: "6ad2db80a7cd8f0eb0b3bd8e"
 *                     product_id:
 *                       type: string
 *                       example: "6ad2db571d841d2b961f65c5"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     unit_price:
 *                       type: number
 *                       example: 200
 *                     tax_rate:
 *                       type: number
 *                       example: 5
 *                     discount:
 *                       type: number
 *                       example: 0
 *                     serial_numbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["SR-001", "SR-002"]
 *     responses:
 *       201:
 *         description: Sale completed, receipt invoice generated, inventory decremented, till balance incremented
 *       400:
 *         description: Validation error or insufficient batch stock
 *       404:
 *         description: Till or Batch not found
 */
salesRouter.post(
  '/',
  authenticate,
  requireStaff,
  processRequestBody(createSaleSchema),
  asyncHandler((req: Request, res: Response) => getController().createSale(req, res)),
);

// ================= TRANSACTIONS (LINE ITEMS) =================
/**
 * @swagger
 * /api/sales/transactions:
 *   get:
 *     summary: List all sales transaction line items with pagination and filters
 *     tags: [Sales & Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number, product name, barcode, or batch number
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: barcode
 *         schema:
 *           type: string
 *       - in: query
 *         name: batch_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: invoice_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: till_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Sales transactions retrieved successfully
 */
salesRouter.get(
  '/transactions',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getTransactions(req, res)),
);

/**
 * @swagger
 * /api/sales/transactions/{id}:
 *   get:
 *     summary: Get single sales transaction line item by ID
 *     tags: [Sales & Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales transaction details retrieved
 *       404:
 *         description: Transaction not found
 */
salesRouter.get(
  '/transactions/:id',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getTransactionById(req, res)),
);

// ================= INVOICES =================
/**
 * @swagger
 * /api/sales/invoices:
 *   get:
 *     summary: List all sales receipts / invoices with pagination and filters
 *     tags: [Sales & Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number or cashier name
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [PAID, PARTIAL, UNPAID]
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [CASH, CARD, UPI, BANK_TRANSFER, CREDIT, SPLIT]
 *       - in: query
 *         name: till_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: staff_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of sales invoices retrieved
 */
salesRouter.get(
  '/invoices',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getInvoices(req, res)),
);

/**
 * @swagger
 * /api/sales/invoices/{id}:
 *   get:
 *     summary: Get sales invoice details by ID with line items for bill printing
 *     tags: [Sales & Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Either the MongoDB ObjectId or the invoice_number (e.g. SINV-20261017-2721)
 *         example: "SINV-20261017-2721"
 *     responses:
 *       200:
 *         description: Sales invoice and line items retrieved
 *       404:
 *         description: Invoice not found
 */
salesRouter.get(
  '/invoices/:id',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getInvoiceById(req, res)),
);

/**
 * @swagger
 * /api/sales/invoices/{id}:
 *   delete:
 *     summary: Cancel / void sales invoice (restores batch stock & serials, and adjusts till balance)
 *     tags: [Sales & Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales invoice voided and inventory restored successfully
 *       404:
 *         description: Invoice not found
 */
salesRouter.delete(
  '/invoices/:id',
  authenticate,
  requireManagerOrAdmin,
  asyncHandler((req: Request, res: Response) => getController().cancelInvoice(req, res)),
);

// ================= REPORTS =================
/**
 * @swagger
 * /api/sales/reports:
 *   get:
 *     summary: Get sales report and analytics
 *     tags: [Sales & Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [PAID, PARTIAL, UNPAID]
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [CASH, CARD, UPI, BANK_TRANSFER, CREDIT, SPLIT]
 *       - in: query
 *         name: till_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: staff_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number or staff name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Detailed sales report list with populated products, batches, and summary metrics
 */
salesRouter.get(
  '/reports',
  authenticate,
  requireManagerOrAdmin,
  asyncHandler((req: Request, res: Response) => getController().getSalesReport(req, res)),
);

export const salesRouteConfig: ModuleRouteConfig = {
  basePath: '/sales',
  router: salesRouter,
  group: 'public',
};

export default salesRouter;
