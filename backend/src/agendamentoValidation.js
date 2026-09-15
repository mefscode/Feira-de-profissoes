const horarioRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const camposPermitidos = [
    'titulo',
    'mes',
    'dia',
    'horario_inicio',
    'horario_fim'
];

function horarioParaMinutos(horario) {
    const [hora, minuto] = horario.split(':').map(Number);
    return hora * 60 + minuto;
}

function obterDiasNoMes(mes, ano = new Date().getFullYear()) {
    return new Date(ano, mes, 0).getDate();
}

export function normalizarAgendamento(dados) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
        return null;
    }

    const camposRecebidos = Object.keys(dados);
    const possuiSomenteCamposPermitidos = camposRecebidos.every((campo) =>
        camposPermitidos.includes(campo)
    );
    const possuiTodosOsCampos = camposPermitidos.every((campo) =>
        Object.hasOwn(dados, campo)
    );

    if (!possuiSomenteCamposPermitidos || !possuiTodosOsCampos) {
        return null;
    }

    const titulo = typeof dados.titulo === 'string'
        ? dados.titulo.trim()
        : '';
    const mes = Number(dados.mes);
    const dia = Number(dados.dia);
    const horarioInicio = typeof dados.horario_inicio === 'string'
        ? dados.horario_inicio.trim()
        : '';
    const horarioFim = typeof dados.horario_fim === 'string'
        ? dados.horario_fim.trim()
        : '';

    const valido = (
        titulo.length >= 1 &&
        titulo.length <= 120 &&
        Number.isInteger(mes) &&
        mes >= 1 &&
        mes <= 12 &&
        Number.isInteger(dia) &&
        dia >= 1 &&
        dia <= obterDiasNoMes(mes) &&
        horarioRegex.test(horarioInicio) &&
        horarioRegex.test(horarioFim) &&
        horarioParaMinutos(horarioFim) >= horarioParaMinutos(horarioInicio)
    );

    if (!valido) {
        return null;
    }

    return {
        titulo,
        mes: String(mes),
        dia: String(dia),
        horario_inicio: horarioInicio,
        horario_fim: horarioFim
    };
}

export function normalizarId(valor) {
    if (!/^\d+$/.test(String(valor))) {
        return null;
    }

    const id = Number(valor);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
