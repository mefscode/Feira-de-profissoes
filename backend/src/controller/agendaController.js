import { Router } from 'express';
import {
    atualizarAgendamento,
    BloqueioDeAgendaError,
    ConflitoDeHorarioError,
    listarAgendamentos,
    removerAgendamento
} from '../agendamentos.js';
import {
    normalizarAgendamento,
    normalizarId
} from '../agendamentoValidation.js';
import { refazerResumosEmSegundoPlano } from './resumoController.js';

const endpoints = Router();

endpoints.get('/agendamentos', async (req, res, next) => {
    try {
        const agendamentos = await listarAgendamentos();

        return res.status(200).json(agendamentos);
    } catch (error) {
        return next(error);
    }
});

endpoints.put('/agendamentos/:id', async (req, res, next) => {
    const id = normalizarId(req.params.id);
    const agendamento = normalizarAgendamento(req.body);

    if (!id || !agendamento) {
        return res.status(400).json({
            erro: 'Informe um ID, mês, dia e os dados completos e válidos do agendamento.'
        });
    }

    try {
        const resultadoDaAtualizacao = await atualizarAgendamento(id, agendamento);

        if (!resultadoDaAtualizacao) {
            return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        }

        refazerResumosEmSegundoPlano(resultadoDaAtualizacao.datasAfetadas);
        return res.status(200).json(resultadoDaAtualizacao.registro);
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

endpoints.delete('/agendamentos/:id', async (req, res, next) => {
    const id = normalizarId(req.params.id);

    if (!id) {
        return res.status(400).json({ erro: 'Informe um ID válido.' });
    }

    try {
        const registroRemovido = await removerAgendamento(id);

        if (!registroRemovido) {
            return res.status(404).json({ erro: 'Agendamento não encontrado.' });
        }

        refazerResumosEmSegundoPlano([registroRemovido]);
        return res.status(204).send();
    } catch (error) {
        if (error instanceof BloqueioDeAgendaError) {
            return res.status(503).json({ erro: error.message });
        }

        return next(error);
    }
});

export default endpoints;
