import './Index.scss';
import { Link, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  nomesMeses,
  obterDiasDoMes,
  obterNomeMes,
} from '../../data/calendario';
import { gerarResumo } from '../../services/api';

export default function Resumo() {
  const [searchParams] = useSearchParams();
  const mesDaUrl = Number(searchParams.get('mes'));
  const diaDaUrl = Number(searchParams.get('dia'));
  const dataDaUrlEhValida =
    Number.isInteger(mesDaUrl) &&
    mesDaUrl >= 1 &&
    mesDaUrl <= 12 &&
    Number.isInteger(diaDaUrl) &&
    diaDaUrl >= 1 &&
    diaDaUrl <= obterDiasDoMes(mesDaUrl);
  const [mesSelecionado, setMesSelecionado] = useState(
    dataDaUrlEhValida ? String(mesDaUrl) : '',
  );
  const [diaSelecionado, setDiaSelecionado] = useState(
    dataDaUrlEhValida ? String(diaDaUrl) : '',
  );
  const [resumo, setResumo] = useState('');
  const [totalAgendamentos, setTotalAgendamentos] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

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
    setMesSelecionado(event.target.value);
    setDiaSelecionado('');
    setResumo('');
    setTotalAgendamentos(null);
    setErro('');
  }

  function selecionarDia(event) {
    setDiaSelecionado(event.target.value);
    setResumo('');
    setTotalAgendamentos(null);
    setErro('');
  }

  async function solicitarResumo(event) {
    event.preventDefault();

    if (!mesSelecionado || !diaSelecionado || carregando) {
      return;
    }

    setCarregando(true);
    setErro('');
    setResumo('');
    setTotalAgendamentos(null);

    try {
      const resultado = await gerarResumo({
        mes: mesSelecionado,
        dia: diaSelecionado,
      });

      setResumo(resultado.resumo);
      setTotalAgendamentos(resultado.total_agendamentos);
    } catch (error) {
      setErro(error.message || 'Não foi possível gerar o resumo.');
    } finally {
      setCarregando(false);
    }
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
            ) : (
              <p>Selecione o mês e o dia para solicitar o resumo à IA.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
