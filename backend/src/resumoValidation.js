function obterDiasNoMes(mes, ano = new Date().getFullYear()) {
    return new Date(ano, mes, 0).getDate();
}

export function normalizarDataResumo(dados) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
        return null;
    }

    const campos = Object.keys(dados);

    if (
        campos.length !== 2 ||
        !Object.hasOwn(dados, 'mes') ||
        !Object.hasOwn(dados, 'dia')
    ) {
        return null;
    }

    const mes = Number(dados.mes);
    const dia = Number(dados.dia);

    if (
        !Number.isInteger(mes) ||
        mes < 1 ||
        mes > 12 ||
        !Number.isInteger(dia) ||
        dia < 1 ||
        dia > obterDiasNoMes(mes)
    ) {
        return null;
    }

    return { mes, dia };
}
