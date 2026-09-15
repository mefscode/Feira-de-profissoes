import { Router } from 'express';
import {
    BloqueioDeAgendaError,
    ConflitoDeHorarioError,
    criarAgendamento
} from '../agendamentos.js';
import { normalizarAgendamento } from '../agendamentoValidation.js';

const endpoints = Router();

endpoints.post('/agendamentos', async (req, res, next) => {
    const agendamento = normalizarAgendamento(req.body);

    if (!agendamento) {
        return res.status(400).json({
            erro: 'Informe somente título, mês, dia, horario_inicio e horario_fim, todos válidos.'
        });
    }

    try {
        const registroCriado = await criarAgendamento(agendamento);

        return res.status(201).json(registroCriado);
    } catch (error) {
        if (error instanceof ConflitoDeHorarioError) {
            return res.status(409).json({ erro: error.message });
        }

        if (error instanceof BloqueioDeAgendaError) {
            return res.status(503).json({ erro: error.message });
        }

        return next(error);
    }
});

export default endpoints;
