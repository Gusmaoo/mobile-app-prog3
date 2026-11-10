import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View
} from 'react-native';

import { api } from '../api';
import {
  Button,
  Card,
  Field,
  Loading,
  PageTitle
} from '../components/UI';
import { COLORS } from '../styles/theme';

export default function LancamentosScreen({ user }) {
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [etapa, setEtapa] = useState('1º Bimestre');
  const [nota, setNota] = useState('');
  const [totalAulas, setTotalAulas] = useState('');
  const [faltas, setFaltas] = useState('');

  useEffect(() => {
    api('/professor/alunos')
      .then(data => {
        setAlunos(data);

        if (data.length) {
          setAlunoId(String(data[0].id));
        }
      })
      .catch(error => Alert.alert('Erro', error.message));
  }, []);

  async function salvarNota() {
    try {
      await api('/professor/notas', {
        method: 'POST',
        body: JSON.stringify({
          aluno_id: Number(alunoId),
          disciplina: user.disciplina,
          etapa,
          nota: Number(nota)
        })
      });

      setNota('');
      Alert.alert('Sucesso', 'Nota salva.');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function salvarFrequencia() {
    try {
      await api('/professor/frequencia', {
        method: 'POST',
        body: JSON.stringify({
          aluno_id: Number(alunoId),
          disciplina: user.disciplina,
          total_aulas: Number(totalAulas),
          faltas: Number(faltas)
        })
      });

      setTotalAulas('');
      setFaltas('');
      Alert.alert('Sucesso', 'Frequência salva.');
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
        title="Notas e frequência"
        subtitle={`Disciplina: ${user.disciplina}`}
      />

      <Card>
        <Text style={styles.label}>Aluno</Text>

        <ScrollView horizontal>
          {alunos.map(aluno => (
            <Text
              key={aluno.id}
              onPress={() => setAlunoId(String(aluno.id))}
              style={[
                styles.aluno,
                alunoId === String(aluno.id) && styles.alunoAtivo
              ]}
            >
              {aluno.nome}
            </Text>
          ))}
        </ScrollView>

        <Text style={styles.label}>Etapa</Text>

        <ScrollView horizontal>
          {[
            '1º Bimestre',
            '2º Bimestre',
            '3º Bimestre',
            '4º Bimestre'
          ].map(item => (
            <Text
              key={item}
              onPress={() => setEtapa(item)}
              style={[
                styles.etapa,
                etapa === item && styles.etapaAtiva
              ]}
            >
              {item}
            </Text>
          ))}
        </ScrollView>

        <Field
          label="Nota"
          value={nota}
          onChangeText={setNota}
          placeholder="0 a 10"
          keyboardType="decimal-pad"
        />

        <Button onPress={salvarNota}>
          Salvar nota
        </Button>
      </Card>

      <Card>
        <Text style={styles.title}>Frequência</Text>

        <Field
          label="Total de aulas"
          value={totalAulas}
          onChangeText={setTotalAulas}
          keyboardType="number-pad"
        />

        <Field
          label="Faltas"
          value={faltas}
          onChangeText={setFaltas}
          keyboardType="number-pad"
        />

        <Button onPress={salvarFrequencia}>
          Salvar frequência
        </Button>
      </Card>
    </View>
  );
}

const styles = {
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15
  },

  label: {
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 8
  },

  aluno: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 9,
    marginRight: 8,
    color: COLORS.muted
  },

  alunoAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    color: '#fff'
  },

  etapa: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 9,
    marginRight: 8,
    color: COLORS.muted
  },

  etapaAtiva: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    color: '#fff'
  }
};