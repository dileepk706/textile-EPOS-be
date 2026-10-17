import 'reflect-metadata';
import 'dotenv/config';
import registerDependencies from '@/config/container.js';

registerDependencies();

const { default: App } = await import('@/app.js');

const app = new App();
await app.start();
