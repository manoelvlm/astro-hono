import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createDb } from '@repo/db';
import { ProductRepository } from './products.repository';
import { ProductService } from './products.service';
import { ProductController } from './products.controller';
import { createProductSchema, productIdSchema } from './products.validation';

const productRoutes = new Hono<{ Bindings: CloudflareBindings }>();

const factory = (db: D1Database) => {
  const drizzle = createDb(db);
  const repo = new ProductRepository(drizzle);
  const service = new ProductService(repo);
  return new ProductController(service);
};

productRoutes.get('/', (c) => factory(c.env.setupgamer).list(c));
productRoutes.get('/:id', zValidator('param', productIdSchema), (c) =>
  factory(c.env.setupgamer).getById(c),
);
productRoutes.post('/', zValidator('json', createProductSchema), (c) =>
  factory(c.env.setupgamer).create(c),
);

export default productRoutes;
