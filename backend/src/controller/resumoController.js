import { Router } from 'express';
import { listarAgendamentosPorData } from '../agendamentos.js';
import {
    ConfiguracaoOpenRouterError,
    gerarResumoDoDia,
    OpenRouterError
} from '../openRouter.js';
import { normalizarDataResumo } from '../resumoValidation.js';

const endpoints = Router();
const nomesMeses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

endpoints.post('/resumos', async (req, res, next) => {
    const data = normalizarDataResumo(req.body);

    if (!data) {
        return res.status(400).json({
            erro: 'Informe mês e dia válidos para gerar o resumo.'
        });
    }

    try {
        const agendamentos = await listarAgendamentosPorData(data.mes, data.dia);
        const resultado = await gerarResumoDoDia({
            ...data,
            nomeMes: nomesMeses[data.mes - 1],
            agendamentos
        });

        return res.status(200).json({
            resumo: resultado.resumo,
            modelo: resultado.modelo,
            total_agendamentos: agendamentos.length
        });
    } catch (error) {
        if (error instanceof ConfiguracaoOpenRouterError) {
            return res.status(503).json({ erro: error.message });
        }

        if (error instanceof OpenRouterError) {
            return res.status(error.status).json({ erro: error.message });
        }

        return next(error);
    }
});

export default endpoints;
