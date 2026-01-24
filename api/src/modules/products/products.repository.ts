import { products } from '@repo/db';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export class ProductRepository {
  constructor(private db: DrizzleD1Database<any>) {}

  async findAll() {
    return await this.db.select().from(products).all();
  }

  async findById(id: number) {
    return await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .get();
  }

  async findByName(name: string) {
    return await this.db
      .select()
      .from(products)
      .where(eq(products.name, name))
      .get();
  }

  async create(data: typeof products.$inferInsert) {
    return await this.db.insert(products).values(data).returning().get();
  }
}
