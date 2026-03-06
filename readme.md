## CRM Kanban Simplificado

Aplicacao web em `Next.js 16 + React 19 + Supabase` para organizar atendimentos e negociacoes em um Kanban simples.

### Configuracao Inicial

1. Instale as dependencias:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env`.
3. Suba o Supabase local e as migrations:
   ```bash
   npx supabase start
   npx supabase migration up
   ```

### Uso Diario

1. Inicie o Docker.
2. Suba o banco:
   ```bash
   npx supabase start
   ```
3. Inicie o app:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`

### Variaveis de ambiente

Preencha no `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRM_SITE_LEADS_TOKEN=
CRM_SITE_LEADS_OWNER_USER_ID=
CRM_SITE_LEADS_STAGE_ID=
```

`CRM_SITE_LEADS_STAGE_ID` e opcional. Se ficar vazio, a integracao usa:
1. etapa `Prospeccao`
2. ou a primeira etapa por `position`

### Integracao com o site

O endpoint `POST /api/integrations/site-leads` recebe leads do site `all-ways` com autenticacao por bearer token.

Configure também os segredos de integração:

- `CRM_SITE_LEADS_TOKEN`: valor que o site usa para autenticar o request (`Authorization: Bearer ...`).
- `CRM_SITE_LEADS_OWNER_USER_ID`: `auth.users.id` do proprietário do funil que vai receber os leads.
- `CRM_SITE_LEADS_STAGE_ID` (opcional): UUID exato da etapa onde novos deals já devem abrir; quando vazio o fluxo cai em `Prospeccao` ou na etapa de menor `position`.

Comportamento:
- cria contato e deal na etapa de prospeccao para leads novos
- atualiza contato existente por telefone
- preserva a etapa atual em duplicados
- registra observacoes de reenvio e da campanha de indicacao

### Banco de dados e CLI

Execute a migration em `supabase/migrations/20260305193000_initial_schema.sql` (ou use `npx supabase migration up`).

Ela cria:
- tabelas `stages`, `contacts`, `deals`, `notes`
- politicas de RLS por `owner_user_id = auth.uid()`
- trigger para criar as etapas padrao em novos usuarios
- RPC `create_contact_with_deal`

Supabase CLI via `npx`:
```bash
npx supabase login
npx supabase init
npx supabase start
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
