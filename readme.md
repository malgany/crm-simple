## CRM Kanban Simplificado

Aplicacao web em `Next.js 16 + React 19 + Supabase` para organizar atendimentos e negociacoes em um Kanban simples.

### Stack

- `Next.js App Router`
- `Tailwind CSS`
- `Supabase Auth + Postgres`
- `dnd-kit`
- `react-hook-form + zod`
- `Vitest`

### Variaveis de ambiente

Copie `.env.example` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Banco de dados

Execute a migration em `supabase/migrations/20260305193000_initial_schema.sql`.

Ela cria:

- tabelas `stages`, `contacts`, `deals`, `notes`
- politicas de RLS por `owner_user_id = auth.uid()`
- trigger para criar as etapas padrao em novos usuarios
- RPC `create_contact_with_deal`

### Supabase CLI

`npm i -g supabase` nao e suportado oficialmente pelo pacote atual.

Use via `npx`:

```bash
npx supabase --version
npx supabase login
npx supabase init
npx supabase start
```

Opcional (PowerShell), para usar `supabase` sem `npx`:

```powershell
function supabase { npx supabase @args }
```

### Acesso direto ao Postgres

Para tarefas manuais (migrations locais, inspeção dos dados, etc.) use o PostgreSQL exposto pelo Supabase:

```
postgresql://postgres:[SUA-SENHA]@db.almhzrrgteqwbaaxmula.supabase.co:5432/postgres
```

Substitua `[SUA-SENHA]` pelo secret do seu projeto Supabase. Não compartilhe essa string em repositórios públicos.

### Desenvolvimento

```bash
npm install
npm run dev
```

### Validacao local

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

### Deploy

- publicar na Vercel
- configurar as variaveis de ambiente
- provisionar usuarios manualmente no Supabase Auth
