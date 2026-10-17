import { Router } from 'express';
import { logger } from '@/shared/logger.js';
import { authenticate } from '@/shared/middleware/auth.middleware.js';
import type { ModuleRouteConfig, RouteGroupMiddleware } from '@/routes/route.types.js';
import testRoutes from '@/routes/test.routes.js';
import { userAuthRouteConfig } from '@/module/user/interfaces/routes/user.auth.routes.js';
import { textileRouteConfig } from '@/module/textile/interfaces/routes/textile.routes.js';
import { tillRouteConfig } from '@/module/till/interfaces/routes/till.routes.js';
import userRouter, { userRouteConfig } from '@/module/user/interfaces/routes/user.routes.js';
import categoryRouter, { categoryRouteConfig } from '@/module/category/interfaces/routes/category.routes.js';
import productRouter, { productRouteConfig } from '@/module/product/interfaces/routes/product.routes.js';
import supplierRouter, { supplierRouteConfig } from '@/module/supplier/interfaces/routes/supplier.routes.js';
import purchaseRouter, { purchaseRouteConfig } from '@/module/purchase/interfaces/routes/purchase.routes.js';
import salesRouter, { salesRouteConfig } from '@/module/sales/interfaces/routes/sales.routes.js';

import { requireAdmin } from '@/shared/middleware/rbac.middleware.js';

const moduleRoutes: ModuleRouteConfig[] = [
  {
    basePath: '/test',
    router: testRoutes,
    group: 'public',
  },
  userAuthRouteConfig,
  userRouteConfig,
  {
    basePath: '/users',
    router: userRouter,
    group: 'protected',
  },
  textileRouteConfig,
  tillRouteConfig,
  categoryRouteConfig,
  {
    basePath: '/category',
    router: categoryRouter,
    group: 'public',
  },
  productRouteConfig,
  {
    basePath: '/product',
    router: productRouter,
    group: 'public',
  },
  supplierRouteConfig,
  {
    basePath: '/supplier',
    router: supplierRouter,
    group: 'public',
  },
  purchaseRouteConfig,
  {
    basePath: '/purchase',
    router: purchaseRouter,
    group: 'public',
  },
  salesRouteConfig,
  {
    basePath: '/sale',
    router: salesRouter,
    group: 'public',
  },
];

const groupMiddleware: RouteGroupMiddleware = {
  public: [],
  protected: [authenticate],
  admin: [authenticate, requireAdmin],
  tenant: [authenticate],
  auth: [authenticate],
};

const API_PREFIX = '/api';

export function registerRoutes(): Router {
  const rootRouter = Router();

  for (const { basePath, router, group } of moduleRoutes) {
    const fullPath = `${API_PREFIX}${basePath}`;
    const middleware = groupMiddleware[group];

    rootRouter.use(fullPath, ...middleware, router);

    logger.info(`Registered routes: ${fullPath}  [${group}]`);
  }

  return rootRouter;
}
