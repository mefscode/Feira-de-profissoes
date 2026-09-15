import './Index.scss';
import { Link } from 'react-router-dom';

export default function Notfound() {
    return (
        <div className="Notfound">
            <main>
                <img src='/assets/images/Agenda-Imagem.png' alt='Ícone de agenda' />
                <div className='direita'>
                    <h1>404</h1>
                    <h2>Página não encontrada</h2>
                    <p>A página que você está procurando não existe.</p>
                    <p>Clique no botão abaixo para ir ao agendamento</p>
                    <Link className='botao-agendamento' to='/'>
                        Agendamento
                    </Link>

                </div>
            </main>
        </div>
    );
}
