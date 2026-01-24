import { Hono } from 'hono';
import { createDb, movies } from '@repo/db';

type Bindings = {
  setupgamer: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const db = createDb(c.env.setupgamer);

  // Select
  const queryResult = await db.select().from(movies).all();

  return c.json(queryResult);
});

export default app;
