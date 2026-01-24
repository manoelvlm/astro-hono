import { Hono } from 'hono';
import * as schema from '../db/schema';
import { createDb, type Bindings } from '../db/db';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const db = createDb(c.env.setupgamer);

  // Select
  const queryResult = await db.select().from(schema.movies).all();

  return c.json(queryResult);
});

export default app;
