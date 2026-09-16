import { frasesExemploResumo } from './exemplosResumo.js';

const URL_OPENROUTER = 'https://openrouter.ai/api/v1/chat/completions';
const modeloPadrao = 'nvidia/nemotron-3-ultra-550b-a55b:free';

export class ConfiguracaoOpenRouterError extends Error {
    constructor() {
        super('A chave da OpenRouter não foi configurada no servidor.');
        this.name = 'ConfiguracaoOpenRouterError';
    }
}

export class OpenRouterError extends Error {
    constructor(mensagem, status = 502) {
        super(mensagem);
        this.name = 'OpenRouterError';
        this.status = status;
    }
}

function montarContexto(agendamentos) {
    if (agendamentos.length === 0) {
        return 'Não existem agendamentos para esta data.';
    }

    return agendamentos.map((agendamento) => (
        `- ${agendamento.horario_inicio} até ${agendamento.horario_fim}: ${agendamento.titulo}`
    )).join('\n');
}

function montarExemplosDeEstilo() {
    return frasesExemploResumo
        .map((frase, indice) => `${indice + 1}. ${frase}`)
        .join('\n');
}

export async function gerarResumoDoDia({ mes, dia, nomeMes, agendamentos }) {
    const chave = process.env.OPENROUTER_API_KEY;

    if (!chave) {
        throw new ConfiguracaoOpenRouterError();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const modelo = process.env.OPENROUTER_MODEL || modeloPadrao;

    try {
        const resposta = await fetch(URL_OPENROUTER, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${chave}`,
                'Content-Type': 'application/json',
                'X-OpenRouter-Title': 'Agenda do FREI'
            },
            body: JSON.stringify({
                model: modelo,
                temperature: 0.3,
                max_tokens: 500,
                messages: [
                    {
                        role: 'system',
                        content: `Você transforma agendas em um único texto corrido, natural e cronológico, em português do Brasil. Use apenas as informações fornecidas e não invente horários ou atividades. Não use Markdown, títulos, tabelas, listas, asteriscos ou quebras de linha. Conecte os compromissos com expressões como "às", "depois" e "por fim". Use as frases abaixo somente como referência de estilo; não copie suas informações para o resumo.\n\nExemplos de estilo:\n${montarExemplosDeEstilo()}\n\nQuando não houver agendamentos, responda apenas que não há agendamentos para a data.`
                    },
                    {
                        role: 'user',
                        content: `Escreva o texto-resumo dos agendamentos de ${dia} de ${nomeMes}. A resposta deve conter somente um parágrafo em texto corrido.

Horários:
${montarContexto(agendamentos)}`
                    }
                ]
            })
        });

        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            const mensagem = dados?.error?.message || 'A OpenRouter não conseguiu gerar o resumo.';
            const status = resposta.status === 429 ? 429 : 502;
            throw new OpenRouterError(mensagem, status);
        }

        const resumo = dados?.choices?.[0]?.message?.content?.trim();

        if (!resumo) {
            throw new OpenRouterError('A OpenRouter retornou uma resposta sem conteúdo.');
        }

        return { resumo, modelo: dados.model || modelo };
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new OpenRouterError('A geração do resumo demorou demais. Tente novamente.');
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}
