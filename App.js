import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import {
  api,
  clearSession,
  getCurrentUser,
  setUnauthorizedHandler
} from './src/api';

import LoginScreen from './src/screens/LoginScreen';
import CadastroAlunoScreen from './src/screens/CadastroAlunoScreen';
import CadastroProfessorScreen from './src/screens/CadastroProfessorScreen';
import AlunoDashboardScreen from './src/screens/AlunoDashboardScreen';
import NotasScreen from './src/screens/NotasScreen';
import FrequenciaScreen from './src/screens/FrequenciaScreen';
import EstudosScreen from './src/screens/EstudosScreen';
import AgendamentoScreen from './src/screens/AgendamentoScreen';
import ProfessorDashboardScreen from './src/screens/ProfessorDashboardScreen';
import AlunosScreen from './src/screens/AlunosScreen';
import LancamentosScreen from './src/screens/LancamentosScreen';
import HorariosScreen from './src/screens/HorariosScreen';
import AgendamentosScreen from './src/screens/AgendamentosScreen';

import { COLORS } from './src/styles/theme';

const alunoMenu = [
  ['dashboard', 'Visão geral'],
  ['notas', 'Notas'],
  ['frequencia', 'Frequência'],
  ['estudos', 'Plano de estudos'],
  ['agendamento', 'Aulas extras']
];

const professorMenu = [
  ['dashboard', 'Visão geral'],
  ['alunos', 'Alunos'],
  ['lancamentos', 'Notas e frequência'],
  ['horarios', 'Disponibilidades'],
  ['agendamentos', 'Aulas extras']
];

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    async function restore() {
      try {
        // Usuário vem do banco (via API); o celular guarda apenas o token.
        setUser(await getCurrentUser());
      } catch {
        // Sem conexão com a API ou sessão inválida: volta para o login.
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    restore();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  if (!ready) {
    return <Text>Carregando...</Text>;
  }

  if (!user) {
    if (registration === 'aluno') {
      return (
        <CadastroAlunoScreen
          onBack={() => setRegistration(null)}
        />
      );
    }

    if (registration === 'professor') {
      return (
        <CadastroProfessorScreen
          onBack={() => setRegistration(null)}
        />
      );
    }

    return (
      <LoginScreen
        onLogin={setUser}
        onRegisterAluno={() => setRegistration('aluno')}
        onRegisterProfessor={() => setRegistration('professor')}
      />
    );
  }

  return (
    <Portal
      user={user}
      setUser={setUser}
    />
  );
}

function Portal({ user, setUser }) {
  const [page, setPage] = useState('dashboard');

  const menu = user.tipo === 'professor'
    ? professorMenu
    : alunoMenu;

  async function logout() {
    try {
      await api('/auth/logout', {
        method: 'POST'
      });
    } catch {}

    await clearSession();
    setUser(null);
  }

  function renderPage() {
    if (user.tipo === 'aluno') {
      if (page === 'notas') return <NotasScreen />;
      if (page === 'frequencia') return <FrequenciaScreen />;
      if (page === 'estudos') return <EstudosScreen />;
      if (page === 'agendamento') return <AgendamentoScreen />;
      return <AlunoDashboardScreen user={user} />;
    }

    if (page === 'alunos') return <AlunosScreen />;
    if (page === 'lancamentos') {
      return <LancamentosScreen user={user} />;
    }
    if (page === 'horarios') return <HorariosScreen />;
    if (page === 'agendamentos') return <AgendamentosScreen />;

    return <ProfessorDashboardScreen user={user} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>
            {user.tipo === 'professor'
              ? 'ÁREA DOCENTE'
              : 'PORTAL ACADÊMICO'}
          </Text>

          <Text style={styles.headerTitle}>
            {menu.find(item => item[0] === page)?.[1]}
          </Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.nome?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.menu}
      >
        {menu.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setPage(key)}
            style={[
              styles.menuButton,
              page === key && styles.menuButtonActive
            ]}
          >
            <Text
              style={[
                styles.menuText,
                page === key && styles.menuTextActive
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={logout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {renderPage()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  overline: {
    color: '#8290a4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6eef9',
    alignItems: 'center',
    justifyContent: 'center'
  },

  avatarText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 17
  },

  menu: {
    backgroundColor: '#fff',
    padding: 10,
    maxHeight: 62
  },

  menuButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginRight: 8
  },

  menuButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },

  menuText: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 12
  },

  menuTextActive: {
    color: '#fff'
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: '#e8c8ca',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9
  },

  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 12
  },

  content: {
    flex: 1
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 40
  }
});