import React, { useEffect, useState } from 'react';
import {
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

export default function ProfessorDashboardScreen({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return <Loading />;
  }

  return (
    <View>
      <PageTitle
        title={`Olá, Prof. ${user.nome.split(' ').slice(-1)[0]}!`}
        subtitle={`Disciplina: ${user.disciplina || 'não definida'}`}
      />

      <View style={styles.grid}>
        <Metric title="Alunos" value={data.alunos} />
        <Metric title="Aulas agendadas" value={data.atendimentos} />
        <Metric title="Horários" value={data.horarios} />
      </View>

      <Card>
        <Text style={styles.title}>Disciplina vinculada</Text>
        <Text style={styles.text}>
          Você está vinculado à disciplina{' '}
          <Text style={styles.bold}>
            {user.disciplina || 'não definida'}
          </Text>
          .
        </Text>
      </Card>
    </View>
  );
}

function Metric({ title, value }) {
  return (
    <Card style={styles.metric}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

const styles = {
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  metric: {
    width: '48%'
  },

  metricTitle: {
    color: COLORS.muted
  },

  metricValue: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 7
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800'
  },

  text: {
    color: COLORS.muted,
    marginTop: 8,
    lineHeight: 20
  },

  bold: {
    color: COLORS.text,
    fontWeight: '800'
  }
};
