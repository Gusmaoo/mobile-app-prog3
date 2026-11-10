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

export default function NotasScreen() {
  const [notas, setNotas] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/notas')
      .then(setNotas)
      .catch(error => setErro(error.message));
  }, []);

  if (!notas.length && !erro) {
    return <Loading />;
  }

  return (
    <View>
      <PageTitle
        title="Boletim acadêmico"
        subtitle="Notas lançadas pelos professores."
      />

      <ErrorMessage message={erro} />

      {notas.length === 0 ? (
        <Card>
          <Text>Nenhuma nota lançada.</Text>
        </Card>
      ) : (
        notas.map(nota => (
          <Card key={nota.id}>
            <View style={styles.line}>
              <View>
                <Text style={styles.disciplina}>
                  {nota.disciplina}
                </Text>
                <Text style={styles.etapa}>{nota.etapa}</Text>
              </View>

              <Text style={styles.nota}>
                {Number(nota.nota).toFixed(1)}
              </Text>
            </View>
          </Card>
        ))
      )}
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

  etapa: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 12
  },

  nota: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '900'
  }
};