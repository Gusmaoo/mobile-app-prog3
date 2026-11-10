import React, { useEffect, useState } from 'react';
import {
  Alert,
  Text,
  View
} from 'react-native';

import { api } from '../api';
import {
  Card,
  Loading,
  PageTitle
} from '../components/UI';
import { COLORS } from '../styles/theme';

export default function AgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState([]);

  useEffect(() => {
    api('/professor/agendamentos')
      .then(setAgendamentos)
      .catch(error => Alert.alert('Erro', error.message));
  }, []);

  if (!agendamentos.length) {
    return (
      <View>
        <PageTitle title="Aulas extras agendadas" />

        <Card>
          <Text style={styles.empty}>
            Nenhuma aula extra agendada.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View>
      <PageTitle
        title="Aulas extras agendadas"
        subtitle="Alunos que marcaram atendimento."
      />

      {agendamentos.map(item => (
        <Card key={item.id}>
          <Text style={styles.aluno}>{item.aluno}</Text>

          <Text style={styles.info}>
            Matrícula: {item.matricula}
          </Text>

          <Text style={styles.info}>
            Data: {item.data.split('-').reverse().join('/')}
          </Text>

          <Text style={styles.info}>
            Horário: {item.hora_inicio} às {item.hora_fim}
          </Text>

          <Text style={styles.info}>
            Assunto: {item.assunto}
          </Text>

          <Text style={styles.info}>
            Local: {item.local}
          </Text>

          <Text style={styles.status}>
            Status: {item.status}
          </Text>
        </Card>
      ))}
    </View>
  );
}

const styles = {
  aluno: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800'
  },

  info: {
    color: COLORS.muted,
    marginTop: 6
  },

  status: {
    color: COLORS.primary,
    fontWeight: '800',
    marginTop: 8
  },

  empty: {
    textAlign: 'center',
    color: COLORS.muted
  }
};