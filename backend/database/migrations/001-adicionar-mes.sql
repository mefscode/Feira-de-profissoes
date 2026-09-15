-- Execute uma única vez em bancos que já possuem a tabela AGENDAMENTOS.
-- Os registros existentes pertenciam ao calendário fixo de setembro.
ALTER TABLE AGENDAMENTOS
ADD COLUMN mes TINYINT UNSIGNED NOT NULL DEFAULT 9 AFTER dia;
