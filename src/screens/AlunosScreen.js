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

export default function AlunosScreen() {
  const [alunos, setAlunos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);

  useEffect(() => {
    api('/professor/alunos')
      .then(setAlunos)
      .catch(error => Alert.alert('Erro', error.message));
  }, []);

  async function abrirResumo(id) {
    try {
      const resumo = await api(`/professor/alunos/${id}/resumo`);
      setSelecionado(resumo);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  if (!alunos.length) {
    return <Loading />;
  }

  return (
    <View>
      <PageTitle
        title="Alunos"
        subtitle="Consulte boletim e frequência."
      />

      {alunos.map(aluno => (
        <Card key={aluno.id}>
          <Text style={styles.nome}>{aluno.nome}</Text>
          <Text style={styles.info}>
            {aluno.matricula} · {aluno.turma || 'Sem turma'}
          </Text>
          <Text style={styles.info}>{aluno.email}</Text>

          <Text
            style={styles.link}
            onPress={() => abrirResumo(aluno.id)}
          >
            Ver resumo
          </Text>
        </Card>
      ))}

      {selecionado ? (
        <Card>
          <Text style={styles.title}>
            {selecionado.aluno.nome}
          </Text>

          <Text style={styles.subtitle}>Notas</Text>

          {selecionado.notas.map(nota => (
            <View style={styles.line} key={nota.id}>
              <Text>{nota.disciplina}</Text>
              <Text style={styles.value}>
                {Number(nota.nota).toFixed(1)}
              </Text>
            </View>
          ))}

          <Text style={styles.subtitle}>Frequência</Text>

          {selecionado.faltas.map(item => (
            <View style={styles.line} key={item.id}>
              <Text>{item.disciplina}</Text>
              <Text style={styles.value}>
                {item.percentual}%
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = {
  nome: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800'
  },

  info: {
    color: COLORS.muted,
    marginTop: 5
  },

  link: {
    color: COLORS.primary,
    fontWeight: '800',
    marginTop: 12
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800'
  },

  subtitle: {
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 17,
    marginBottom: 8
  },

  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f4'
  },

  value: {
    color: COLORS.primary,
    fontWeight: '900'
  }
};
