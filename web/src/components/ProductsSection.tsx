import * as React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
};

type ProductsSectionProps = {
  apiBaseUrl: string;
  initialProducts: Product[];
};

type ProductsGridProps = ProductsSectionProps & {
  search: string;
};

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
      },
    },
  });

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

async function fetchProducts(apiBaseUrl: string): Promise<Product[]> {
  const base = apiBaseUrl?.replace(/\/$/, '');
  const url = base ? `${base}/products` : '/products';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Não foi possível carregar os produtos.');
  }
  return response.json();
}

function ProductsGrid({
  apiBaseUrl,
  initialProducts,
  search,
}: ProductsGridProps) {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(apiBaseUrl),
    initialData: initialProducts,
  });

  const filtered = React.useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase();
    return data.filter((product) =>
      [product.name, product.description, product.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data, search]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="animate-pulse">
            <div className="h-56 rounded-t-2xl bg-white/10" />
            <CardHeader>
              <div className="h-4 w-2/3 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/10" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="mt-2 h-3 w-5/6 rounded bg-white/10" />
            </CardContent>
            <div className="px-6 pb-6">
              <div className="h-10 rounded-xl bg-white/10" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border border-rose-500/30 bg-rose-500/10">
        <CardHeader>
          <CardTitle>Ops! Algo deu errado.</CardTitle>
          <CardDescription>
            {(error as Error)?.message ?? 'Tente novamente em instantes.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!filtered.length) {
    return (
      <Card className="border border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Nenhum produto encontrado</CardTitle>
          <CardDescription>
            Ajuste a busca ou experimente remover filtros.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-300">
          {filtered.length} produto{filtered.length === 1 ? '' : 's'}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={
              isFetching
                ? 'h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_0_6px_rgba(249,115,22,0.12)]'
                : 'h-2 w-2 rounded-full bg-emerald-400/80'
            }
          />
          {isFetching ? 'Atualizando catálogo...' : 'Catálogo atualizado'}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => {
          const stockVariant = product.stock > 10 ? 'success' : 'warning';
          return (
            <Card
              key={product.id}
              className="overflow-hidden ring-1 ring-transparent hover:ring-orange-500/20"
            >
              <div className="relative h-56 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-800">
                    <div className="px-6 text-center">
                      <div className="text-xs uppercase tracking-[0.22em] text-orange-200/80">
                        Destaque
                      </div>
                      <div className="mt-2 line-clamp-2 text-base font-semibold text-slate-100">
                        {product.name}
                      </div>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                  <div className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-white/10 blur-xl" />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {product.category && (
                    <Badge variant="brand">{product.category}</Badge>
                  )}
                  <Badge variant={product.stock > 0 ? stockVariant : 'default'}>
                    {product.stock > 0
                      ? `${product.stock} em estoque`
                      : 'Sob encomenda'}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  <span className="line-clamp-2">
                    {product.description ?? 'Sem descrição disponível.'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Preço
                    </div>
                    <div className="mt-1 text-3xl font-semibold tracking-tight text-white">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                <div className="flex items-center gap-3">
                  <Button className="flex-1">Adicionar</Button>
                  <Button variant="outline">Detalhes</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductsSection({
  apiBaseUrl,
  initialProducts,
}: ProductsSectionProps) {
  const [queryClient] = React.useState(() => makeQueryClient());
  const [search, setSearch] = React.useState('');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200/80">
              Catálogo
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Produtos em destaque
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Encontre itens premium para turbinar o seu setup — do essencial ao
              desejo.
            </p>
          </div>

          <div className="w-full md:max-w-sm">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-orange-500/30 focus-within:ring-2 focus-within:ring-orange-500/20">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Buscar
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Teclados, headsets, cadeiras..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <ProductsGrid
          apiBaseUrl={apiBaseUrl}
          initialProducts={initialProducts}
          search={search}
        />
      </div>
    </QueryClientProvider>
  );
}
