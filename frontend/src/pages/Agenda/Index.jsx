import './Index.scss';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  nomesMeses,
  obterColunasCalendario,
  obterDiasDoMes,
  obterMesAtual,
  obterNomeMes,
} from '../../data/calendario';
import {
  editarAgendamento,
  listarAgendamentos,
  removerAgendamento,
} from '../../services/api';

const horarioRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function obterHorarioInicio(agendamento) {
  return String(
    agendamento.horario_inicio || agendamento.horario || '',
  ).trim();
}

function obterHorarioFim(agendamento) {
  return String(
    agendamento.horario_fim ||
      agendamento.horario_inicio ||
      agendamento.horario ||
      '',
  ).trim();
}

function obterTextoHorario(agendamento) {
  const inicio = obterHorarioInicio(agendamento);
  const fim = obterHorarioFim(agendamento);

  return inicio === fim ? inicio : `${inicio} - ${fim}`;
}

function ordenarPorHorario(primeiro, segundo) {
  return obterHorarioInicio(primeiro).localeCompare(
    obterHorarioInicio(segundo),
  );
}

export default function Agenda() {
  const [mesSelecionado, setMesSelecionado] = useState(obterMesAtual);
  const [selectedDay, setSelectedDay] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [agendamentoEmRemocao, setAgendamentoEmRemocao] = useState('');
  const [erroRemocao, setErroRemocao] = useState('');
  const [edicao, setEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const ultimoDiaFocado = useRef(null);

  const carregarAgenda = useCallback(async (signal) => {
    setCarregando(true);
    setErro('');

    try {
      const dados = await listarAgendamentos({ signal });

      if (!Array.isArray(dados)) {
        throw new Error('O backend retornou uma agenda inválida.');
      }

      const ordenados = [...dados].sort(ordenarPorHorario);

      setAgendamentos(ordenados);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setErro(error.message || 'Não foi possível carregar a agenda.');
      }
    } finally {
      if (!signal?.aborted) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    carregarAgenda(controller.signal);

    return () => controller.abort();
  }, [carregarAgenda]);

  const nomeMesSelecionado = obterNomeMes(mesSelecionado);
  const colunasCalendario = useMemo(
    () => obterColunasCalendario(mesSelecionado),
    [mesSelecionado],
  );

  const agendamentosPorDia = useMemo(
    () =>
      agendamentos.reduce((grupos, agendamento) => {
        const mes = Number(agendamento.mes || 9);
        const dia = Number(agendamento.dia);

        if (
          mes !== mesSelecionado ||
          !Number.isInteger(dia) ||
          dia < 1 ||
          dia > obterDiasDoMes(mesSelecionado)
        ) {
          return grupos;
        }

        if (!grupos[dia]) {
          grupos[dia] = [];
        }

        grupos[dia].push(agendamento);
        return grupos;
      }, {}),
    [agendamentos, mesSelecionado],
  );

  const agendamentosSelecionados =
    selectedDay === null ? [] : agendamentosPorDia[selectedDay] || [];

  function openDay(dia, elemento) {
    ultimoDiaFocado.current = elemento;
    setErroRemocao('');
    setErroEdicao('');
    setEdicao(null);
    setSelectedDay(dia);
  }

  function closeDay() {
    if (agendamentoEmRemocao || salvandoEdicao) {
      return;
    }

    setErroRemocao('');
    setErroEdicao('');
    setEdicao(null);
    setSelectedDay(null);
    window.requestAnimationFrame(() => ultimoDiaFocado.current?.focus());
  }

  function mudarMes(deslocamento) {
    if (agendamentoEmRemocao || salvandoEdicao) {
      return;
    }

    setMesSelecionado((mesAtual) => ((mesAtual - 1 + deslocamento + 12) % 12) + 1);
    setSelectedDay(null);
    setEdicao(null);
    setErroEdicao('');
    setErroRemocao('');
  }

  function iniciarEdicao(agendamento) {
    const horarioInicio = obterHorarioInicio(agendamento);
    const horarioFim = obterHorarioFim(agendamento);

    setErroRemocao('');
    setErroEdicao('');
    setEdicao({
      id: agendamento.id,
      titulo: String(agendamento.titulo),
      mes: String(agendamento.mes || 9),
      dia: String(agendamento.dia),
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
    });
  }

  function cancelarEdicao() {
    if (salvandoEdicao) {
      return;
    }

    setErroEdicao('');
    setEdicao(null);
  }

  async function salvarEdicao(event) {
    event.preventDefault();

    const titulo = edicao.titulo.trim();
    const mes = String(edicao.mes).trim();
    const dia = String(edicao.dia).trim();
    const horarioInicio = String(edicao.horario_inicio).trim();
    const horarioFim = String(edicao.horario_fim).trim();
    const numeroMes = Number(mes);
    const numeroDia = Number(dia);
    const horarioInicioValido = horarioRegex.test(horarioInicio);
    const horarioFimValido = horarioRegex.test(horarioFim);

    if (
      !titulo ||
      !Number.isInteger(numeroMes) ||
      numeroMes < 1 ||
      numeroMes > 12 ||
      !Number.isInteger(numeroDia) ||
      numeroDia < 1 ||
      numeroDia > obterDiasDoMes(numeroMes) ||
      !horarioInicioValido ||
      !horarioFimValido ||
      horarioFim < horarioInicio
    ) {
      setErroEdicao('Preencha o texto, mês, dia e horários válidos.');
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao('');

    try {
      const agendamentoAtualizado = await editarAgendamento({
        id: edicao.id,
        titulo,
        mes,
        dia,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
      });

      setAgendamentos((atuais) =>
        atuais
          .map((agendamento) =>
            agendamento.id === edicao.id
              ? agendamentoAtualizado
              : agendamento,
          )
          .sort(ordenarPorHorario),
      );
      setEdicao(null);
      setMesSelecionado(Number(agendamentoAtualizado.mes || 9));
      setSelectedDay(Number(agendamentoAtualizado.dia));
    } catch (error) {
      setErroEdicao(
        error.message || 'Não foi possível editar o agendamento.',
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function deleteSchedule(agendamento) {
    const identificador = String(agendamento.id);
    setAgendamentoEmRemocao(identificador);
    setErroRemocao('');
    setErroEdicao('');

    try {
      await removerAgendamento(agendamento.id);

      setAgendamentos((atuais) =>
        atuais.filter((item) => item.id !== agendamento.id),
      );
    } catch (error) {
      setErroRemocao(
        error.message || 'Não foi possível excluir o agendamento.',
      );
    } finally {
      setAgendamentoEmRemocao('');
    }
  }

  function closeDayWithEscape(event) {
    if (event.key === 'Escape') {
      if (edicao) {
        cancelarEdicao();
        return;
      }

      closeDay();
      return;
    }

    if (event.key === 'Tab') {
      const elementosFocaveis = event.currentTarget.querySelectorAll(
        '.day-expanded a[href], .day-expanded button:not(:disabled), .day-expanded input:not(:disabled), .day-expanded select:not(:disabled)',
      );
      const primeiroElemento = elementosFocaveis[0];
      const ultimoElemento = elementosFocaveis[elementosFocaveis.length - 1];

      if (!primeiroElemento || !ultimoElemento) {
        return;
      }

      const deveVoltarAoFim =
        event.shiftKey && document.activeElement === primeiroElemento;
      const deveVoltarAoInicio =
        !event.shiftKey && document.activeElement === ultimoElemento;

      if (deveVoltarAoFim || deveVoltarAoInicio) {
        event.preventDefault();
        (deveVoltarAoFim ? ultimoElemento : primeiroElemento).focus();
      }
    }
  }

  return (
    <div className="Agenda">
      <header>
        <img
          src={`${import.meta.env.BASE_URL}assets/images/Agenda-FREI.png`}
          alt="Logo Agenda do FREI"
        />
      </header>
      <nav>
        <Link className="botao-agenda" to="/agenda">
          Ver agenda
        </Link>
        <Link className='botao-resumo' to='/resumo'>Resumo IA</Link>
        <Link className="botao-agendamentos" to="/">
          Ver agendamento
        </Link>
      </nav>

      <main>
        <div className="agenda">
          <h1>AGENDA</h1>

          {carregando && (
            <p className="agenda-status" role="status">
              Carregando agendamentos...
            </p>
          )}

          {erro && (
            <div className="agenda-status agenda-error" role="alert">
              <span>{erro}</span>
              <button type="button" onClick={() => carregarAgenda()}>
                Tentar novamente
              </button>
            </div>
          )}

          <div className="seletor-mes">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => mudarMes(-1)}
            >
              &lsaquo;
            </button>
            <h2>{nomeMesSelecionado}</h2>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => mudarMes(1)}
            >
              &rsaquo;
            </button>
          </div>

          <div className="dias">
            {colunasCalendario.map((coluna) => (
              <div className="coluna" key={coluna.nome}>
                <p>{coluna.nome}</p>

                {coluna.dias.map((dia, indiceDia) => {
                  const eventosDoDia = agendamentosPorDia[dia.numero] || [];

                  if (!dia.ativo) {
                    return (
                      <div
                        className="day-inative"
                        key={`${coluna.nome}-${indiceDia}`}
                        aria-hidden="true"
                      >
                        <span className="day-number">{dia.numero}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      className="day-ative"
                      type="button"
                      key={`${coluna.nome}-${indiceDia}`}
                      aria-label={`Dia ${dia.numero} de ${nomeMesSelecionado}: ${eventosDoDia.length} agendamento(s)`}
                      onClick={(event) => openDay(dia.numero, event.currentTarget)}
                    >
                      <span className="day-number">{dia.numero}</span>
                      <span className="day-summary">
                        {eventosDoDia.map((agendamento, indice) => {
                          const horarioTexto = obterTextoHorario(agendamento);

                          return (
                            <span
                              className="day-event-preview"
                              key={`${horarioTexto}-${agendamento.titulo}-${indice}`}
                            >
                              {horarioTexto}
                            </span>
                          );
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {selectedDay !== null && (
            <div
              className="day-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="selected-day-title"
              onKeyDown={closeDayWithEscape}
            >
              <button
                className="day-overlay-background"
                type="button"
                aria-label="Fechar dia selecionado"
                tabIndex={-1}
                onClick={closeDay}
              />

              <section className="day-expanded">
                <button
                  className="day-close"
                  type="button"
                  aria-label="Fechar"
                  onClick={closeDay}
                  autoFocus
                >
                  &times;
                </button>

                <h2 id="selected-day-title">Dia {selectedDay} de {nomeMesSelecionado}</h2>

                {erroRemocao && (
                  <p className="day-delete-error" role="alert">
                    {erroRemocao}
                  </p>
                )}

                {agendamentosSelecionados.length > 0 ? (
                  <ul className="day-event-list">
                    {agendamentosSelecionados.map((agendamento) => {
                      const horarioTexto = obterTextoHorario(agendamento);
                      const identificador = String(agendamento.id);
                      const estaExcluindo =
                        agendamentoEmRemocao === identificador;
                      const estaEditando = edicao?.id === agendamento.id;

                      return (
                        <li
                          className={estaEditando ? 'day-event-editing' : ''}
                          key={identificador}
                        >
                          {estaEditando ? (
                            <form
                              className="day-event-edit-form"
                              aria-busy={salvandoEdicao}
                              onSubmit={salvarEdicao}
                              noValidate
                            >
                              <label className="day-edit-title">
                                <span>Texto</span>
                                <input
                                  type="text"
                                  maxLength="120"
                                  value={edicao.titulo}
                                  disabled={salvandoEdicao}
                                  onChange={(event) =>
                                    setEdicao((atual) => ({
                                      ...atual,
                                      titulo: event.target.value,
                                    }))
                                  }
                                  autoFocus
                                />
                              </label>

                              <div className="day-edit-fields">
                                <label>
                                  <span>Mês</span>
                                  <select
                                    value={edicao.mes}
                                    disabled={salvandoEdicao}
                                    onChange={(event) =>
                                      setEdicao((atual) => {
                                        const mes = event.target.value;
                                        const dia = Math.min(
                                          Number(atual.dia),
                                          obterDiasDoMes(Number(mes)),
                                        );

                                        return { ...atual, mes, dia: String(dia) };
                                      })
                                    }
                                  >
                                    {nomesMeses.map((nomeMes, indice) => (
                                      <option value={indice + 1} key={nomeMes}>
                                        {nomeMes}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label>
                                  <span>Dia</span>
                                  <select
                                    value={edicao.dia}
                                    disabled={salvandoEdicao}
                                    onChange={(event) =>
                                      setEdicao((atual) => ({
                                        ...atual,
                                        dia: event.target.value,
                                      }))
                                    }
                                  >
                                    {Array.from(
                                      { length: obterDiasDoMes(Number(edicao.mes)) },
                                      (_, indice) => indice + 1,
                                    ).map((dia) => (
                                      <option value={dia} key={dia}>
                                        {dia}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label>
                                  <span>Início</span>
                                  <input
                                    type="time"
                                    step="60"
                                    value={edicao.horario_inicio}
                                    disabled={salvandoEdicao}
                                    onChange={(event) =>
                                      setEdicao((atual) => ({
                                        ...atual,
                                        horario_inicio: event.target.value,
                                      }))
                                    }
                                  />
                                </label>

                                <label>
                                  <span>Fim</span>
                                  <input
                                    type="time"
                                    step="60"
                                    value={edicao.horario_fim}
                                    disabled={salvandoEdicao}
                                    onChange={(event) =>
                                      setEdicao((atual) => ({
                                        ...atual,
                                        horario_fim: event.target.value,
                                      }))
                                    }
                                  />
                                </label>
                              </div>

                              {erroEdicao && (
                                <p className="day-edit-error" role="alert">
                                  {erroEdicao}
                                </p>
                              )}

                              <div className="day-edit-actions">
                                <button
                                  className="day-edit-cancel"
                                  type="button"
                                  disabled={salvandoEdicao}
                                  onClick={cancelarEdicao}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className="day-edit-save"
                                  type="submit"
                                  disabled={salvandoEdicao}
                                >
                                  {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="day-event-content">
                                <strong>{horarioTexto}</strong>
                                <span>{agendamento.titulo}</span>
                              </div>

                              <div className="day-event-actions">
                                <Link
                                  className="ia-result"
                                  to={`/resumo?mes=${mesSelecionado}&dia=${selectedDay}`}
                                  title="Resumo"
                                  aria-label={`Ver resumo do dia ${selectedDay} de ${nomeMesSelecionado}`}
                                >
                                  <i
                                    className="fa-solid fa-robot"
                                    aria-hidden="true"
                                  />
                                </Link>
                                <button
                                  className="day-event-edit"
                                  type="button"
                                  title="Editar"
                                  aria-label={`Editar agendamento das ${horarioTexto}: ${agendamento.titulo}`}
                                  disabled={
                                    Boolean(agendamentoEmRemocao) ||
                                    salvandoEdicao ||
                                    Boolean(edicao)
                                  }
                                  onClick={() => iniciarEdicao(agendamento)}
                                >
                                  <i
                                    className="fa-solid fa-pen"
                                    aria-hidden="true"
                                  />
                                </button>

                                <button
                                  className="day-event-delete"
                                  type="button"
                                  title="Lixeira"
                                  aria-label={
                                    estaExcluindo
                                      ? `Excluindo agendamento das ${horarioTexto}`
                                      : `Excluir agendamento das ${horarioTexto}: ${agendamento.titulo}`
                                  }
                                  disabled={
                                    Boolean(agendamentoEmRemocao) ||
                                    salvandoEdicao ||
                                    Boolean(edicao)
                                  }
                                  onClick={() => deleteSchedule(agendamento)}
                                >
                                  <i
                                    className="fa-solid fa-trash-can"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="day-empty-state">
                    <p className="day-without-events">
                      Nenhum agendamento para este dia.
                    </p>
                    <p className="day-schedule-callout">
                      Agende seu horário agora
                    </p>
                    <Link className="day-schedule-link" to="/">
                      Agendar agora
                    </Link>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
