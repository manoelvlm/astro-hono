import { Hono } from 'hono';
import { createDb, products } from '@repo/db';
import productRoutes from './modules/products/products.routes';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route('/products', productRoutes);

export default app;
