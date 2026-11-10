import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';

import { COLORS } from '../styles/theme';

export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function Button({
  children,
  onPress,
  secondary = false,
  danger = false
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        danger && styles.dangerButton,
        pressed && styles.pressed
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.secondaryButtonText,
          danger && styles.dangerButtonText
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default'
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9aa4b2"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

export function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function PageTitle({ title, subtitle }) {
  return (
    <View style={styles.pageTitle}>
      <Text style={styles.title}>{title}</Text>

      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 17,
    marginBottom: 14
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 5
  },

  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border
  },

  dangerButton: {
    borderColor: '#e8c8ca'
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800'
  },

  secondaryButtonText: {
    color: COLORS.text
  },

  dangerButtonText: {
    color: COLORS.danger
  },

  pressed: {
    opacity: 0.7
  },

  field: {
    marginBottom: 14
  },

  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: COLORS.text,
    backgroundColor: '#fff'
  },

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 35
  },

  loadingText: {
    color: COLORS.muted,
    marginTop: 10
  },

  error: {
    backgroundColor: COLORS.errorBackground,
    borderWidth: 1,
    borderColor: '#efcaca',
    borderRadius: 9,
    padding: 12,
    marginBottom: 14
  },

  errorText: {
    color: COLORS.danger
  },

  pageTitle: {
    marginBottom: 16
  },

  title: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800'
  },

  subtitle: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19
  }
};