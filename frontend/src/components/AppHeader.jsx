import { NavLink } from 'react-router-dom';
import './AppHeader.scss';

const links = [
  { to: '/agenda', label: 'Ver agenda' },
  { to: '/resumo', label: 'Resumo IA' },
  { to: '/', label: 'Ver agendamento', end: true },
];

export default function AppHeader() {
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

      <nav className="app-nav" aria-label="Navegação principal">
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
      </nav>
    </>
  );
}
