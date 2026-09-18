import './App.scss';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import { criarAgendamento, listarAgendamentos } from '../../services/api';
import {
  Calendario,
  FormularioAgendamento,
  Notificacao,
  OrientacaoAgendamento,
  PainelHorarios,
} from './components';
import {
  algumAgendamentoConflita,
  horarioParaMinutos,
  horarioRegex,
  horarios,
  minutosParaHorario,
  obterHorarioFim,
  obterHorarioInicio,
} from './horarioUtils';
import { obterMesAtual, obterNomeMes } from '../../data/calendario';

function obterOrientacaoAgendamento(
  diaSelecionado,
  nomeMes,
  horarioSelecionado,
  horarioSelecionadoOcupado,
  tipoRegistro,
  eventoInicio,
  eventoFim,
) {
  if (diaSelecionado === null) {
    return {
      icone: 'fa-regular fa-calendar',
      titulo: 'Comece escolhendo uma data',
      texto: 'Depois, selecione o horário desejado na lista ao lado.',
    };
  }

  if (tipoRegistro === 'evento') {
    if (!eventoInicio || !eventoFim) {
      return {
        icone: 'fa-regular fa-clock',
        titulo: `Evento no dia ${diaSelecionado} de ${nomeMes}`,
        texto: 'Informe os horários de início e fim do evento.',
      };
    }

    return {
      icone: 'fa-regular fa-circle-check',
      titulo: `Evento no dia ${diaSelecionado} de ${nomeMes}, das ${eventoInicio} às ${eventoFim}`,
      texto: 'Preencha o título e clique em Adicionar evento para concluir.',
    };
  }

  if (!horarioSelecionado) {
    return {
      icone: 'fa-regular fa-clock',
      titulo: `Dia ${diaSelecionado} de ${nomeMes} selecionado`,
      texto: 'Agora escolha um horário para continuar.',
    };
  }

  if (horarioSelecionadoOcupado) {
    return {
      icone: 'fa-solid fa-triangle-exclamation',
      titulo: `${horarioSelecionado} já está ocupado`,
      texto: 'Ajuste o horário antes de concluir o agendamento.',
    };
  }

  return {
    icone: 'fa-regular fa-circle-check',
    titulo: `Dia ${diaSelecionado} de ${nomeMes}, às ${horarioSelecionado}`,
    texto:
      'Preencha o título e clique em Adicionar agendamento para concluir.',
  };
}

export default function Agendamentos() {
  const [mesSelecionado, setMesSelecionado] = useState(obterMesAtual);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [eventoInicio, setEventoInicio] = useState('');
  const [eventoFim, setEventoFim] = useState('');
  const [tipoRegistro, setTipoRegistro] = useState('agendamento');
  const [titulo, setTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(true);
  const proximoIdNotificacao = useRef(0);

  const adicionarNotificacao = useCallback((tipo, texto) => {
    proximoIdNotificacao.current += 1;
    const id = proximoIdNotificacao.current;

    setNotificacoes((atuais) => [...atuais, { id, tipo, texto }]);
  }, []);

  const removerNotificacao = useCallback((id) => {
    setNotificacoes((atuais) =>
      atuais.filter((notificacao) => notificacao.id !== id),
    );
  }, []);

  const carregarAgendamentos = useCallback(async (signal) => {
    setCarregandoAgenda(true);

    try {
      const dados = await listarAgendamentos({ signal });

      if (!Array.isArray(dados)) {
        throw new Error('O backend retornou uma agenda inválida.');
      }

      setAgendamentos(dados);
    } finally {
      if (!signal?.aborted) {
        setCarregandoAgenda(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    carregarAgendamentos(controller.signal).catch((error) => {
      if (error.name !== 'AbortError') {
        adicionarNotificacao(
          'erro',
          error.message ||
            'Não foi possível consultar os horários disponíveis.',
        );
      }
    });

    return () => controller.abort();
  }, [adicionarNotificacao, carregarAgendamentos]);

  const nomeMesSelecionado = obterNomeMes(mesSelecionado);

  const agendamentosDoDia = useMemo(
    () =>
      agendamentos.filter(
        (agendamento) =>
          Number(agendamento.mes || 9) === mesSelecionado &&
          Number(agendamento.dia) === diaSelecionado,
      ),
    [agendamentos, mesSelecionado, diaSelecionado],
  );

  const horariosDisponiveis = useMemo(
    () =>
      horarios.filter(
        (horario) =>
          !algumAgendamentoConflita(agendamentosDoDia, horario, horario),
      ),
    [agendamentosDoDia],
  );

  const horarioSelecionadoOcupado =
    Boolean(horarioSelecionado) &&
    algumAgendamentoConflita(
      agendamentosDoDia,
      horarioSelecionado,
      horarioSelecionado,
    );
  const estaProcessando = enviando || carregandoAgenda;
  const eventoBloqueado = diaSelecionado === null || estaProcessando;
  const orientacaoAgendamento = obterOrientacaoAgendamento(
    diaSelecionado,
    nomeMesSelecionado,
    horarioSelecionado,
    horarioSelecionadoOcupado,
    tipoRegistro,
    eventoInicio,
    eventoFim,
  );

  function avisarDiaObrigatorio() {
    adicionarNotificacao(
      'erro',
      'Selecione uma data antes de escolher um horário.',
    );
  }

  function limparSelecao() {
    setDiaSelecionado(null);
    setHorarioSelecionado('');
    setEventoInicio('');
    setEventoFim('');
    setTipoRegistro('agendamento');
  }

  function mudarMes(deslocamento) {
    setMesSelecionado((mesAtual) => ((mesAtual - 1 + deslocamento + 12) % 12) + 1);
    limparSelecao();
  }

  function selecionarDia(dia) {
    setDiaSelecionado(dia);
    setHorarioSelecionado('');
    setEventoInicio('');
    setEventoFim('');
    setTipoRegistro('agendamento');
  }

  function selecionarHorario(hora) {
    if (diaSelecionado === null) {
      avisarDiaObrigatorio();
      return;
    }

    setTipoRegistro('agendamento');
    setEventoInicio('');
    setEventoFim('');
    setHorarioSelecionado(hora);
  }

  function selecionarEvento() {
    if (diaSelecionado === null) {
      return;
    }

    setTipoRegistro('evento');
    setHorarioSelecionado('');
  }

  function alterarMinutos(quantidade) {
    if (diaSelecionado === null) {
      avisarDiaObrigatorio();
      return;
    }

    if (!horarioSelecionado) {
      adicionarNotificacao(
        'erro',
        'Selecione um horário antes de ajustar os minutos.',
      );
      return;
    }

    const totalMinutos = horarioParaMinutos(horarioSelecionado) + quantidade;

    if (totalMinutos < 0) {
      adicionarNotificacao(
        'erro',
        'O horário não pode ser anterior a 00:00.',
      );
      return;
    }

    if (totalMinutos >= 24 * 60) {
      adicionarNotificacao(
        'erro',
        'O horário não pode ultrapassar 23:59.',
      );
      return;
    }

    setHorarioSelecionado(minutosParaHorario(totalMinutos));
  }

  function existeConflitoNoDia(inicio, fim) {
    return algumAgendamentoConflita(agendamentosDoDia, inicio, fim);
  }

  function criarDadosAgendamento(tituloNormalizado, mes, dia, horario) {
    return {
      titulo: tituloNormalizado,
      mes,
      dia,
      horario_inicio: horario,
      horario_fim: horario,
    };
  }

  function criarDadosEvento(tituloNormalizado, mes, dia, inicio, fim) {
    return {
      titulo: tituloNormalizado,
      mes,
      dia,
      horario_inicio: inicio,
      horario_fim: fim,
    };
  }

  async function salvarNaAgenda(dados) {
    const registroCriado = await criarAgendamento(dados);
    setAgendamentos((atuais) => [...atuais, registroCriado]);
  }

  function registrarHorarioConflitante(mes, dia, horario) {
    setAgendamentos((atuais) => {
      const horarioJaRegistrado = atuais.some(
        (agendamento) =>
          Number(agendamento.mes || 9) === Number(mes) &&
          Number(agendamento.dia) === Number(dia) &&
          obterHorarioInicio(agendamento) === horario &&
          obterHorarioFim(agendamento) === horario,
      );

      if (horarioJaRegistrado) {
        return atuais;
      }

      return [
        ...atuais,
        {
          titulo: '',
          mes,
          dia,
          horario_inicio: horario,
          horario_fim: horario,
        },
      ];
    });
  }

  async function enviarAgendamento() {
    const tituloNormalizado = titulo.trim();
    const mesAgendado = String(mesSelecionado);
    const diaAgendado = String(diaSelecionado);
    const horarioAgendado = horarioSelecionado;

    if (!tituloNormalizado || diaSelecionado === null || !horarioAgendado) {
      adicionarNotificacao(
        'erro',
        'Preencha o título e selecione um dia e um horário.',
      );
      return;
    }

    if (existeConflitoNoDia(horarioAgendado, horarioAgendado)) {
      adicionarNotificacao(
        'erro',
        `O horário ${horarioAgendado} já está agendado para este dia.`,
      );
      return;
    }

    setEnviando(true);

    try {
      await salvarNaAgenda(
        criarDadosAgendamento(tituloNormalizado, mesAgendado, diaAgendado, horarioAgendado),
      );

      setTitulo('');
      limparSelecao();
      adicionarNotificacao(
        'sucesso',
        `Agendamento salvo para o dia ${diaAgendado} de ${nomeMesSelecionado}, às ${horarioAgendado}.`,
      );
    } catch (error) {
      if (error.status === 409) {
        registrarHorarioConflitante(mesAgendado, diaAgendado, horarioAgendado);
        setHorarioSelecionado('');
      }

      adicionarNotificacao(
        'erro',
        error.message || 'Não foi possível salvar o agendamento.',
      );
    } finally {
      setEnviando(false);
    }
  }

  async function enviarEvento() {
    const tituloNormalizado = titulo.trim();
    const mesAgendado = String(mesSelecionado);
    const diaAgendado = String(diaSelecionado);
    const inicio = eventoInicio.trim();
    const fim = eventoFim.trim();

    if (diaSelecionado === null) {
      avisarDiaObrigatorio();
      return;
    }

    if (!tituloNormalizado || !inicio || !fim) {
      adicionarNotificacao(
        'erro',
        'Preencha o título, selecione um dia e informe o início e fim do evento.',
      );
      return;
    }

    if (!horarioRegex.test(inicio) || !horarioRegex.test(fim)) {
      adicionarNotificacao('erro', 'Informe horários válidos para o evento.');
      return;
    }

    if (horarioParaMinutos(fim) < horarioParaMinutos(inicio)) {
      adicionarNotificacao(
        'erro',
        'O horário final não pode ser antes do horário inicial.',
      );
      return;
    }

    if (existeConflitoNoDia(inicio, fim)) {
      adicionarNotificacao(
        'erro',
        'Esse evento conflita com outro horário já agendado para este dia.',
      );
      return;
    }

    setEnviando(true);

    try {
      await salvarNaAgenda(criarDadosEvento(tituloNormalizado, mesAgendado, diaAgendado, inicio, fim));

      setTitulo('');
      limparSelecao();
      adicionarNotificacao(
        'sucesso',
        `Evento salvo para o dia ${diaAgendado} de ${nomeMesSelecionado}, das ${inicio} até ${fim}.`,
      );
    } catch (error) {
      adicionarNotificacao(
        'erro',
        error.message || 'Não foi possível salvar o evento.',
      );
    } finally {
      setEnviando(false);
    }
  }

  function enviarRegistro(event) {
    event.preventDefault();

    if (tipoRegistro === 'evento') {
      return enviarEvento();
    }

    return enviarAgendamento();
  }

  return (
    <div className="Agendamento">
      {notificacoes.length > 0 && (
        <div className="notificacoes">
          {notificacoes.map((notificacao) => (
            <Notificacao
              key={notificacao.id}
              notificacao={notificacao}
              onClose={removerNotificacao}
            />
          ))}
        </div>
      )}

      <AppHeader />

      <main>
        <div className="calendario">
          <div className="dias">
            <Calendario
              mesSelecionado={mesSelecionado}
              diaSelecionado={diaSelecionado}
              enviando={enviando}
              onMudarMes={mudarMes}
              onSelecionarDia={selecionarDia}
            />

            <OrientacaoAgendamento orientacao={orientacaoAgendamento} />

            <FormularioAgendamento
              titulo={titulo}
              enviando={enviando}
              carregandoAgenda={carregandoAgenda}
              tipoRegistro={tipoRegistro}
              onTitulo={setTitulo}
              onSubmit={enviarRegistro}
            />
          </div>

          <PainelHorarios
            diaSelecionado={diaSelecionado}
            nomeMes={nomeMesSelecionado}
            horarioSelecionado={horarioSelecionado}
            horarioSelecionadoOcupado={horarioSelecionadoOcupado}
            horariosDisponiveis={horariosDisponiveis}
            eventoInicio={eventoInicio}
            eventoFim={eventoFim}
            eventoBloqueado={eventoBloqueado}
            enviando={enviando}
            carregandoAgenda={carregandoAgenda}
            onAlterarMinutos={alterarMinutos}
            onEventoBloqueado={avisarDiaObrigatorio}
            onEventoInicio={setEventoInicio}
            onEventoFim={setEventoFim}
            onSelecionarEvento={selecionarEvento}
            onSelecionarHorario={selecionarHorario}
          />
        </div>
      </main>
    </div>
  );
}
