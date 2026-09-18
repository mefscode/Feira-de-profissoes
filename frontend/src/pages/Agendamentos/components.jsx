import { useEffect } from 'react';
import { obterColunasCalendario, obterNomeMes } from '../../data/calendario';

const botoesDiminuirMinutos = [-1, -10, -30];
const botoesAdicionarMinutos = [1, 10, 30];

export function Notificacao({ notificacao, onClose }) {
  const { id, tipo, texto } = notificacao;

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => window.clearTimeout(temporizador);
  }, [id, onClose]);

  return (
    <div
      className={`notificacao ${tipo}`}
      role={tipo === 'erro' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <span>{texto}</span>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={() => onClose(id)}
      >
        &times;
      </button>
    </div>
  );
}

export function Calendario({
  mesSelecionado,
  diaSelecionado,
  enviando,
  onMudarMes,
  onSelecionarDia,
}) {
  const colunasCalendario = obterColunasCalendario(mesSelecionado);
  const nomeMes = obterNomeMes(mesSelecionado);

  return (
    <>
      <div className="seletor-mes">
        <button
          type="button"
          aria-label="Mês anterior"
          disabled={enviando}
          onClick={() => onMudarMes(-1)}
        >
          &lsaquo;
        </button>
        <h2>{nomeMes}</h2>
        <button
          type="button"
          aria-label="Próximo mês"
          disabled={enviando}
          onClick={() => onMudarMes(1)}
        >
          &rsaquo;
        </button>
      </div>

      <div className="botoes">
        {colunasCalendario.map((coluna, indiceColuna) => (
          <div className={`coluna${indiceColuna + 1}`} key={coluna.nome}>
            <p>{coluna.nome}</p>

            {coluna.dias.map((dia, indiceDia) =>
              dia.ativo ? (
                <button
                  className={`date-ative${
                    diaSelecionado === dia.numero ? ' date-select' : ''
                  }`}
                  type="button"
                  key={`${coluna.nome}-${indiceDia}`}
                  aria-label={`Selecionar dia ${dia.numero} de ${nomeMes}`}
                  aria-pressed={diaSelecionado === dia.numero}
                  disabled={enviando}
                  onClick={() => onSelecionarDia(dia.numero)}
                >
                  <span>{dia.numero}</span>
                </button>
              ) : (
                <div
                  className="date-inative"
                  key={`${coluna.nome}-${indiceDia}`}
                  aria-hidden="true"
                >
                  <span>{dia.numero}</span>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function OrientacaoAgendamento({ orientacao }) {
  return (
    <div className="orientacao-agendamento" aria-live="polite">
      <i className={orientacao.icone} aria-hidden="true" />
      <div>
        <strong>{orientacao.titulo}</strong>
        <span>{orientacao.texto}</span>
      </div>
    </div>
  );
}

export function FormularioAgendamento({
  titulo,
  enviando,
  carregandoAgenda,
  tipoRegistro,
  onTitulo,
  onSubmit,
}) {
  return (
    <div className="formulario">
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="titulo">Título:</label>
        <input
          id="titulo"
          type="text"
          maxLength="120"
          value={titulo}
          disabled={enviando}
          onChange={(event) => onTitulo(event.target.value)}
          required
        />
        <button type="submit" disabled={enviando || carregandoAgenda}>
          {enviando
            ? `Adicionando ${tipoRegistro}...`
            : `Adicionar ${tipoRegistro}`}
        </button>
      </form>
    </div>
  );
}

function BotaoMinuto({
  quantidade,
  bloqueado,
  enviando,
  carregandoAgenda,
  onClick,
}) {
  const estaDiminuindo = quantidade < 0;
  const textoQuantidade = Math.abs(quantidade);
  const acao = estaDiminuindo ? 'Diminuir' : 'Adicionar';
  const textoBotao = estaDiminuindo ? quantidade : `+${quantidade}`;

  return (
    <button
      type="button"
      aria-label={`${acao} ${textoQuantidade} minuto${
        textoQuantidade > 1 ? 's' : ''
      } do horário`}
      aria-disabled={bloqueado}
      disabled={enviando || carregandoAgenda}
      onClick={() => onClick(quantidade)}
    >
      {textoBotao}
    </button>
  );
}

function AjusteMinutos({
  horarioSelecionado,
  horarioSelecionadoOcupado,
  enviando,
  carregandoAgenda,
  onAlterarMinutos,
}) {
  const bloqueado = !horarioSelecionado || enviando || carregandoAgenda;

  return (
    <div className="ajuste-minutos">
      <p>Ajustar minutos</p>
      <div className="ajuste-minutos-botoes">
        {botoesDiminuirMinutos.map((quantidade) => (
          <BotaoMinuto
            key={quantidade}
            quantidade={quantidade}
            bloqueado={bloqueado}
            enviando={enviando}
            carregandoAgenda={carregandoAgenda}
            onClick={onAlterarMinutos}
          />
        ))}

        <output
          className={`horario-ajustado${
            horarioSelecionadoOcupado ? ' horario-ocupado' : ''
          }`}
          aria-label="Horário selecionado"
          aria-live="polite"
          title={
            horarioSelecionadoOcupado ? 'Este horário já está ocupado' : undefined
          }
        >
          {horarioSelecionado || '--:--'}
        </output>

        {botoesAdicionarMinutos.map((quantidade) => (
          <BotaoMinuto
            key={quantidade}
            quantidade={quantidade}
            bloqueado={bloqueado}
            enviando={enviando}
            carregandoAgenda={carregandoAgenda}
            onClick={onAlterarMinutos}
          />
        ))}
      </div>
    </div>
  );
}

function CampoHorarioEvento({
  label,
  value,
  bloqueado,
  enviando,
  carregandoAgenda,
  onClick,
  onFocus,
  onChange,
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="time"
        step="60"
        value={value}
        aria-disabled={bloqueado}
        readOnly={bloqueado}
        disabled={enviando || carregandoAgenda}
        onClick={onClick}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function EventoHorarios({
  inicio,
  fim,
  bloqueado,
  enviando,
  carregandoAgenda,
  onCampoBloqueado,
  onInicio,
  onFim,
  onSelecionarEvento,
}) {
  function mudarInicio(valor) {
    if (bloqueado) {
      onCampoBloqueado();
      return;
    }

    onSelecionarEvento();
    onInicio(valor);
  }

  function mudarFim(valor) {
    if (bloqueado) {
      onCampoBloqueado();
      return;
    }

    onSelecionarEvento();
    onFim(valor);
  }

  return (
    <div className="ajuste-minutos evento-horarios">
      <p>Evento</p>

      <div className="evento-horarios-campos">
        <CampoHorarioEvento
          label="Início"
          value={inicio}
          bloqueado={bloqueado}
          enviando={enviando}
          carregandoAgenda={carregandoAgenda}
          onClick={bloqueado ? onCampoBloqueado : undefined}
          onFocus={bloqueado ? undefined : onSelecionarEvento}
          onChange={mudarInicio}
        />

        <CampoHorarioEvento
          label="Fim"
          value={fim}
          bloqueado={bloqueado}
          enviando={enviando}
          carregandoAgenda={carregandoAgenda}
          onClick={bloqueado ? onCampoBloqueado : undefined}
          onFocus={bloqueado ? undefined : onSelecionarEvento}
          onChange={mudarFim}
        />
      </div>

    </div>
  );
}

function ListaHorarios({
  horariosDisponiveis,
  diaSelecionado,
  horarioSelecionado,
  enviando,
  carregandoAgenda,
  onSelecionarHorario,
}) {
  return (
    <div className="horario-lista">
      {horariosDisponiveis.map((hora) => (
        <button
          className={`horario-item${
            diaSelecionado === null ? ' horario-bloqueado' : ''
          }`}
          type="button"
          key={hora}
          aria-pressed={
            Boolean(horarioSelecionado) &&
            horarioSelecionado.slice(0, 2) === hora.slice(0, 2)
          }
          aria-disabled={diaSelecionado === null || enviando || carregandoAgenda}
          disabled={enviando || carregandoAgenda}
          onClick={() => onSelecionarHorario(hora)}
        >
          {hora}
        </button>
      ))}
    </div>
  );
}

export function PainelHorarios({
  diaSelecionado,
  nomeMes,
  horarioSelecionado,
  horarioSelecionadoOcupado,
  horariosDisponiveis,
  eventoInicio,
  eventoFim,
  eventoBloqueado,
  enviando,
  carregandoAgenda,
  onAlterarMinutos,
  onEventoBloqueado,
  onEventoInicio,
  onEventoFim,
  onSelecionarEvento,
  onSelecionarHorario,
}) {
  return (
    <div className="horario">
      <p className="horario-data">
        {diaSelecionado !== null
          ? `Dia: ${diaSelecionado} de ${nomeMes}${
              horarioSelecionado ? `, às ${horarioSelecionado}` : ''
            }`
          : 'Dia:'}
      </p>

      <EventoHorarios
        inicio={eventoInicio}
        fim={eventoFim}
        bloqueado={eventoBloqueado}
        enviando={enviando}
        carregandoAgenda={carregandoAgenda}
        onCampoBloqueado={onEventoBloqueado}
        onInicio={onEventoInicio}
        onFim={onEventoFim}
        onSelecionarEvento={onSelecionarEvento}
      />

      <p className="separador-opcoes">ou</p>

      <AjusteMinutos
        horarioSelecionado={horarioSelecionado}
        horarioSelecionadoOcupado={horarioSelecionadoOcupado}
        enviando={enviando}
        carregandoAgenda={carregandoAgenda}
        onAlterarMinutos={onAlterarMinutos}
      />

      <ListaHorarios
        horariosDisponiveis={horariosDisponiveis}
        diaSelecionado={diaSelecionado}
        horarioSelecionado={horarioSelecionado}
        enviando={enviando}
        carregandoAgenda={carregandoAgenda}
        onSelecionarHorario={onSelecionarHorario}
      />
    </div>
  );
}
