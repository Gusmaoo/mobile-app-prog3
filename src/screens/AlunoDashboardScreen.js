import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import { api } from '../api';
import {
  Card,
  ErrorMessage,
  Loading,
  PageTitle
} from '../components/UI';
import { COLORS } from '../styles/theme';

export default function AlunoDashboardScreen({ user }) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch(error => setErro(error.message));
  }, []);

  if (!data && !erro) {
    return <Loading />;
  }

  return (
    <View>
      <PageTitle
        title={`Olá, ${user.nome.split(' ')[0]}!`}
        subtitle="Consulte seus resultados e organize seus estudos."
      />

      <ErrorMessage message={erro} />

      {data ? (
        <View style={styles.grid}>
          <Metric title="Média geral" value={data.media} />
          <Metric title="Frequência" value={`${data.frequencia}%`} />
          <Metric title="Faltas" value={data.faltas} />
          <Metric title="Aulas extras" value={data.agendamentos} />
        </View>
      ) : null}

      <Card>
        <Text style={styles.cardTitle}>Área discente</Text>
        <Text style={styles.text}>
          Notas e frequência são somente para consulta. O lançamento dos
          dados fica restrito aos professores.
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

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  metric: {
    width: '48%'
  },

  metricTitle: {
    color: COLORS.muted,
    fontSize: 12
  },

  metricValue: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8
  },

  text: {
    color: COLORS.muted,
    lineHeight: 20
  }
});