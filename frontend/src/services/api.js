const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

const PREFIXO_CACHE_RESUMO = 'agenda-frei:resumo:v2:';
const DURACAO_CACHE_RESUMO_MS = 24 * 60 * 60 * 1000;

function obterArmazenamentoLocal() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function criarChaveDeResumo(mes, dia) {
  return `${PREFIXO_CACHE_RESUMO}${mes}:${dia}`;
}

export function lerResumoPersistido({ mes, dia }) {
  const armazenamento = obterArmazenamentoLocal();

  if (!armazenamento) {
    return null;
  }

  try {
    const chave = criarChaveDeResumo(mes, dia);
    const dados = JSON.parse(armazenamento.getItem(chave) || 'null');
    const resumoValido =
      dados &&
      typeof dados.resumo === 'string' &&
      Number.isInteger(dados.totalAgendamentos) &&
      Number.isFinite(dados.geradoEm) &&
      Date.now() - dados.geradoEm < DURACAO_CACHE_RESUMO_MS;

    if (resumoValido) {
      return dados;
    }

    armazenamento.removeItem(chave);
  } catch {
    // O resumo continua funcionando quando o navegador bloqueia o armazenamento.
  }

  return null;
}

export function salvarResumoPersistido({ mes, dia, resumo, totalAgendamentos }) {
  const armazenamento = obterArmazenamentoLocal();

  if (!armazenamento) {
    return;
  }

  try {
    armazenamento.setItem(
      criarChaveDeResumo(mes, dia),
      JSON.stringify({ resumo, totalAgendamentos, geradoEm: Date.now() }),
    );
  } catch {
    // Falha de espaço ou de permissão não deve impedir a exibição do resumo.
  }
}

export function invalidarResumosPersistidos() {
  const armazenamento = obterArmazenamentoLocal();

  if (!armazenamento) {
    return;
  }

  try {
    for (let indice = armazenamento.length - 1; indice >= 0; indice -= 1) {
      const chave = armazenamento.key(indice);

      if (chave?.startsWith(PREFIXO_CACHE_RESUMO)) {
        armazenamento.removeItem(chave);
      }
    }
  } catch {
    // A próxima abertura da tela simplesmente consultará a API novamente.
  }
}

async function lerJson(response) {
  const texto = await response.text();

  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

async function tratarResposta(response) {
  const dados = await lerJson(response);

  if (!response.ok) {
    const mensagem =
      dados && typeof dados.erro === 'string'
        ? dados.erro
        : `Não foi possível concluir a solicitação (${response.status}).`;

    const erro = new Error(mensagem);
    erro.status = response.status;
    throw erro;
  }

  return dados;
}

export async function criarAgendamento(dados) {
  const response = await fetch(`${API_URL}/agendamentos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });
  const resultado = await tratarResposta(response);

  invalidarResumosPersistidos();
  return resultado;
}

export async function listarAgendamentos({ signal } = {}) {
  const response = await fetch(`${API_URL}/agendamentos`, { signal });

  return tratarResposta(response);
}

export async function removerAgendamento(id) {
  const response = await fetch(`${API_URL}/agendamentos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const resultado = await tratarResposta(response);

  invalidarResumosPersistidos();
  return resultado;
}

export async function editarAgendamento({
  id,
  titulo,
  mes,
  dia,
  horario,
  horario_inicio,
  horario_fim,
}) {
  const horarioInicio = horario_inicio ?? horario;
  const horarioFim = horario_fim ?? horarioInicio;

  const response = await fetch(`${API_URL}/agendamentos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      titulo: String(titulo),
      mes: String(mes),
      dia: String(dia),
      horario_inicio: String(horarioInicio),
      horario_fim: String(horarioFim),
    }),
  });
  const resultado = await tratarResposta(response);

  invalidarResumosPersistidos();
  return resultado;
}

export async function gerarResumo({ mes, dia, signal } = {}) {
  const response = await fetch(`${API_URL}/resumos`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mes: String(mes),
      dia: String(dia),
    }),
  });

  return tratarResposta(response);
}
