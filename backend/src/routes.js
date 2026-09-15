import agenda from './controller/agendaController.js';
import agendamento from './controller/agendamentoController.js';
import resumo from './controller/resumoController.js';

export function addRoutes(api){
    api.use(agenda);
    api.use(agendamento);
    api.use(resumo);
}
