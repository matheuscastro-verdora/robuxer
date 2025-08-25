## Robuxer — Plataforma de Compra de Game Pass Roblox

Sistema completo para compra automatizada de Game Passes do Roblox via PIX, construído com **React + Supabase + shadcn/ui**.

### ✨ Funcionalidades

#### 🎮 **Compra de Game Pass**
- Validação automática de Game Pass por link ou ID
- Listagem de passes por experiência/jogo
- Geração de PIX via AbacatePay
- Compra automática após confirmação do pagamento
- Sistema de simulação para testes

#### 👤 **Sistema de Usuários**
- Autenticação completa (registro/login/logout)
- Perfil com usuário do Roblox editável
- Avatar padrão com iniciais do usuário
- Alteração de senha com verificação
- Painel administrativo (para admins)

#### 📊 **Dashboard e Histórico**
- Histórico de compras com filtros
- Status em tempo real dos pedidos
- Visualização de valores em Robux e BRL
- Badges de status coloridos

### 🚀 Setup rápido

#### 1. **Banco de dados**
```bash
# Execute o schema principal
supabase db push
```

#### 2. **Edge Functions**
```bash
# Deploy das funções principais
supabase functions deploy resolve-gamepass
supabase functions deploy list-gamepasses
supabase functions deploy abacatepay-create-charge
supabase functions deploy abacatepay-webhook
supabase functions deploy abacatepay-simulate-payment
```

#### 3. **Secrets do Supabase**
Configure no Dashboard → Project Settings → Secrets:
```
ABACATEPAY_API=sua_api_key
ABACATEPAY_KEY=sua_chave_secreta
ABACATEPAY_WEBHOOK_SECRET=seu_webhook_secret
ROBLOX_SECURITY_COOKIE=seu_.ROBLOSECURITY
ROBLOX_CSRF_CACHE_TTL_SECONDS=900
CLIENT_HMAC_SECRET=sua_chave_hmac_secreta
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

#### 4. **Frontend**
```bash
# Instalar dependências
npm install

# Configurar .env.local
echo "VITE_SUPABASE_URL=https://seu-projeto.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=sua_anon_key" >> .env.local
echo "VITE_SUPABASE_FUNCTIONS_URL=https://seu-projeto.functions.supabase.co" >> .env.local
echo "VITE_CLIENT_HMAC_SECRET=sua_chave_hmac_secreta" >> .env.local

# Iniciar desenvolvimento
npm run dev
```

### 🗺️ **Rotas da Aplicação**

#### **Públicas**
- `/auth` - Login e registro de usuários

#### **Privadas** (requer autenticação)
- `/start` - Página inicial/dashboard
- `/buy-pass` - Comprar Game Pass (principal)
- `/compras` - Histórico de pedidos
- `/account` - Configurações da conta
- `/notifications` - Central de notificações
- `/status/:orderId` - Status específico do pedido

#### **Admin** (apenas administradores)
- `/admin` - Painel administrativo

### 🛠️ **Arquitetura Técnica**

#### **Stack Principal**
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Pagamentos**: AbacatePay (PIX)
- **API Externa**: Roblox Web API

#### **Banco de Dados**
Principais tabelas:
- `public.users` - Perfis de usuário sincronizados com auth
- `public.orders` - Histórico de pedidos e compras
- `public.settings` - Configurações do sistema (taxa Robux/BRL)
- `public.event_logs` - Logs de eventos importantes

#### **Edge Functions**
- `resolve-gamepass` - Resolve detalhes de Game Pass por ID
- `list-gamepasses` - Lista passes de uma experiência
- `abacatepay-create-charge` - Cria cobrança PIX
- `abacatepay-webhook` - Webhook para confirmação de pagamento
- `abacatepay-simulate-payment` - Simulação para testes

#### **Segurança**
- Row Level Security (RLS) em todas as tabelas
- Autenticação JWT via Supabase Auth
- HMAC para assinatura de requisições
- Validação de CSRF para API do Roblox
- Sanitização de inputs e validação de schemas

### ⚠️ **Avisos Importantes**

1. **Pendência de Robux**: Compras de Game Pass geram Robux com pendência de ~3-5 dias (política do Roblox)
2. **Cookie de Segurança**: Mantenha o `.ROBLOSECURITY` seguro e atualize quando necessário
3. **Não Afiliação**: Este projeto não é afiliado ao Roblox Corporation
4. **Uso Responsável**: Use apenas para Game Passes próprios ou com permissão

### 🔧 **Desenvolvimento**

#### **Comandos Úteis**
```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build para produção
npm run preview         # Preview do build

# Supabase
supabase start          # Inicia ambiente local
supabase db push        # Aplica migrações
supabase functions serve # Serve functions localmente
supabase gen types typescript --local > src/types/database.ts
```

#### **Estrutura do Projeto**
```
src/
├── components/         # Componentes React reutilizáveis
├── contexts/          # Contexts do React (Auth, Theme)
├── hooks/             # Custom hooks
├── lib/               # Utilitários e configurações
├── routes/            # Páginas da aplicação
└── types/             # Tipos TypeScript

supabase/
├── functions/         # Edge Functions
├── migrations/        # Migrações do banco
└── sql/              # Schema principal
```

---

**Desenvolvido com ❤️ para a comunidade Roblox**
