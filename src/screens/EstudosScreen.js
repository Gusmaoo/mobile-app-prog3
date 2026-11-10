import React, { useEffect, useMemo, useState } from 'react';
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

export default function EstudosScreen() {
  const [notas, setNotas] = useState([]);

  useEffect(() => {
    api('/notas')
      .then(setNotas)
      .catch(() => {});
  }, []);

  const disciplinas = useMemo(() => {
    const agrupadas = {};

    notas.forEach(nota => {
      if (!agrupadas[nota.disciplina]) {
        agrupadas[nota.disciplina] = [];
      }

      agrupadas[nota.disciplina].push(Number(nota.nota));
    });

    return Object.entries(agrupadas)
      .map(([disciplina, valores]) => ({
        disciplina,
        media:
          valores.reduce((a, b) => a + b, 0) / valores.length
      }))
      .sort((a, b) => a.media - b.media);
  }, [notas]);

  if (!notas.length) {
    return <Loading />;
  }

  return (
    <View>
      <PageTitle
        title="Plano de estudos"
        subtitle="Disciplinas organizadas pelas menores médias."
      />

      {disciplinas.map((item, index) => (
        <Card key={item.disciplina}>
          <View style={styles.line}>
            <View>
              <Text style={styles.disciplina}>
                {index + 1}. {item.disciplina}
              </Text>

              <Text style={styles.info}>
                Média atual: {item.media.toFixed(1)}
              </Text>
            </View>

            <Text
              style={[
                styles.badge,
                item.media < 6
                  ? styles.badgeWarning
                  : styles.badgeSuccess
              ]}
            >
              {item.media < 6 ? 'Alta atenção' : 'Acompanhar'}
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progress,
                {
                  width: `${Math.min(item.media * 10, 100)}%`
                }
              ]}
            />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = {
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  disciplina: {
    color: COLORS.text,
    fontWeight: '800'
  },

  info: {
    color: COLORS.muted,
    marginTop: 5
  },

  badge: {
    padding: 6,
    borderRadius: 15,
    fontSize: 11,
    fontWeight: '800'
  },

  badgeWarning: {
    color: COLORS.warning,
    backgroundColor: COLORS.warningBackground
  },

  badgeSuccess: {
    color: COLORS.success,
    backgroundColor: COLORS.successBackground
  },

  progressBackground: {
    height: 7,
    backgroundColor: '#e8edf3',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 12
  },

  progress: {
    height: '100%',
    backgroundColor: COLORS.primary
  }
};