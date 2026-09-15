import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizarAgendamento,
    normalizarId
} from '../src/agendamentoValidation.js';
import { normalizarDataResumo } from '../src/resumoValidation.js';

test('normaliza um agendamento válido', () => {
    assert.deepEqual(
        normalizarAgendamento({
            titulo: '  Palestra de TI  ',
            mes: 9,
            dia: 6,
            horario_inicio: '10:00',
            horario_fim: '11:00'
        }),
        {
            titulo: 'Palestra de TI',
            mes: '9',
            dia: '6',
            horario_inicio: '10:00',
            horario_fim: '11:00'
        }
    );
});

test('aceita um agendamento pontual', () => {
    assert.ok(normalizarAgendamento({
        titulo: 'Visita',
        mes: '2',
        dia: '10',
        horario_inicio: '14:30',
        horario_fim: '14:30'
    }));
});

test('rejeita campos ausentes ou extras', () => {
    assert.equal(normalizarAgendamento({ titulo: 'Incompleto' }), null);
    assert.equal(normalizarAgendamento({
        titulo: 'Completo',
        mes: '1',
        dia: '1',
        horario_inicio: '08:00',
        horario_fim: '09:00',
        campo_extra: true
    }), null);
});

test('rejeita dia, título e horários inválidos', () => {
    const base = {
        titulo: 'Evento',
        mes: '1',
        dia: '1',
        horario_inicio: '08:00',
        horario_fim: '09:00'
    };

    const diasEmFevereiro = new Date(new Date().getFullYear(), 2, 0).getDate();
    assert.equal(
        normalizarAgendamento({ ...base, mes: '2', dia: String(diasEmFevereiro + 1) }),
        null
    );
    assert.equal(normalizarAgendamento({ ...base, mes: '4', dia: '31' }), null);
    assert.equal(normalizarAgendamento({ ...base, mes: '13' }), null);
    assert.equal(normalizarAgendamento({ ...base, titulo: ' '.repeat(3) }), null);
    assert.equal(normalizarAgendamento({ ...base, horario_inicio: '25:00' }), null);
    assert.equal(normalizarAgendamento({ ...base, horario_fim: '07:59' }), null);
});

test('valida IDs inteiros positivos', () => {
    assert.equal(normalizarId('15'), 15);
    assert.equal(normalizarId('0'), null);
    assert.equal(normalizarId('-1'), null);
    assert.equal(normalizarId('1.5'), null);
    assert.equal(normalizarId('abc'), null);
});


test('normaliza data válida para o resumo', () => {
    assert.deepEqual(normalizarDataResumo({ mes: '9', dia: '30' }), {
        mes: 9,
        dia: 30
    });
});

test('rejeita datas inválidas para o resumo', () => {
    assert.equal(normalizarDataResumo({ mes: '2', dia: '31' }), null);
    assert.equal(normalizarDataResumo({ mes: '13', dia: '1' }), null);
    assert.equal(normalizarDataResumo({ mes: '9', dia: '1', extra: true }), null);
});
