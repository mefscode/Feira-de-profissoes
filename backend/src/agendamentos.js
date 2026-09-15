import conexao from '../database/db.js';

const nomeBloqueioEscrita = 'agenda:agendamentos:escrita';
const colunasAgendamento = `
    id,
    titulo,
    mes,
    dia,
    TIME_FORMAT(horarioInicio, '%H:%i') AS horario_inicio,
    TIME_FORMAT(horarioFim, '%H:%i') AS horario_fim
`;

export class ConflitoDeHorarioError extends Error {
    constructor() {
        super('Este horário conflita com outro agendamento deste dia.');
        this.name = 'ConflitoDeHorarioError';
    }
}

export class BloqueioDeAgendaError extends Error {
    constructor() {
        super('A agenda está ocupada. Tente novamente em alguns instantes.');
        this.name = 'BloqueioDeAgendaError';
    }
}

function normalizarRegistro(registro) {
    return {
        id: Number(registro.id),
        titulo: String(registro.titulo),
        mes: String(registro.mes),
        dia: String(registro.dia),
        horario_inicio: String(registro.horario_inicio),
        horario_fim: String(registro.horario_fim)
    };
}

async function executarEscrita(operacao) {
    const connection = await conexao.getConnection();
    let bloqueioAdquirido = false;
    let transacaoAberta = false;

    try {
        const [resultadoBloqueio] = await connection.execute(
            'SELECT GET_LOCK(?, 5) AS adquirido',
            [nomeBloqueioEscrita]
        );

        bloqueioAdquirido = Number(resultadoBloqueio[0]?.adquirido) === 1;

        if (!bloqueioAdquirido) {
            throw new BloqueioDeAgendaError();
        }

        await connection.beginTransaction();
        transacaoAberta = true;

        const resultado = await operacao(connection);

        await connection.commit();
        transacaoAberta = false;

        return resultado;
    } catch (error) {
        if (transacaoAberta) {
            await connection.rollback();
        }

        throw error;
    } finally {
        if (bloqueioAdquirido) {
            try {
                await connection.execute(
                    'SELECT RELEASE_LOCK(?)',
                    [nomeBloqueioEscrita]
                );
            } catch {
                // A conexão também libera o bloqueio caso seja encerrada.
            }
        }

        connection.release();
    }
}

async function verificarConflito(connection, agendamento, idIgnorado = null) {
    const parametros = [
        Number(agendamento.mes),
        Number(agendamento.dia),
        agendamento.horario_fim,
        agendamento.horario_inicio
    ];
    let filtroId = '';

    if (idIgnorado !== null) {
        filtroId = 'AND id <> ?';
        parametros.push(idIgnorado);
    }

    const [registros] = await connection.execute(
        `SELECT id
         FROM agendamentos
         WHERE mes = ?
           AND dia = ?
           AND horarioInicio <= ?
           AND horarioFim >= ?
           ${filtroId}
         LIMIT 1`,
        parametros
    );

    if (registros.length > 0) {
        throw new ConflitoDeHorarioError();
    }
}

export async function listarAgendamentos() {
    const [registros] = await conexao.query(
        `SELECT ${colunasAgendamento}
         FROM agendamentos
         ORDER BY mes, dia, horarioInicio, id`
    );

    return registros.map(normalizarRegistro);
}

export async function listarAgendamentosPorData(mes, dia) {
    const [registros] = await conexao.execute(
        `SELECT ${colunasAgendamento}
         FROM agendamentos
         WHERE mes = ? AND dia = ?
         ORDER BY horarioInicio, id`,
        [mes, dia]
    );

    return registros.map(normalizarRegistro);
}

export async function criarAgendamento(agendamento) {
    return executarEscrita(async (connection) => {
        await verificarConflito(connection, agendamento);

        const [resultado] = await connection.execute(
            `INSERT INTO agendamentos
                (titulo, mes, dia, horarioInicio, horarioFim)
             VALUES (?, ?, ?, ?, ?)`,
            [
                agendamento.titulo,
                Number(agendamento.mes),
                Number(agendamento.dia),
                agendamento.horario_inicio,
                agendamento.horario_fim
            ]
        );

        return {
            id: Number(resultado.insertId),
            ...agendamento
        };
    });
}

export async function atualizarAgendamento(id, agendamento) {
    return executarEscrita(async (connection) => {
        const [existentes] = await connection.execute(
            'SELECT id FROM agendamentos WHERE id = ? FOR UPDATE',
            [id]
        );

        if (existentes.length === 0) {
            return null;
        }

        await verificarConflito(connection, agendamento, id);

        await connection.execute(
            `UPDATE agendamentos
             SET titulo = ?,
                 mes = ?,
                 dia = ?,
                 horarioInicio = ?,
                 horarioFim = ?
             WHERE id = ?`,
            [
                agendamento.titulo,
                Number(agendamento.mes),
                Number(agendamento.dia),
                agendamento.horario_inicio,
                agendamento.horario_fim,
                id
            ]
        );

        return { id, ...agendamento };
    });
}

export async function removerAgendamento(id) {
    return executarEscrita(async (connection) => {
        const [resultado] = await connection.execute(
            'DELETE FROM agendamentos WHERE id = ?',
            [id]
        );

        return resultado.affectedRows > 0;
    });
}
