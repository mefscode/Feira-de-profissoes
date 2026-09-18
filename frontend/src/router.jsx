import Agendamentos from './pages/Agendamentos/App';
import Agenda from './pages/Agenda/Index';
import Resumo from './pages/Resumo/Index'
import Notfound from './pages/Notfound/Index';
import { BrowserRouter,Routes,Route } from 'react-router-dom';

export default function Nav(){
    return(
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
            <Route path='/' element={<Agendamentos/>}/>
            <Route path='/agenda' element={<Agenda/>}/>
            <Route path='/resumo' element={<Resumo/>}/>
            <Route path='*' element={<Notfound/>}/>
        </Routes>
        </BrowserRouter>
    );
}
