import './Index.scss';
import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  nomesMeses,
  obterDiasDoMes,
  obterNomeMes,
} from '../../data/calendario';
import {
  gerarResumo,
  lerResumoPersistido,
  salvarResumoPersistido,
} from '../../services/api';

const DELAY_GERACAO_AUTOMATICA_MS = 4000;

function obterDataAtual() {
  const agora = new Date();

  return {
    mes: String(agora.getMonth() + 1),
    dia: String(agora.getDate()),
  };
}

export default function Resumo() {
  const [searchParams] = useSearchParams();
  const requisicaoAtiva = useRef(null);
  const temporizadorAutomatico = useRef(null);
  const mesDaUrl = Number(searchParams.get('mes'));
  const diaDaUrl = Number(searchParams.get('dia'));
  const dataDaUrlEhValida =
    Number.isInteger(mesDaUrl) &&
    mesDaUrl >= 1 &&
    mesDaUrl <= 12 &&
    Number.isInteger(diaDaUrl) &&
    diaDaUrl >= 1 &&
    diaDaUrl <= obterDiasDoMes(mesDaUrl);
  const dataInicial = dataDaUrlEhValida
    ? { mes: String(mesDaUrl), dia: String(diaDaUrl) }
    : obterDataAtual();
  const [mesSelecionado, setMesSelecionado] = useState(dataInicial.mes);
  const [diaSelecionado, setDiaSelecionado] = useState(dataInicial.dia);
  const [resumo, setResumo] = useState('');
  const [totalAgendamentos, setTotalAgendamentos] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const cancelarResumoEmAndamento = useCallback(() => {
    if (!requisicaoAtiva.current) {
      return;
    }

    requisicaoAtiva.current.abort();
    requisicaoAtiva.current = null;
    setCarregando(false);
  }, []);

  const cancelarGeracaoAutomatica = useCallback(() => {
    if (temporizadorAutomatico.current === null) {
      return;
    }

    window.clearTimeout(temporizadorAutomatico.current);
    temporizadorAutomatico.current = null;
  }, []);

  const carregarResumo = useCallback(async ({ mes, dia, silencioso = false }) => {
    cancelarResumoEmAndamento();

    const controller = new AbortController();
    requisicaoAtiva.current = controller;

    if (!silencioso) {
      setCarregando(true);
      setErro('');
      setResumo('');
      setTotalAgendamentos(null);
    }

    try {
      const resultado = await gerarResumo({ mes, dia, signal: controller.signal });

      if (requisicaoAtiva.current !== controller) {
        return;
      }

      setResumo(resultado.resumo);
      setTotalAgendamentos(resultado.total_agendamentos);
      setErro('');
      salvarResumoPersistido({
        mes,
        dia,
        resumo: resultado.resumo,
        totalAgendamentos: resultado.total_agendamentos,
      });
    } catch (error) {
      if (error.name === 'AbortError' || requisicaoAtiva.current !== controller) {
        return;
      }

      if (!silencioso) {
        setErro(error.message || 'Não foi possível gerar o resumo.');
      }
    } finally {
      if (requisicaoAtiva.current === controller) {
        requisicaoAtiva.current = null;
        setCarregando(false);
      }
    }
  }, [cancelarResumoEmAndamento]);

  useEffect(() => {
    if (!mesSelecionado || !diaSelecionado) {
      return undefined;
    }

    temporizadorAutomatico.current = window.setTimeout(() => {
      temporizadorAutomatico.current = null;
      const resumoPersistido = lerResumoPersistido({
        mes: mesSelecionado,
        dia: diaSelecionado,
      });

      if (resumoPersistido) {
        setResumo(resumoPersistido.resumo);
        setTotalAgendamentos(resumoPersistido.totalAgendamentos);
        setErro('');
      }

      carregarResumo({
        mes: mesSelecionado,
        dia: diaSelecionado,
        silencioso: Boolean(resumoPersistido),
      });
    }, DELAY_GERACAO_AUTOMATICA_MS);

    return () => {
      cancelarGeracaoAutomatica();
      cancelarResumoEmAndamento();
    };
  }, [
    cancelarGeracaoAutomatica,
    cancelarResumoEmAndamento,
    carregarResumo,
    diaSelecionado,
    mesSelecionado,
  ]);

  const diasDoMes = useMemo(() => {
    if (!mesSelecionado) {
      return [];
    }

    return Array.from(
      { length: obterDiasDoMes(Number(mesSelecionado)) },
      (_, indice) => indice + 1,
    );
  }, [mesSelecionado]);

  function selecionarMes(event) {
    cancelarGeracaoAutomatica();
    cancelarResumoEmAndamento();
    setMesSelecionado(event.target.value);
    setDiaSelecionado('');
    setResumo('');
    setTotalAgendamentos(null);
    setErro('');
  }

  function selecionarDia(event) {
    cancelarGeracaoAutomatica();
    cancelarResumoEmAndamento();
    setDiaSelecionado(event.target.value);
    setResumo('');
    setTotalAgendamentos(null);
    setErro('');
  }

  function solicitarResumo(event) {
    event.preventDefault();

    if (!mesSelecionado || !diaSelecionado || carregando) {
      return;
    }

    cancelarGeracaoAutomatica();
    carregarResumo({ mes: mesSelecionado, dia: diaSelecionado });
  }

  const dataSelecionada =
    mesSelecionado && diaSelecionado
      ? `${diaSelecionado} de ${obterNomeMes(mesSelecionado)}`
      : '';

  return (
    <div className="pagina-resumo">
      <header>
        <img src="/assets/images/Agenda-FREI.png" alt="Logo Agenda do FREI" />
      </header>

      <nav>
        <Link className="botao-agenda" to="/agenda">
          Ver agenda
        </Link>
        <Link className="botao-resumo" to="/resumo">
          Resumo IA
        </Link>
        <Link className="botao-agendamentos" to="/">
          Ver agendamento
        </Link>
      </nav>

      <main>
        <section className="painel-resumo" aria-labelledby="titulo-resumo">
          <div className="resumo-cabecalho">
            <i className="fa-solid fa-robot" aria-hidden="true" />
            <div>
              <h1 id="titulo-resumo">RESUMO IA</h1>
              <p>Escolha uma data para gerar o resumo dos agendamentos do dia.</p>
            </div>
          </div>

          <form className="formulario-resumo" onSubmit={solicitarResumo}>
            <label>
              <span>Mês</span>
              <select
                value={mesSelecionado}
                onChange={selecionarMes}
                aria-label="Selecionar mês"
              >
                <option value="">Selecione</option>
                {nomesMeses.map((nomeMes, indice) => (
                  <option key={nomeMes} value={indice + 1}>
                    {nomeMes}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Dia</span>
              <select
                value={diaSelecionado}
                onChange={selecionarDia}
                disabled={!mesSelecionado}
                aria-label="Selecionar dia"
              >
                <option value="">Selecione</option>
                {diasDoMes.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={!mesSelecionado || !diaSelecionado || carregando}
            >
              {carregando ? 'Gerando resumo...' : 'Gerar resumo'}
            </button>
          </form>

          <div
            className={`resultado-resumo${erro ? ' resultado-erro' : ''}`}
            aria-live="polite"
            aria-busy={carregando}
          >
            {carregando ? (
              <p>Consultando os horários e gerando o resumo com a IA...</p>
            ) : erro ? (
              <p>{erro}</p>
            ) : resumo ? (
              <>
                <h2>Resumo de {dataSelecionada}</h2>
                <p className="resumo-total">
                  {totalAgendamentos} agendamento(s) considerado(s)
                </p>
                <p className="resumo-texto">{resumo}</p>
              </>
            ) : mesSelecionado && diaSelecionado ? null : (
              <p>Selecione o mês e o dia para solicitar o resumo à IA.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
