# Roadmap de Implementação: Melhores Práticas (Astro 6 + Hono + D1 + TanStack Query)

Este documento fornece uma lista completa de tarefas para transformar este repositório em uma **referência técnica** de como usar essas tecnologias em conjunto seguindo as melhores práticas modernas.

## 📋 Visão Geral

O objetivo é demonstrar:

- ✅ **Type-Safety End-to-End**: Do banco D1 até o cliente React
- ✅ **Performance Otimizada**: SSR + Islands + Streaming
- ✅ **DX Moderna**: RPC type-safe, validação Zod, inferência automática
- ✅ **Padrões Astro 6**: Server Islands, Actions, View Transitions

---

## 1. 🗄️ Evolução do Schema (Base para Demonstrações)

**Objetivo**: Criar um schema rico que permita demonstrar funcionalidades avançadas (mutações, agregações, relacionamentos).

### 1.1 Tabela de Reviews (Avaliações de Produtos)

- [ ] **Criar tabela `reviews` em `packages/db/src/schema.ts`**:

  ```typescript
  export const reviews = sqliteTable('reviews', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    product_id: integer('product_id')
      .notNull()
      .references(() => products.id),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id),
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    created_at: integer('created_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  });

  export type Review = typeof reviews.$inferSelect;
  export type NewReview = typeof reviews.$inferInsert;
  ```

- [ ] **Criar migration**: `npm run db:generate` no diretório `api/`
- [ ] **Aplicar migration**: `npm run db:migrate` no diretório `api/`
- [ ] **Popular com seeds**: Criar arquivo `api/src/seeds/reviews.ts` com dados fictícios

### 1.2 Tabela de Carrinho (Demonstrar Sessões/Cache)

- [ ] **Criar tabela `cart_items` em `packages/db/src/schema.ts`**:
  ```typescript
  export const cart_items = sqliteTable('cart_items', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: integer('user_id').notNull(),
    product_id: integer('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull().default(1),
    created_at: integer('created_at', { mode: 'timestamp' }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  });
  ```
- [ ] **Gerar e aplicar migration**

### 1.3 Relacionamentos Drizzle

- [ ] **Adicionar relations ao schema** para facilitar queries:

  ```typescript
  import { relations } from 'drizzle-orm';

  export const productsRelations = relations(products, ({ many }) => ({
    reviews: many(reviews),
  }));

  export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
      fields: [reviews.product_id],
      references: [products.id],
    }),
    user: one(users, {
      fields: [reviews.user_id],
      references: [users.id],
    }),
  }));
  ```

---

## 2. 🔗 Integração Type-Safe Backend/Frontend (Hono RPC)

**Objetivo**: Eliminar `fetch` manual e obter type-safety completo do servidor ao cliente.

### 2.1 Backend: Exportar Type do App

- [ ] **Em `api/src/index.ts`, exportar o tipo da aplicação**:

  ```typescript
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  app.route('/products', productRoutes);

  // Exportar tipo para o cliente
  export type AppType = typeof app;
  ```

### 2.2 Frontend: Configurar Hono Client

- [ ] **Criar `web/src/lib/api-client.ts`**:

  ```typescript
  import { hc } from 'hono/client';
  import type { AppType } from '../../../api/src/index';

  // Cliente type-safe
  export const apiClient = hc<AppType>(
    import.meta.env.PUBLIC_API_URL || 'http://localhost:8787',
  );

  // Helper types para inferência
  export type { InferRequestType, InferResponseType } from 'hono/client';
  ```

- [ ] **Configurar variável de ambiente** `PUBLIC_API_URL` em `.env` e `astro.config.mjs`

### 2.3 Refatoração: Substituir fetch por RPC

- [ ] **Em `ProductsSection.tsx`, substituir `fetchProducts`**:

  ```typescript
  import { apiClient } from '../lib/api-client';

  async function fetchProducts() {
    const res = await apiClient.products.$get();
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }
  ```

- [ ] **Remover prop `apiBaseUrl`** do componente
- [ ] **Testar autocomplete e type-safety** no VSCode

### 2.4 Criar Novos Endpoints com Validação

- [ ] **Endpoint para listar reviews de um produto** (`api/src/modules/reviews/`):
  - `reviews.routes.ts`
  - `reviews.repository.ts` (usando Drizzle relations)
  - `reviews.service.ts`
  - `reviews.validation.ts` (schemas Zod)
- [ ] **Integrar no app principal**: `app.route('/reviews', reviewRoutes)`

---

## 3. 🏝️ Server Islands (Astro 6)

**Objetivo**: Demonstrar streaming de componentes que fazem queries pesadas sem bloquear o First Paint.

### 3.1 Componente: ProductReviewSummary

- [ ] **Criar `web/src/components/ProductReviewSummary.astro`**:

  ```astro
  ---
  import { createDb, reviews } from '@repo/db';
  import { eq, avg, count } from 'drizzle-orm';

  interface Props {
    productId: number;
  }

  const { productId } = Astro.props;
  const db = createDb(import.meta.env.DB); // Binding direto

  // Query agregada (simulação de operação "pesada")
  const stats = await db
    .select({
      avgRating: avg(reviews.rating),
      totalReviews: count(),
    })
    .from(reviews)
    .where(eq(reviews.product_id, productId));

  const { avgRating, totalReviews } = stats[0] || { avgRating: 0, totalReviews: 0 };
  ---

  <div class="review-stats">
    <div class="stars">{'⭐'.repeat(Math.round(Number(avgRating)))}</div>
    <p>{Number(avgRating).toFixed(1)} ({totalReviews} avaliações)</p>
  </div>
  ```

### 3.2 Implementar com server:defer

- [ ] **Em `web/src/pages/index.astro` (ou página de produto)**:

  ```astro
  ---
  import ProductReviewSummary from '../components/ProductReviewSummary.astro';
  ---

  <ProductReviewSummary
    server:defer
    productId={123}
  >
    <div slot="fallback" class="skeleton-stars animate-pulse">
      ⭐⭐⭐⭐⭐
    </div>
  </ProductReviewSummary>
  ```

- [ ] **Adicionar estilos de loading** no CSS global

### 3.3 Server Island Avançado (Personalização)

- [ ] **Criar `UserCartPreview.astro`** que mostra itens no carrinho:
  - Recebe `userId` (de cookie ou sessão simulada)
  - Faz query de `cart_items` com join em `products`
  - Usa `server:defer` com fallback de skeleton

---

## 4. ⚡ Astro Actions (Mutações Server-Side)

**Objetivo**: Demonstrar a forma idiomática do Astro 6 para forms, substituindo API routes tradicionais.

### 4.1 Definir Actions

- [ ] **Criar `web/src/actions/index.ts`**:

  ```typescript
  import { defineAction } from 'astro:actions';
  import { z } from 'astro/zod';
  import { createDb, reviews } from '@repo/db';

  export const server = {
    // Action: Submeter avaliação
    submitReview: defineAction({
      accept: 'form',
      input: z.object({
        productId: z.coerce.number(),
        userId: z.coerce.number(),
        rating: z.coerce.number().min(1).max(5),
        comment: z.string().max(500).optional(),
      }),
      handler: async (input, context) => {
        const db = createDb(context.locals.runtime.env.DB);

        const [newReview] = await db
          .insert(reviews)
          .values({
            product_id: input.productId,
            user_id: input.userId,
            rating: input.rating,
            comment: input.comment,
          })
          .returning();

        return { success: true, reviewId: newReview.id };
      },
    }),

    // Action: Adicionar ao carrinho
    addToCart: defineAction({
      accept: 'json',
      input: z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
      }),
      handler: async (input, context) => {
        // Implementação...
        return { success: true };
      },
    }),
  };
  ```

### 4.2 Formulário de Review (HTML Puro)

- [ ] **Criar `web/src/components/ReviewForm.astro`**:

  ```astro
  ---
  import { actions } from 'astro:actions';

  const result = Astro.getActionResult(actions.submitReview);
  ---

  {result?.error && (
    <p class="error">{result.error.message}</p>
  )}

  {result?.data?.success && (
    <p class="success">Avaliação enviada com sucesso!</p>
  )}

  <form method="POST" action={actions.submitReview}>
    <input type="hidden" name="productId" value="123" />
    <input type="hidden" name="userId" value="1" />

    <label>
      Nota:
      <select name="rating" required>
        <option value="5">⭐⭐⭐⭐⭐</option>
        <option value="4">⭐⭐⭐⭐</option>
        <option value="3">⭐⭐⭐</option>
        <option value="2">⭐⭐</option>
        <option value="1">⭐</option>
      </select>
    </label>

    <label>
      Comentário:
      <textarea name="comment" maxlength="500"></textarea>
    </label>

    <button type="submit">Enviar Avaliação</button>
  </form>
  ```

### 4.3 Integração React (Opcional)

- [ ] **Criar versão React do form** usando `actions` e progressive enhancement
- [ ] **Adicionar loading states** durante submissão

---

## 5. 🚀 Estratégia Híbrida de Dados (Server + Client)

**Objetivo**: Renderizar rápido no servidor e hidratar no cliente para interatividade, evitando waterfalls.

### 5.1 Pattern: SSR First, Hydrate Later

- [ ] **Em `web/src/pages/index.astro`, fazer query direta**:

  ```astro
  ---
  import { createDb, products } from '@repo/db';
  import ProductsSection from '../components/ProductsSection';

  // Query direta no servidor (mesma rede Cloudflare, sem HTTP overhead)
  const db = createDb(Astro.locals.runtime.env.DB);
  const initialProducts = await db.select().from(products).limit(20);
  ---

  <ProductsSection
    client:load
    initialProducts={initialProducts}
  />
  ```

### 5.2 TanStack Query com InitialData

- [ ] **Em `ProductsSection.tsx`, usar `initialData`**:
  ```typescript
  const { data = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.products.$get();
      return res.json();
    },
    initialData: initialProducts, // Dados do servidor
    staleTime: 60_000,
  });
  ```
- [ ] **Remover prop `apiBaseUrl` obsoleta**

### 5.3 Prefetch e Deduplicação

- [ ] **Configurar QueryClient** com `staleTime` e `gcTime` apropriados
- [ ] **Implementar prefetch** em hover de links (ex: página de produto)

---

## 6. 🎨 View Transitions (Astro 6)

**Objetivo**: SPA-like UX sem sacrificar SEO ou performance.

### 6.1 Configurar View Transitions

- [ ] **Adicionar em `web/src/layouts/Layout.astro`**:
  ```astro
  ---
  import { ClientRouter } from 'astro:transitions';
  ---
  <html>
    <head>
      <ClientRouter />
    </head>
    <body>
      <slot />
    </body>
  </html>
  ```

### 6.2 Persistir Estado de Componentes

- [ ] **Em componentes React que devem manter estado**:
  ```astro
  <ProductsSection
    client:load
    transition:persist
    transition:persist-props
  />
  ```
- [ ] **Testar navegação** entre páginas e verificar se o estado persiste

### 6.3 Animações Customizadas

- [ ] **Adicionar transições CSS** para cards de produtos
- [ ] **Usar `transition:name`** para morph de elementos específicos

---

## 7. 🧪 Type-Safety e Validação (Zod End-to-End)

**Objetivo**: Validação consistente do banco ao cliente.

### 7.1 Schemas Drizzle → Zod

- [ ] **Criar helper** para gerar schemas Zod a partir do Drizzle:

  ```typescript
  // packages/db/src/validators.ts
  import { z } from 'zod';
  import type { NewReview } from './schema';

  export const insertReviewSchema = z.object({
    product_id: z.number().positive(),
    user_id: z.number().positive(),
    rating: z.number().min(1).max(5),
    comment: z.string().max(500).optional(),
  }) satisfies z.ZodType<Omit<NewReview, 'id' | 'created_at'>>;
  ```

- [ ] **Exportar schemas** do `@repo/db` para reusar em Actions e Hono routes

### 7.2 Validação no Backend (Hono)

- [ ] **Usar `zValidator`** em todas as rotas:

  ```typescript
  import { zValidator } from '@hono/zod-validator';

  productRoutes.post('/', zValidator('json', createProductSchema), (c) =>
    factory(c.env.setupgamer).create(c),
  );
  ```

### 7.3 Inferência no Cliente

- [ ] **Usar `InferRequestType` e `InferResponseType`** do Hono Client
- [ ] **Documentar padrão** em `docs/ARCHITECTURE.md`

---

## 8. 📦 Organização do Monorepo

**Objetivo**: Manter consistência e DX fluido.

### 8.1 Shared Packages

- [ ] **Criar `packages/types`** (opcional):
  - Types compartilhados entre `api` e `web`
  - Evitar duplicação de DTOs
- [ ] **Configurar exports** corretos no `package.json`

### 8.2 Dependências Sincronizadas

- [ ] **Garantir mesmas versões de**:
  - React (`react`, `react-dom`)
  - TanStack Query
  - Hono
  - Zod
  - TypeScript
- [ ] **Usar workspace protocols** (`"@repo/db": "workspace:*"`)

### 8.3 Scripts NPM

- [ ] **Adicionar scripts root** para facilitar dev:
  ```json
  {
    "scripts": {
      "dev": "concurrently \"npm run dev -w api\" \"npm run dev -w web\"",
      "db:generate": "npm run db:generate -w api",
      "db:migrate": "npm run db:migrate -w api",
      "build": "npm run build -w packages/db && npm run build -w api && npm run build -w web"
    }
  }
  ```

---

## 9. 📚 Documentação e Exemplos

**Objetivo**: Tornar o repo uma referência educacional.

### 9.1 Documentação Técnica

- [ ] **Criar `docs/ARCHITECTURE.md`** explicando:
  - Fluxo de dados (D1 → Drizzle → Hono → Client)
  - Padrões de validação
  - Quando usar Actions vs API Routes
  - Server Islands vs Client Components
- [ ] **Adicionar diagramas** (Mermaid ou Excalidraw)

### 9.2 Code Comments

- [ ] **Adicionar JSDoc** em funções complexas
- [ ] **Comentar padrões não-óbvios** (ex: `satisfies` em schemas)

### 9.3 README.md

- [ ] **Atualizar README principal** com:
  - Stack visual (badges)
  - Quick Start aprimorado
  - Link para docs/
  - GIF/Screenshot da aplicação

---

## 10. 🎯 Demonstrações Práticas

**Objetivo**: Showcases concretos de cada feature.

### 10.1 Páginas de Exemplo

- [ ] **`/products`**: Listagem SSR + hydration
- [ ] **`/products/[id]`**:
  - Server Island (reviews summary)
  - Review form (Action)
  - View Transitions
- [ ] **`/cart`**: Demo de mutations com Actions

### 10.2 Testes E2E (Opcional)

- [ ] **Configurar Playwright** para testar:
  - Form submission via Actions
  - View Transitions
  - Hydration

---

## ✅ Checklist de Validação Final

Antes de considerar o roadmap completo, validar:

- [ ] **Type-Safety**: `npm run build` sem erros de tipo
- [ ] **Performance**: Lighthouse score > 90
- [ ] **DX**: Autocomplete funciona em todas as APIs
- [ ] **Tests**: Cobertura mínima de 70%
- [ ] **Docs**: README atualizado e arquitetura documentada
- [ ] **Demo Deploy**: Link público (Cloudflare Pages + Workers)

---

## 📝 Notas de Implementação

### Priorização Sugerida

1. **Fase 1** (Fundação): Itens 1, 2, 7
2. **Fase 2** (Features Core): Itens 3, 4, 5
3. **Fase 3** (Polish): Itens 6, 8, 9, 10

### Ferramentas Auxiliares

- **Drizzle Studio**: Visualizar banco durante dev
- **Hono DevTools**: Debug de rotas
- **Astro DevToolbar**: Inspecionar Islands e Actions

### Referências

- [Astro 6 Docs](https://v6.docs.astro.build)
- [Hono RPC Guide](https://hono.dev/guides/rpc)
- [TanStack Query + SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Drizzle Relations](https://orm.drizzle.team/docs/rqb)
