import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import IPurchaseController from '@/module/purchase/domain/interfaces/purchase.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import {
  requireAdmin,
  requireManagerOrAdmin,
  requireStaff,
} from '@/shared/middleware/rbac.middleware.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createPurchaseSchema } from '@/module/purchase/application/dtos/create-purchase.dto.js';
import { updatePurchaseInvoiceSchema } from '@/module/purchase/application/dtos/update-purchase.dto.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const purchaseRouter = Router();

const getController = () => container.resolve<IPurchaseController>('IPurchaseController');

/**
 * @swagger
 * tags:
 *   name: Purchases & Batches
 *   description: Purchase order procurement, supplier invoices, and product batch inventory management
 */

// ================= INVOICES =================
/**
 * @swagger
 * /api/purchases/invoices:
 *   get:
 *     summary: List all purchase invoices
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number, supplier invoice number, supplier name, or batch number
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [PAID, PARTIAL, UNPAID]
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of purchase invoices retrieved
 */
purchaseRouter.get(
  '/invoices',
  authenticate,
  requireManagerOrAdmin,
  asyncHandler((req: Request, res: Response) => getController().getInvoices(req, res)),
);

/**
 * @swagger
 * /api/purchases/invoices/{id}:
 *   get:
 *     summary: Get purchase invoice details by ID
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Either the MongoDB ObjectId or the invoice_number (e.g. PINV-20261017-4289)
 *         example: "PINV-20261017-4289"
 *     responses:
 *       200:
 *         description: Purchase invoice details with batch and line items
 *       404:
 *         description: Invoice not found
 */
purchaseRouter.get(
  '/invoices/:id',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getInvoiceById(req, res)),
);

/**
 * @swagger
 * /api/purchases/invoices/{id}:
 *   put:
 *     summary: Update purchase invoice payments, notes, or vendor bill number
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplier_invoice_number:
 *                 type: string
 *               total_paid:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER, CHEQUE, UPI, CREDIT]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       404:
 *         description: Invoice not found
 */
purchaseRouter.put(
  '/invoices/:id',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(updatePurchaseInvoiceSchema),
  asyncHandler((req: Request, res: Response) => getController().updateInvoice(req, res)),
);

/**
 * @swagger
 * /api/purchases/invoices/{id}:
 *   delete:
 *     summary: Cancel / soft delete purchase invoice and cancel its batch
 *     tags: [Purchases & Batches]
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
 *         description: Invoice cancelled successfully
 *       404:
 *         description: Invoice not found
 */
purchaseRouter.delete(
  '/invoices/:id',
  authenticate,
  requireAdmin,
  asyncHandler((req: Request, res: Response) => getController().deleteInvoice(req, res)),
);

// ================= REPORTS =================
/**
 * @swagger
 * /api/purchases/reports:
 *   get:
 *     summary: List detailed purchase reports with populated supplier, products, batches, and overall summary
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number, supplier invoice number, or supplier name
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *         description: Filter report by specific supplier ID
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [PAID, PARTIAL, UNPAID]
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [CASH, BANK_TRANSFER, CHEQUE, UPI, CREDIT]
 *       - in: query
 *         name: till_id
 *         schema:
 *           type: string
 *         description: Filter report by till ID
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
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Array of detailed purchase records with populated supplier and product info, plus summary metrics
 */
purchaseRouter.get(
  '/reports',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getPurchaseReport(req, res)),
);

// ================= BATCHES (INVENTORY) =================
/**
 * @swagger
 * /api/purchases/batches:
 *   get:
 *     summary: List all product inventory batches with pagination, filters, and stock status
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by batch number, product name, barcode, or supplier name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, DEPLETED, CANCELLED]
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: barcode
 *         schema:
 *           type: string
 *       - in: query
 *         name: till_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: available_only
 *         schema:
 *           type: boolean
 *         description: Set true to return only batches with quantity_available > 0
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
 *         description: Paginated product batches retrieved successfully
 */
purchaseRouter.get(
  '/batches',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getBatches(req, res)),
);

/**
 * @swagger
 * /api/purchases/batches/product/{productId}:
 *   get:
 *     summary: Get all active batches containing a specific product for sales/billing
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product batches with available quantities and serial numbers
 */
purchaseRouter.get(
  '/batches/product/:productId',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getBatchesByProductId(req, res)),
);

/**
 * @swagger
 * /api/purchases/batches/{id}:
 *   get:
 *     summary: Get product batch details by ID
 *     tags: [Purchases & Batches]
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
 *         description: Batch details with product inventory and serials
 *       404:
 *         description: Batch not found
 */
purchaseRouter.get(
  '/batches/:id',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getBatchById(req, res)),
);

// ================= PURCHASES (CREATE & LINE ITEMS) =================
/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Record a new purchase from supplier (creates PurchaseInvoice, ProductBatch, and Purchase items)
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier_id
 *               - items
 *             properties:
 *               supplier_id:
 *                 type: string
 *                 example: "6ad29ab4e58fd93b427bbbc0"
 *               supplier_invoice_number:
 *                 type: string
 *                 example: "INV-MILL-889"
 *               till_id:
 *                 type: string
 *                 description: Till/Terminal ID to pay cash from (balance verified and deducted)
 *                 example: "6ad29111e58fd93b427bbbc1"
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER, CHEQUE, UPI, CREDIT]
 *                 example: "CASH"
 *               total_paid:
 *                 type: number
 *                 example: 50000
 *               discount:
 *                 type: number
 *                 example: 1000
 *               tax_amount:
 *                 type: number
 *                 example: 2500
 *               notes:
 *                 type: string
 *                 example: "Festival stock shipment"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                     - cost_price
 *                     - selling_price
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       example: "6ad295353f3c84431f38fc22"
 *                     quantity:
 *                       type: number
 *                       example: 5
 *                     cost_price:
 *                       type: number
 *                       example: 4500
 *                     selling_price:
 *                       type: number
 *                       example: 6500
 *                     mrp:
 *                       type: number
 *                       example: 7000
 *                     tax_rate:
 *                       type: number
 *                       example: 5
 *                     serial_numbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["SN-SR-01", "SN-SR-02", "SN-SR-03", "SN-SR-04", "SN-SR-05"]
 *     responses:
 *       201:
 *         description: Purchase recorded, invoice generated, and batch inventory stocked
 *       400:
 *         description: Validation error
 *       404:
 *         description: Supplier or Product not found
 */
purchaseRouter.post(
  '/',
  authenticate,
  requireStaff,
  processRequestBody(createPurchaseSchema),
  asyncHandler((req: Request, res: Response) => getController().createPurchase(req, res)),
);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: List all purchase line items
 *     tags: [Purchases & Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: batch_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase records retrieved successfully
 */
purchaseRouter.get(
  '/',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getPurchases(req, res)),
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Get purchase line item by ID
 *     tags: [Purchases & Batches]
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
 *         description: Purchase record retrieved successfully
 *       404:
 *         description: Purchase record not found
 */
purchaseRouter.get(
  '/:id',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getPurchaseById(req, res)),
);

export const purchaseRouteConfig: ModuleRouteConfig = {
  basePath: '/purchases',
  router: purchaseRouter,
  group: 'public',
};

export default purchaseRouter;
