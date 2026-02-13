# react-keycloak-wrapper

Um wrapper React moderno para o Keycloak, inspirado em provedores OIDC, que simplifica a integração de autenticação em suas aplicações React.

## 📋 Pré-requisitos

Antes de instalar, certifique-se de ter as seguintes dependências peer instaladas:

| Dependência   | Versão Mínima |
| ------------- | ------------- |
| `keycloak-js` | >=24          |
| `react`       | >=18          |
| `react-dom`   | >=18          |

## 📦 Instalação

Supondo que você já tenha um projeto _React_ configurado, pelo menos com `React` e `ReactDOM`, você pode instalar o `react-keycloak-wrapper` e o `keycloak-js` usando npm:

```bash
npm install react-keycloak-wrapper keycloak-js
```

ou com pnpm:

```bash
pnpm add react-keycloak-wrapper keycloak-js
```

ou com yarn:

```bash
yarn add react-keycloak-wrapper keycloak-js
```

## 🚀 Uso Básico

```tsx
import { KeycloakProvider, KeycloakSecure } from "react-keycloak-wrapper";

function App() {
  return (
    <KeycloakProvider
      config={{
        url: "https://seu-keycloak.com/auth",
        realm: "seu-realm",
        clientId: "seu-client-id",
        redirectUri: "http://localhost:3000/authorization",
      }}
    >
      <KeycloakSecure>
        <SuaAplicacao />
      </KeycloakSecure>
    </KeycloakProvider>
  );
}
```

## 🧩 Componentes

### `KeycloakProvider`

Provedor principal que gerencia o estado de autenticação do Keycloak.

**Props:**

| Prop                           | Tipo                                                               | Obrigatório | Padrão | Descrição                                         |
| ------------------------------ | ------------------------------------------------------------------ | ----------- | ------ | ------------------------------------------------- |
| `children`                     | `ReactNode`                                                        | ✅          | -      | Componentes filhos                                |
| `config`                       | `KeycloakConfig`                                                   | ✅          | -      | Configurações do Keycloak                         |
| `logging`                      | `boolean`                                                          | ❌          | -      | Habilita logs de debug                            |
| `LoadingComponent`             | `FC<{ opened: boolean }>`                                          | ❌          | -      | Componente customizado para loading               |
| `AuthenticatingErrorComponent` | `FC<{ error: Error \ \| null; retry: () => void }>` | ❌          | -      | Componente customizado para erros de autenticação |
| `SessionLostComponent`         | `FC<{ retry: () => void }>`                                        | ❌          | -      | Componente customizado para sessão perdida        |

**Tipo `KeycloakConfig`:**

```typescript
interface KeycloakConfig {
  url: string; // URL do servidor Keycloak
  realm: string; // Nome do realm
  clientId: string; // ID do client
  wellKnownUrlPrefix?: string; // URL customizada para .well-known/openid-configuration
  redirectUri: string; // URI de redirecionamento após login
  tokenRefreshInterval?: number; // Intervalo de refresh do token em ms (padrão: 10000)
}
```

**Tipo `KeycloakUser`:**

```typescript
type UserRoles =
  | { role?: string[] }
  | { roles?: string[] }
  | { relation?: string[] }
  | { groups?: string[] };

type KeycloakUser = {
  name: string;
  family_name: string;
  given_name: string;
  preferred_username: string;
} & UserRoles;
```

### `KeycloakSecure`

Componente que protege rotas, exigindo autenticação.

**Props:**

| Prop       | Tipo        | Obrigatório | Descrição                |
| ---------- | ----------- | ----------- | ------------------------ |
| `children` | `ReactNode` | ✅          | Conteúdo a ser protegido |

## 🪝 Hooks

### `useKeycloak()`

Hook principal para acessar funcionalidades de autenticação.

```typescript
const { login, logout, isLoading, isAuthenticated, error, sessionLost } =
  useKeycloak();
```

**Retorno:**

- `login: (redirectUri?: string) => Promise<void>` - Função para fazer login
- `logout: (redirectUri: string) => Promise<void>` - Função para fazer logout
- `isLoading: boolean` - Estado de carregamento
- `isAuthenticated: boolean` - Estado de autenticação
- `error: Error | null` - Erro de autenticação, se houver
- `sessionLost: boolean` - Indica se a sessão foi perdida

### `useKeycloakUser()`

Hook para acessar informações do usuário autenticado.

```typescript
const { user, isLoading } = useKeycloakUser();
```

**Retorno:**

- `user: KeycloakUser | null` - Perfil do usuário
- `isLoading: boolean` - Estado de carregamento

### `useKeycloakToken()`

Hook para acessar tokens de autenticação.

```typescript
const { accessToken, idToken } = useKeycloakToken();
```

**Retorno:**

- `accessToken?: string` - Token de acesso
- `idToken?: string` - Token de ID

## 🔄 Como Funciona

### Fluxo de Autenticação

1. **Inicialização**: O `KeycloakProvider` inicializa a instância do Keycloak usando [`keycloak-js`](https://www.keycloak.org/securing-apps/javascript-adapter)

2. **Verificação de Sessão**: Ao iniciar, verifica se existe uma sessão ativa usando `check-sso`

3. **Proteção de Rotas**: O componente `KeycloakSecure` bloqueia o acesso a conteúdo não autenticado

4. **Refresh Automático**: Os tokens são automaticamente renovados no intervalo configurado (padrão: 10 segundos)

5. **Gerenciamento de Estado**: O estado de autenticação é gerenciado através de um reducer (keycloak-reducer.ts)

6. **Redirecionamento Inteligente**: Após o login, o usuário é redirecionado para a página que estava tentando acessar

## 📚 Documentação Adicional

Para mais informações sobre o adaptador JavaScript do Keycloak, consulte a [documentação oficial](https://www.keycloak.org/securing-apps/javascript-adapter).

## 📝 Licença

MIT
