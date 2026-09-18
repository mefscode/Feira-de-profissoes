# Agenda — Feira de Profissões

Aplicação web para organizar a programação da Feira de Profissões. Ela permite cadastrar compromissos pontuais e eventos com duração, consultar a agenda em calendário, editar ou excluir registros e gerar um resumo cronológico das atividades de cada dia.

O projeto é composto por um frontend em React, uma API REST em Express e um banco de dados MySQL. A geração de resumos usa a OpenRouter de forma opcional.

## Funcionalidades

- Cadastro de agendamentos em horários específicos e de eventos com duração.
- Validação de data, horário e título, tanto na interface quanto na API.
- Prevenção de conflitos entre intervalos de horários no mesmo dia.
- Visualização mensal da agenda, com detalhes dos eventos por dia.
- Edição e exclusão de agendamentos.
- Resumo diário em português gerado por IA; quando não há eventos, o próprio servidor informa que a agenda está vazia.
- Cache de resumos no servidor e no navegador para reduzir chamadas à IA.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite, React Router e Sass |
| Backend | Node.js, Express 5, CORS, dotenv e mysql2 |
| Banco de dados | MySQL |
| Resumos por IA (opcional) | OpenRouter |

## Estrutura do projeto

```text
.
├── frontend/                 # Interface React
│   └── src/
│       ├── pages/            # Agendamento, agenda e resumo diário
│       └── services/api.js   # Comunicação com a API
├── backend/                  # API REST em Express
│   ├── database/             # Conexão e migrações MySQL
│   └── src/                  # Rotas, validações e integração OpenRouter
├── tabela                    # Script SQL para criar o banco e a tabela
└── readme.md
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado: versão LTS atual).
- MySQL 8 ou compatível, em execução.
- Uma chave da OpenRouter, somente para usar os resumos de agendas que possuem eventos.

## Como executar

### 1. Criar o banco de dados

Na raiz do projeto, o arquivo `tabela` contém o script inicial. Importe-o no MySQL:

```bash
mysql -u root -p < tabela
```

O comando cria o banco `agenda` e a tabela `AGENDAMENTOS`. Em instalações MySQL em que nomes de tabela diferenciam maiúsculas de minúsculas, crie a tabela como `agendamentos`, pois a API a consulta com esse nome:

```sql
CREATE DATABASE agenda;
USE agenda;

CREATE TABLE agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  horarioInicio TIME NOT NULL,
  mes INT NOT NULL,
  dia INT NOT NULL,
  horarioFim TIME NOT NULL
);
```

Se você já possui uma tabela criada antes do suporte a vários meses, execute uma única vez a migração em `backend/database/migrations/001-adicionar-mes.sql`.

### 2. Configurar o backend

Instale as dependências e crie o arquivo de variáveis de ambiente:

```bash
cd backend
npm ci
cp .env.example .env
```

Edite `backend/.env` com os dados do seu MySQL:

```dotenv
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=agenda
```

Para habilitar os resumos por IA, acrescente uma chave válida da OpenRouter:

```dotenv
OPENROUTER_API_KEY=sua_chave
```

As demais variáveis de `backend/.env.example` permitem trocar o modelo, prioridade de provedor, limite de tokens, tempo máximo e cache. Sem `OPENROUTER_API_KEY`, a agenda continua funcionando normalmente, mas a geração de resumo para dias com agendamentos retorna uma mensagem de configuração.

Inicie a API:

```bash
npm start
```

A API ficará disponível em `http://localhost:8000`.

### 3. Configurar e iniciar o frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
npm ci
npm run dev
```

Abra `http://localhost:5173` no navegador. O comando `npm start` também é aceito como atalho para o servidor Vite. Por padrão, o frontend procura a API em `http://localhost:8000`.

Caso a API esteja em outro endereço, copie `frontend/.env.example` para `frontend/.env` e altere a variável antes de iniciar o Vite:

```dotenv
VITE_API_URL=http://localhost:8000
```

Reinicie `npm start` depois de alterar esse arquivo.

## Rotas da interface

| Rota | Descrição |
| --- | --- |
| `/` | Criação de agendamentos e eventos. |
| `/agenda` | Calendário mensal, edição e remoção de registros. |
| `/resumo` | Geração do resumo de uma data selecionada. |

## API REST

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `GET` | `/agendamentos` | Lista todos os agendamentos em ordem de data e horário. |
| `POST` | `/agendamentos` | Cria um agendamento. |
| `PUT` | `/agendamentos/:id` | Atualiza um agendamento existente. |
| `DELETE` | `/agendamentos/:id` | Exclui um agendamento. |
| `POST` | `/resumos` | Gera o resumo dos agendamentos de uma data. |

Exemplo de corpo para criar ou atualizar um agendamento:

```json
{
  "titulo": "Palestra de Tecnologia",
  "mes": "9",
  "dia": "15",
  "horario_inicio": "09:00",
  "horario_fim": "10:00"
}
```

`titulo` aceita de 1 a 120 caracteres. `mes` e `dia` precisam compor uma data válida, e os horários devem estar no formato `HH:MM`. O horário de término não pode ser anterior ao de início. A API rejeita agendamentos que se sobreponham no mesmo dia com `409 Conflict`.

Para gerar um resumo:

```json
{
  "mes": "9",
  "dia": "15"
}
```

## Testes e build

Execute os testes de validação da API:

```bash
cd backend
npm test
```

Para criar a versão de produção do frontend:

```bash
cd frontend
npm run build
```

## Observações sobre os resumos

Os resumos são gerados em ordem cronológica com os dados cadastrados para o dia. Se o título de algum item contiver “Feira de Profissões”, o resumo usa uma introdução especial. O servidor mantém um cache local configurável e também pede cache à OpenRouter; o navegador conserva o último resumo por 24 horas. Alterações na agenda invalidam o cache do navegador e atualizam os resumos em segundo plano quando a chave da OpenRouter está configurada.
