import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({
    path: fileURLToPath(new URL('../.env', import.meta.url)),
    quiet: true
});

const portaBanco = Number(process.env.DB_PORT || 3306);

const conexao = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number.isInteger(portaBanco) ? portaBanco : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_NAME || 'agenda',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default conexao;
