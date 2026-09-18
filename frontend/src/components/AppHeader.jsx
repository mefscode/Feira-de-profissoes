import { NavLink, useLocation } from 'react-router-dom';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import './AppHeader.scss';

const links = [
  { to: '/agenda', label: 'Ver agenda' },
  { to: '/resumo', label: 'Resumo IA' },
  { to: '/', label: 'Ver agendamento', end: true },
];

let ultimoIndicador = null;

export default function AppHeader() {
  const navRef = useRef(null);
  const animarEntrada = useRef(ultimoIndicador !== null);
  const location = useLocation();
  const [indicador, setIndicador] = useState(
    () =>
      ultimoIndicador || {
        left: 0,
        width: 0,
        visivel: false,
      },
  );

  const atualizarIndicador = useCallback(() => {
    const nav = navRef.current;
    const linkAtivo = nav?.querySelector('.app-nav-link-active');

    if (!nav || !linkAtivo) {
      setIndicador((atual) => ({ ...atual, visivel: false }));
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = linkAtivo.getBoundingClientRect();

    const proximoIndicador = {
      left: linkRect.left - navRect.left,
      width: linkRect.width,
      visivel: true,
    };

    ultimoIndicador = proximoIndicador;
    setIndicador(proximoIndicador);
  }, []);

  useLayoutEffect(() => {
    const quadro = animarEntrada.current
      ? window.requestAnimationFrame(() => {
          animarEntrada.current = false;
          atualizarIndicador();
        })
      : null;

    if (!animarEntrada.current) {
      atualizarIndicador();
    }

    window.addEventListener('resize', atualizarIndicador);

    return () => {
      if (quadro !== null) {
        window.cancelAnimationFrame(quadro);
      }

      window.removeEventListener('resize', atualizarIndicador);
    };
  }, [atualizarIndicador, location.pathname]);

  return (
    <>
      <header className="app-header">
        <NavLink className="app-logo" to="/" aria-label="Ir para Agendamentos">
          <img
            src={`${import.meta.env.BASE_URL}assets/images/Agenda-FREI.png`}
            alt="Agenda do FREI"
          />
        </NavLink>
      </header>

      <nav
        className="app-nav"
        ref={navRef}
        aria-label="Navegação principal"
      >
        {links.map(({ to, label, end }) => (
          <NavLink
            className={({ isActive }) =>
              `app-nav-link${isActive ? ' app-nav-link-active' : ''}`
            }
            end={end}
            key={to}
            to={to}
          >
            {label}
          </NavLink>
        ))}
        <span
          aria-hidden="true"
          className="app-nav-indicator"
          style={{
            opacity: indicador.visivel ? 1 : 0,
            transform: 'translateX(' + indicador.left + 'px)',
            width: indicador.width + 'px',
          }}
        />
      </nav>
    </>
  );
}
