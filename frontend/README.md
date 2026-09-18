# Frontend — Agenda da Feira de Profissões

Interface React da Agenda do FREI, empacotada com Vite.

## Desenvolvimento

```bash
npm ci
npm run dev
```

O servidor inicia em `http://localhost:5173`. O atalho `npm start` também inicia o Vite.

## API

Copie o arquivo de exemplo de ambiente antes de iniciar o projeto:

```bash
cp .env.example .env
```

Defina `VITE_API_URL` com o endereço público do backend. Quando não informada, a aplicação usa `http://localhost:8000`.

```dotenv
VITE_API_URL=http://localhost:8000
```

## Produção

```bash
npm run build
npm run preview
```

Os arquivos de produção são gerados em `dist/`. Para publicar em uma subpasta, configure `base` em `vite.config.js`; a navegação e os assets respeitam essa configuração.
