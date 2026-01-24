import { Context } from 'hono';
import { ProductService } from './products.service';
import { NewProduct } from '@repo/db';

export class ProductController {
  constructor(private service: ProductService) {}

  async list(c: Context) {
    try {
      const products = await this.service.getAllProducts();
      return c.json(products);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  async getById(c: Context) {
    try {
      const { id } = (c.req as any).valid('param');
      const product = await this.service.getProductById(id);
      return c.json(product);
    } catch (error: any) {
      return c.json({ error: error.message }, 404);
    }
  }

  async create(c: Context) {
    try {
      const validated = (c.req as any).valid('json');
      const product = await this.service.createNewProduct(validated);
      return c.json(product, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}
