import express from 'express';
import cors from 'cors';
import { addRoutes } from './routes.js';
import conexao from '../database/db.js';

const api = express();
api.use(cors());
api.use(express.json());
addRoutes(api);

api.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ erro: 'O corpo da requisição contém JSON inválido.' });
    }

    console.error('Erro interno da API:', error);

    return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const port = Number(process.env.PORT || 8000);

try {
    const connection = await conexao.getConnection();
    connection.release();

    api.listen(port, () => {
        console.log('API conectada ao MySQL e disponível na porta ' + port);
    });
} catch (error) {
    console.error('Não foi possível conectar ao MySQL:', error.message);
    await conexao.end();
    process.exitCode = 1;
}
