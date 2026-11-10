import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text
} from 'react-native';

import { api } from '../api';
import {
  Button,
  Card,
  Field
} from '../components/UI';
import { COLORS } from '../styles/theme';

export default function CadastroAlunoScreen({ onBack }) {
  const [form, setForm] = useState({
    nome: '',
    matricula: '',
    email: '',
    curso: 'Ensino Médio',
    turma: '',
    senha: '',
    confirmarSenha: ''
  });

  function update(key, value) {
    setForm(current => ({
      ...current,
      [key]: value
    }));
  }

  async function cadastrar() {
    try {
      await api('/auth/cadastro-aluno', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      Alert.alert(
        'Cadastro realizado',
        'Agora entre usando seu e-mail e sua senha.',
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <Text style={styles.title}>Cadastrar aluno</Text>
        <Text style={styles.subtitle}>
          Crie um acesso individual.
        </Text>

        <Field
          label="Nome completo"
          value={form.nome}
          onChangeText={value => update('nome', value)}
        />

        <Field
          label="Matrícula"
          value={form.matricula}
          onChangeText={value => update('matricula', value)}
        />

        <Field
          label="E-mail"
          value={form.email}
          onChangeText={value => update('email', value)}
          keyboardType="email-address"
        />

        <Field
          label="Curso"
          value={form.curso}
          onChangeText={value => update('curso', value)}
        />

        <Field
          label="Turma"
          value={form.turma}
          onChangeText={value => update('turma', value)}
        />

        <Field
          label="Senha"
          value={form.senha}
          onChangeText={value => update('senha', value)}
          secureTextEntry
        />

        <Field
          label="Confirmar senha"
          value={form.confirmarSenha}
          onChangeText={value => update('confirmarSenha', value)}
          secureTextEntry
        />

        <Button onPress={cadastrar}>
          Cadastrar aluno
        </Button>

        <Button secondary onPress={onBack}>
          Voltar
        </Button>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 20
  },

  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800'
  },

  subtitle: {
    color: COLORS.muted,
    marginTop: 5,
    marginBottom: 20
  }
});