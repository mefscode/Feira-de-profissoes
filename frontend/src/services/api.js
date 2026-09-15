const API_URL = (
  process.env.REACT_APP_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

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

  return tratarResposta(response);
}

export async function listarAgendamentos({ signal } = {}) {
  const response = await fetch(`${API_URL}/agendamentos`, { signal });

  return tratarResposta(response);
}

export async function removerAgendamento(id) {
  const response = await fetch(`${API_URL}/agendamentos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  return tratarResposta(response);
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

  return tratarResposta(response);
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
