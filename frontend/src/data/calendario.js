export const nomesMeses = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export const nomesDiasSemana = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

export const anoCalendario = new Date().getFullYear();

export function obterMesAtual() {
  return new Date().getMonth() + 1;
}

export function obterNomeMes(mes) {
  return nomesMeses[Number(mes) - 1] || '';
}

export function obterDiasDoMes(mes, ano = anoCalendario) {
  return new Date(ano, Number(mes), 0).getDate();
}

export function obterColunasCalendario(mes, ano = anoCalendario) {
  const mesNumero = Number(mes);
  const primeiroDiaDaSemana = new Date(ano, mesNumero - 1, 1).getDay();
  const totalDias = obterDiasDoMes(mesNumero, ano);
  const totalDiasMesAnterior = obterDiasDoMes(
    mesNumero === 1 ? 12 : mesNumero - 1,
    mesNumero === 1 ? ano - 1 : ano,
  );
  const totalCelulas = Math.ceil((primeiroDiaDaSemana + totalDias) / 7) * 7;
  const colunas = nomesDiasSemana.map((nome) => ({ nome, dias: [] }));

  for (let indice = 0; indice < totalCelulas; indice += 1) {
    const diaDoMes = indice - primeiroDiaDaSemana + 1;
    let numero = diaDoMes;
    let ativo = true;

    if (diaDoMes < 1) {
      numero = totalDiasMesAnterior + diaDoMes;
      ativo = false;
    } else if (diaDoMes > totalDias) {
      numero = diaDoMes - totalDias;
      ativo = false;
    }

    colunas[indice % 7].dias.push({ numero, ativo });
  }

  return colunas;
}
