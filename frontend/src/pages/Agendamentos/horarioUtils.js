export const horarios = Array.from(
  { length: 24 },
  (_, hora) => `${String(hora).padStart(2, '0')}:00`,
);

export const horarioRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export function obterHorarioInicio(agendamento) {
  return String(
    agendamento.horario_inicio || agendamento.horario || '',
  ).trim();
}

export function obterHorarioFim(agendamento) {
  return String(
    agendamento.horario_fim ||
      agendamento.horario_inicio ||
      agendamento.horario ||
      '',
  ).trim();
}

export function horarioParaMinutos(horario) {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + minuto;
}

export function minutosParaHorario(totalMinutos) {
  const hora = Math.floor(totalMinutos / 60);
  const minuto = totalMinutos % 60;

  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

export function intervalosConflitam(inicioA, fimA, inicioB, fimB) {
  const inicioMinutosA = horarioParaMinutos(inicioA);
  const fimMinutosA = horarioParaMinutos(fimA);
  const inicioMinutosB = horarioParaMinutos(inicioB);
  const fimMinutosB = horarioParaMinutos(fimB);

  return inicioMinutosA <= fimMinutosB && inicioMinutosB <= fimMinutosA;
}

export function algumAgendamentoConflita(
  agendamentos,
  horarioInicio,
  horarioFim,
) {
  return agendamentos.some((agendamento) => {
    const inicio = obterHorarioInicio(agendamento);
    const fim = obterHorarioFim(agendamento);

    return (
      horarioRegex.test(inicio) &&
      horarioRegex.test(fim) &&
      intervalosConflitam(horarioInicio, horarioFim, inicio, fim)
    );
  });
}
