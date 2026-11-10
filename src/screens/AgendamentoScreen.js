import React, { useEffect, useState } from 'react';
import {
  Alert,
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

export default function AgendamentoScreen() {
  const [slots, setSlots] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [assunto, setAssunto] = useState('');
  const [observacao, setObservacao] = useState('');

  async function carregar() {
    try {
      const [slotsData, meusData] = await Promise.all([
        api('/agendamento/disponibilidades'),
        api('/agendamento/meus')
      ]);

      setSlots(slotsData);
      setAgendamentos(meusData);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function agendar() {
    if (!selecionado || !assunto) {
      Alert.alert(
        'Atenção',
        'Escolha um horário e informe o assunto.'
      );
      return;
    }

    try {
      await api('/agendamento', {
        method: 'POST',
        body: JSON.stringify({
          disponibilidade_id: selecionado.id,
          assunto,
          observacao
        })
      });

      setSelecionado(null);
      setAssunto('');
      setObservacao('');

      Alert.alert('Sucesso', 'Aula extra agendada.');
      carregar();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  async function cancelar(id) {
    try {
      await api(`/agendamento/${id}`, {
        method: 'DELETE'
      });

      Alert.alert('Sucesso', 'Agendamento cancelado.');
      carregar();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  if (!slots.length && !agendamentos.length) {
    return <Loading />;
  }

  return (
    <View>
      <PageTitle
        title="Aulas extras"
        subtitle="Escolha um horário disponível."
      />

      {slots.map(slot => (
        <Card key={slot.id}>
          <Text style={styles.professor}>
            {slot.professor}
          </Text>

          <Text style={styles.info}>
            {slot.data.split('-').reverse().join('/')} ·{' '}
            {slot.hora_inicio} às {slot.hora_fim}
          </Text>

          <Text style={styles.info}>
            {slot.local} · {slot.disciplina}
          </Text>

          <Button
            secondary={selecionado?.id !== slot.id}
            onPress={() => setSelecionado(slot)}
          >
            {selecionado?.id === slot.id
              ? 'Horário selecionado'
              : 'Selecionar horário'}
          </Button>
        </Card>
      ))}

      {selecionado ? (
        <Card>
          <Text style={styles.title}>
            Confirmar agendamento
          </Text>

          <Field
            label="Assunto"
            value={assunto}
            onChangeText={setAssunto}
            placeholder="Ex.: dúvidas de Matemática"
          />

          <Field
            label="Observação"
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Opcional"
          />

          <Button onPress={agendar}>
            Confirmar agendamento
          </Button>
        </Card>
      ) : null}

      <PageTitle title="Meus agendamentos" />

      {agendamentos.map(item => (
        <Card key={item.id}>
          <Text style={styles.professor}>
            {item.professor}
          </Text>

          <Text style={styles.info}>
            {item.data.split('-').reverse().join('/')} ·{' '}
            {item.hora_inicio}
          </Text>

          <Text style={styles.info}>
            Assunto: {item.assunto}
          </Text>

          <Text style={styles.info}>
            Status: {item.status}
          </Text>

          {item.status === 'agendado' ? (
            <Button
              secondary
              danger
              onPress={() => cancelar(item.id)}
            >
              Cancelar
            </Button>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

const styles = {
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12
  },

  professor: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16
  },

  info: {
    color: COLORS.muted,
    marginTop: 5
  }
};