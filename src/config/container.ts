import { container } from 'tsyringe';
import mongoose from 'mongoose';
import registerTokenModule from '@/module/token/token.container.js';
import registerUserModule from '@/module/user/user.container.js';
import registerTextileModule from '@/module/textile/textile.container.js';
import registerTillModule from '@/module/till/till.container.js';

import registerCategoryModule from '@/module/category/category.container.js';
import registerProductModule from '@/module/product/product.container.js';
import registerSupplierModule from '@/module/supplier/supplier.container.js';
import registerPurchaseModule from '@/module/purchase/purchase.container.js';
import registerSalesModule from '@/module/sales/sales.container.js';

const registerDependencies = () => {
  container.registerInstance('Mongoose', mongoose);
  container.registerInstance('DbConnection', mongoose.connection);
  registerTokenModule(container);
  registerUserModule(container);
  registerTextileModule(container);
  registerTillModule(container);
  registerCategoryModule(container);
  registerProductModule(container);
  registerSupplierModule(container);
  registerPurchaseModule(container);
  registerSalesModule(container);
};

export default registerDependencies;
export { container };
