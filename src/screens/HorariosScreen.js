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

export default function HorariosScreen() {
  const [horarios, setHorarios] = useState([]);
  const [data, setData] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [local, setLocal] = useState('Sala de Atendimento');

  async function carregar() {
    try {
      setHorarios(await api('/professor/meus-horarios'));
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    try {
      await api('/professor/disponibilidades', {
        method: 'POST',
        body: JSON.stringify({
          data,
          hora_inicio: inicio,
          hora_fim: fim,
          local
        })
      });

      setData('');
      setInicio('');
      setFim('');

      Alert.alert('Sucesso', 'Horário disponibilizado.');
      carregar();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  }

  if (!horarios.length) {
    return (
      <View>
        <PageTitle title="Horários de atendimento" />

        <Card>
          <Field
            label="Data"
            value={data}
            onChangeText={setData}
            placeholder="AAAA-MM-DD"
          />

          <Field
            label="Hora de início"
            value={inicio}
            onChangeText={setInicio}
            placeholder="14:00"
          />

          <Field
            label="Hora de término"
            value={fim}
            onChangeText={setFim}
            placeholder="15:00"
          />

          <Field
            label="Local"
            value={local}
            onChangeText={setLocal}
          />

          <Button onPress={salvar}>
            Disponibilizar horário
          </Button>
        </Card>
      </View>
    );
  }

  return (
    <View>
      <PageTitle title="Horários de atendimento" />

      <Card>
        <Field
          label="Data"
          value={data}
          onChangeText={setData}
          placeholder="AAAA-MM-DD"
        />

        <Field
          label="Hora de início"
          value={inicio}
          onChangeText={setInicio}
          placeholder="14:00"
        />

        <Field
          label="Hora de término"
          value={fim}
          onChangeText={setFim}
          placeholder="15:00"
        />

        <Field
          label="Local"
          value={local}
          onChangeText={setLocal}
        />

        <Button onPress={salvar}>
          Disponibilizar horário
        </Button>
      </Card>

      {horarios.map(horario => (
        <Card key={horario.id}>
          <Text style={styles.date}>
            {horario.data.split('-').reverse().join('/')}
          </Text>

          <Text style={styles.info}>
            {horario.hora_inicio} às {horario.hora_fim}
          </Text>

          <Text style={styles.info}>{horario.local}</Text>

          <Text style={styles.status}>
            {horario.situacao}
          </Text>
        </Card>
      ))}
    </View>
  );
}

const styles = {
  date: {
    color: COLORS.text,
    fontWeight: '800'
  },

  info: {
    color: COLORS.muted,
    marginTop: 5
  },

  status: {
    color: COLORS.primary,
    fontWeight: '800',
    marginTop: 8
  }
};
