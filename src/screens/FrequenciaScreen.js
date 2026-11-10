import React, { useEffect, useState } from 'react';
import {
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

export default function FrequenciaScreen() {
  const [faltas, setFaltas] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/faltas')
      .then(setFaltas)
      .catch(error => setErro(error.message));
  }, []);

  if (!faltas.length && !erro) {
    return <Loading />;
  }

  return (
    <View>
      <PageTitle
        title="Frequência escolar"
        subtitle="Consulte faltas e percentual de presença."
      />

      <ErrorMessage message={erro} />

      {faltas.length === 0 ? (
        <Card>
          <Text>Nenhuma frequência lançada.</Text>
        </Card>
      ) : (
        faltas.map(item => {
          const alerta = Number(item.percentual) < 75;

          return (
            <Card key={item.id}>
              <Text style={styles.disciplina}>
                {item.disciplina}
              </Text>

              <Text style={styles.info}>
                Aulas: {item.total_aulas} · Faltas: {item.faltas}
              </Text>

              <View style={styles.line}>
                <Text style={styles.percentual}>
                  {item.percentual}%
                </Text>

                <Text
                  style={[
                    styles.status,
                    alerta ? styles.alerta : styles.regular
                  ]}
                >
                  {alerta ? 'Atenção' : 'Regular'}
                </Text>
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = {
  disciplina: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16
  },

  info: {
    color: COLORS.muted,
    marginTop: 6
  },

  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13
  },

  percentual: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 20
  },

  status: {
    padding: 6,
    borderRadius: 15,
    fontWeight: '800'
  },

  alerta: {
    color: COLORS.warning,
    backgroundColor: COLORS.warningBackground
  },

  regular: {
    color: COLORS.success,
    backgroundColor: COLORS.successBackground
  }
};