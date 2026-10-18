import { Router, Request, Response } from 'express';
import { container } from '@/config/container.js';
import ITillController from '@/module/till/domain/interfaces/till.controller.interface.js';
import asyncHandler from '@/shared/middleware/async_handler.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import { requireAdmin, requireManagerOrAdmin, requireStaff } from '@/shared/middleware/rbac.middleware.js';
import { processRequestBody } from '@/shared/middleware/validation.js';
import { createTillSchema } from '@/module/till/application/dtos/create-till.dto.js';
import { openTillSchema } from '@/module/till/application/dtos/open-till.dto.js';
import { closeTillSchema } from '@/module/till/application/dtos/close-till.dto.js';
import { updateTillPasswordSchema } from '@/module/till/application/dtos/update-till-password.dto.js';
import { blockTillSchema } from '@/module/till/application/dtos/block-till.dto.js';
import { cashInTillSchema } from '@/module/till/application/dtos/cash-in-till.dto.js';
import { cashOutTillSchema } from '@/module/till/application/dtos/cash-out-till.dto.js';
import type { ModuleRouteConfig } from '@/routes/route.types.js';

const tillRouter = Router();

const getController = () => container.resolve<ITillController>('ITillController');

/**
 * @swagger
 * tags:
 *   name: Till
 *   description: Point of Sale (POS) Till / Terminal setup, cash drawers, and billing shift operations
 */

/**
 * @swagger
 * /api/tills:
 *   get:
 *     summary: List all tills for the store
 *     tags: [Till]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, blocked]
 *         description: Filter by till status
 *       - in: query
 *         name: is_linked
 *         schema:
 *           type: boolean
 *         description: Filter by linked device status
 *     responses:
 *       200:
 *         description: List of tills retrieved successfully
 *       401:
 *         description: Unauthorized
 */
tillRouter.get(
  '/',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getTills(req, res)),
);

/**
 * @swagger
 * /api/tills:
 *   post:
 *     summary: Create a new POS till terminal
 *     tags: [Till]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Counter 1 - Main POS
 *               code:
 *                 type: string
 *                 example: TILL-01
 *               password:
 *                 type: string
 *                 example: "1234"
 *               opening_balance:
 *                 type: number
 *                 example: 500
 *               notes:
 *                 type: string
 *                 example: Main ground floor billing terminal
 *     responses:
 *       201:
 *         description: Till created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Till code already exists
 */
tillRouter.post(
  '/',
  authenticate,
  requireAdmin,
  processRequestBody(createTillSchema),
  asyncHandler((req: Request, res: Response) => getController().createTill(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}:
 *   get:
 *     summary: Get till terminal details by ID
 *     tags: [Till]
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
 *         description: Till details retrieved successfully
 *       404:
 *         description: Till not found
 */
tillRouter.get(
  '/:id',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().getTillById(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/open:
 *   post:
 *     summary: Setup/open a till with opening cash balance for the day/shift
 *     tags: [Till]
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
 *             required:
 *               - opening_balance
 *             properties:
 *               opening_balance:
 *                 type: number
 *                 example: 1000
 *               password:
 *                 type: string
 *                 example: "1234"
 *               device_info:
 *                 type: string
 *                 example: "Terminal-Workstation-01"
 *               notes:
 *                 type: string
 *                 example: "Morning shift opening float"
 *     responses:
 *       200:
 *         description: Till opened successfully
 *       400:
 *         description: Till already open or validation error
 *       403:
 *         description: Till is blocked
 */
tillRouter.post(
  '/:id/open',
  authenticate,
  requireStaff,
  processRequestBody(openTillSchema),
  asyncHandler((req: Request, res: Response) => getController().openTill(req, res)),
);

// Alias /setup for opening till
tillRouter.post(
  '/:id/setup',
  authenticate,
  requireStaff,
  processRequestBody(openTillSchema),
  asyncHandler((req: Request, res: Response) => getController().openTill(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/close:
 *   post:
 *     summary: Close till with closing cash balance (calculates discrepancies)
 *     tags: [Till]
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
 *             required:
 *               - closing_balance
 *             properties:
 *               closing_balance:
 *                 type: number
 *                 example: 4500
 *               notes:
 *                 type: string
 *                 example: "Evening shift closed. Cash deposited to store safe."
 *     responses:
 *       200:
 *         description: Till closed successfully
 *       400:
 *         description: Till is not currently open
 */
tillRouter.post(
  '/:id/close',
  authenticate,
  requireStaff,
  processRequestBody(closeTillSchema),
  asyncHandler((req: Request, res: Response) => getController().closeTill(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/unlink:
 *   post:
 *     summary: Unlink terminal device from till
 *     tags: [Till]
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
 *         description: Till unlinked successfully
 *       404:
 *         description: Till not found
 */
tillRouter.post(
  '/:id/unlink',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().unlinkTill(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/link:
 *   post:
 *     summary: Link / pair terminal device to till
 *     tags: [Till]
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
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: "1234"
 *               device_info:
 *                 type: string
 *                 example: "POS-Register-PC-01"
 *     responses:
 *       200:
 *         description: Till linked successfully
 *       401:
 *         description: Invalid password
 */
tillRouter.post(
  '/:id/link',
  authenticate,
  requireStaff,
  asyncHandler((req: Request, res: Response) => getController().linkTill(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/block:
 *   patch:
 *     summary: Block or unblock a till terminal
 *     tags: [Till]
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
 *               is_blocked:
 *                 type: boolean
 *                 example: true
 *               reason:
 *                 type: string
 *                 example: "Maintenance required on receipt printer"
 *     responses:
 *       200:
 *         description: Till block status updated
 *       404:
 *         description: Till not found
 */
tillRouter.patch(
  '/:id/block',
  authenticate,
  requireAdmin,
  processRequestBody(blockTillSchema),
  asyncHandler((req: Request, res: Response) => getController().blockTill(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/password:
 *   patch:
 *     summary: Update till terminal security password / PIN
 *     tags: [Till]
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
 *             required:
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 example: "1234"
 *               new_password:
 *                 type: string
 *                 example: "5678"
 *     responses:
 *       200:
 *         description: Till password updated successfully
 *       401:
 *         description: Current password does not match
 */
tillRouter.patch(
  '/:id/password',
  authenticate,
  requireManagerOrAdmin,
  processRequestBody(updateTillPasswordSchema),
  asyncHandler((req: Request, res: Response) => getController().updatePassword(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/cash-in:
 *   post:
 *     summary: Move cash into till (increment cash balance) with password verification
 *     tags: [Till]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Till ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - password
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *                 description: Cash amount to add to the till
 *               password:
 *                 type: string
 *                 example: "1234"
 *                 description: Till security password/PIN for verification
 *               reason:
 *                 type: string
 *                 example: "Adding petty cash float"
 *               notes:
 *                 type: string
 *                 example: "Received from main safe"
 *     responses:
 *       200:
 *         description: Cash moved into till successfully
 *       400:
 *         description: Till not open or invalid amount
 *       401:
 *         description: Invalid till password
 *       403:
 *         description: Till is blocked
 *       404:
 *         description: Till not found
 */
tillRouter.post(
  '/:id/cash-in',
  authenticate,
  requireStaff,
  processRequestBody(cashInTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashIn(req, res)),
);

// Aliases for moving cash into till
tillRouter.post(
  '/:id/move-cash-in',
  authenticate,
  requireStaff,
  processRequestBody(cashInTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashIn(req, res)),
);
tillRouter.post(
  '/:id/deposit',
  authenticate,
  requireStaff,
  processRequestBody(cashInTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashIn(req, res)),
);
tillRouter.post(
  '/:id/add-cash',
  authenticate,
  requireStaff,
  processRequestBody(cashInTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashIn(req, res)),
);

/**
 * @swagger
 * /api/tills/{id}/cash-out:
 *   post:
 *     summary: Take cash from till (decrement cash balance) with password verification
 *     tags: [Till]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Till ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - password
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 300
 *                 description: Cash amount to withdraw from the till
 *               password:
 *                 type: string
 *                 example: "1234"
 *                 description: Till security password/PIN for verification
 *               reason:
 *                 type: string
 *                 example: "Midday cash skim / drop to safe"
 *               notes:
 *                 type: string
 *                 example: "Transferred to manager safe"
 *     responses:
 *       200:
 *         description: Cash taken from till successfully
 *       400:
 *         description: Till not open or insufficient cash in till
 *       401:
 *         description: Invalid till password
 *       403:
 *         description: Till is blocked
 *       404:
 *         description: Till not found
 */
tillRouter.post(
  '/:id/cash-out',
  authenticate,
  requireStaff,
  processRequestBody(cashOutTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashOut(req, res)),
);

// Aliases for taking cash from till
tillRouter.post(
  '/:id/move-cash-out',
  authenticate,
  requireStaff,
  processRequestBody(cashOutTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashOut(req, res)),
);
tillRouter.post(
  '/:id/withdraw',
  authenticate,
  requireStaff,
  processRequestBody(cashOutTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashOut(req, res)),
);
tillRouter.post(
  '/:id/take-cash',
  authenticate,
  requireStaff,
  processRequestBody(cashOutTillSchema),
  asyncHandler((req: Request, res: Response) => getController().cashOut(req, res)),
);


export const tillRouteConfig: ModuleRouteConfig = {
  basePath: '/tills',
  router: tillRouter,
  group: 'public',
};

export default tillRouter;
