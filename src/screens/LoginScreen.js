import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { api, saveToken } from '../api';
import {
  Button,
  Card,
  ErrorMessage,
  Field
} from '../components/UI';
import { COLORS } from '../styles/theme';

export default function LoginScreen({
  onLogin,
  onRegisterAluno,
  onRegisterProfessor
}) {
  const [tipo, setTipo] = useState('aluno');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro('');

    if (!email || !senha) {
      setErro('Informe o e-mail e a senha.');
      return;
    }

    try {
      setCarregando(true);

      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          senha,
          tipo
        })
      });

      await saveToken(data.token);
      onLogin(data.usuario);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function preencherDemo() {
    setEmail(
      tipo === 'aluno'
        ? 'aluno@escola.com'
        : 'professor@escola.com'
    );
    setSenha('123456');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>PE</Text>
        </View>

        <Text style={styles.brand}>Portal Escolar</Text>
        <Text style={styles.subtitle}>Área acadêmica</Text>

        <Card>
          <View style={styles.tabs}>
            <Button
              secondary={tipo !== 'aluno'}
              onPress={() => setTipo('aluno')}
            >
              Aluno
            </Button>

            <Button
              secondary={tipo !== 'professor'}
              onPress={() => setTipo('professor')}
            >
              Professor
            </Button>
          </View>

          <Text style={styles.title}>
            Acesso do {tipo === 'aluno' ? 'aluno' : 'professor'}
          </Text>

          <ErrorMessage message={erro} />

          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder={
              tipo === 'aluno'
                ? 'aluno@escola.com'
                : 'professor@escola.com'
            }
            keyboardType="email-address"
          />

          <Field
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            secureTextEntry
          />

          <Button onPress={entrar}>
            {carregando ? 'Entrando...' : 'Entrar no portal'}
          </Button>

          <Button
            secondary
            onPress={preencherDemo}
          >
            Preencher acesso de demonstração
          </Button>

          <Button
            secondary
            onPress={
              tipo === 'aluno'
                ? onRegisterAluno
                : onRegisterProfessor
            }
          >
            Cadastrar novo {tipo}
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },

  logoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20
  },

  brand: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800'
  },

  subtitle: {
    color: '#b7c4d7',
    textAlign: 'center',
    marginBottom: 24
  },

  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15
  },

  title: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 16
  }
});