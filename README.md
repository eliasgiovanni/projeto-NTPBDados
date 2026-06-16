# Dashboard de Vendas Fictícias - NTPBDados 📊🛡️

Este projeto consiste em uma solução analítica e transacional de Business Intelligence (BI) para e-commerce. Desenvolvido para a disciplina de Banco de Dados, o sistema centraliza a gestão de estoque, controle de clientes e o processamento de vendas em tempo real integrado ao PostgreSQL.

## 👥 Equipe (IFTO - 2026)
- Wanderson
- Gabriel Victor
- Rafael
- Elias
- Alessandra

---

## 🛠️ Tecnologias Utilizadas
- **Frontend:** React + TypeScript + Vite + Chart.js (Visualização de Dados) + Lucide React (Ícones)
- **Backend:** Node.js + Express + TypeScript + `pg` (PostgreSQL client)
- **Banco de Dados:** PostgreSQL

---

## 📂 Estrutura do Projeto
- `/frontend`: Interface Web interativa em React.
- `/backend`: Servidor API em Express gerenciando a lógica transacional.
- `/docs`: Scripts SQL de migração e estrutura conceitual do banco.

---

## 🚀 Novas Funcionalidades Implementadas

1. **Cadastro e Gestão de Clientes:**
   - Tela exclusiva para visualização e cadastro de novos clientes.
   - Inclusão automática do cliente padrão de ID `1` (**Consumidor Final**) para registrar vendas onde o comprador não se identifica.
2. **Terminal de Vendas Multi-itens:**
   - Interface no estilo Ponto de Venda (PDV) para selecionar o cliente e adicionar múltiplos itens a um carrinho de compras.
   - Transação atômica (`BEGIN`/`COMMIT`/`ROLLBACK`) no backend para garantir a integridade dos dados e baixa automática de estoque de todos os itens da venda.
3. **Edição e Gestão de Inventário:**
   - Edição de produtos existentes diretamente pela listagem, permitindo atualizar o **Preço de Venda**, a **Descrição** (campo novo) e a **Quantidade em Estoque**.

---

## 🏁 Como Iniciar a Aplicação

### Passo 1: Preparação do Banco de Dados (PostgreSQL)

Você pode configurar o banco de duas formas:

#### A. Atualizar um Banco de Dados Existente:
Se você já possui o banco rodando com a estrutura anterior, execute o script de migração:
```bash
# Execute as queries contidas no arquivo:
docs/migration_clientes_produtos.sql
```

#### B. Instalar do Zero:
Se for criar o banco de dados pela primeira vez, execute o script completo de criação e sementes (seed):
```bash
# Execute as queries contidas no arquivo:
docs/setup_banco.sql
```

---

### Passo 2: Configuração e Execução do Backend

1. Entre no diretório do servidor:
   ```bash
   cd backend
   ```
2. Crie um arquivo chamado `.env` na raiz do diretório `backend` baseando-se no `.env.example`:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/ntpbdados
   ```
   *Substitua `seu_usuario`, `sua_senha` e `ntpbdados` pelas credenciais do seu banco de dados PostgreSQL.*
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *O backend estará rodando em `http://localhost:3001`.*

---

### Passo 3: Execução do Frontend

1. Entre no diretório do cliente Web:
   ```bash
   cd ../frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
   *O frontend estará aberto no endereço informado pelo terminal (normalmente `http://localhost:5173`).*

---

## 🛠️ Padronização de Commits
Para manter a organização, o grupo utiliza o padrão de **Conventional Commits**:
- `feat:` Novas funcionalidades (ex: `feat: adiciona aba de clientes`).
- `fix:` Correções de bugs (ex: `fix: trata conversão de valores do estoque`).
- `docs:` Alterações na documentação.
- `style:` Formatação e estilo visual.
- `refactor:` Alteração de código sem impacto direto em comportamento.

