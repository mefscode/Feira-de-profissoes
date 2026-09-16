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

async function gerarResumoDaData({ mes, dia }) {
    const agendamentos = await listarAgendamentosPorData(mes, dia);
    const resultado = await gerarResumoDoDia({
        mes,
        dia,
        nomeMes: nomesMeses[mes - 1],
        agendamentos
    });

    return { agendamentos, resultado };
}

export function refazerResumosEmSegundoPlano(datas) {
    if (!process.env.OPENROUTER_API_KEY) {
        return;
    }

    const datasUnicas = [...new Map(
        datas.map(({ mes, dia }) => [`${mes}:${dia}`, { mes: Number(mes), dia: Number(dia) }])
    ).values()];

    for (const data of datasUnicas) {
        void gerarResumoDaData(data).catch((error) => {
            console.error(`Não foi possível refazer o resumo de ${data.dia}/${data.mes}:`, error.message);
        });
    }
}

endpoints.post('/resumos', async (req, res, next) => {
    const data = normalizarDataResumo(req.body);

    if (!data) {
        return res.status(400).json({
            erro: 'Informe mês e dia válidos para gerar o resumo.'
        });
    }

    try {
        const { agendamentos, resultado } = await gerarResumoDaData(data);

        return res.status(200).json({
            resumo: resultado.resumo,
            modelo: resultado.modelo,
            total_agendamentos: agendamentos.length,
            origem: resultado.origem
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
