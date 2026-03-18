import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function TestResultScreen({ route, navigation }) {
  const { logout } = useAuth();
  const { testId, initialResult } = route.params;

  const [result, setResult] = useState(initialResult || null);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      if (initialResult) return;
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get(`/tests/${testId}/my-result`);
        setResult(res.data);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
          return;
        }
        setError(e.response?.data?.message || 'Could not load result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [initialResult, logout, testId]);

  const stats = useMemo(() => {
    const attempt = result?.attempt;
    const answers = attempt?.answers || [];

    const correct = answers.filter((a) => a.isCorrect).length;
    const attempted = answers.filter((a) => {
      if (a.selectedOption) return true;
      if (Array.isArray(a.selectedOptions) && a.selectedOptions.length > 0) return true;
      return a.numericalAnswer !== null && a.numericalAnswer !== undefined;
    }).length;

    const score = attempt?.totalScore ?? 0;
    const maxScore = attempt?.maxScore ?? 0;

    return {
      attempted,
      correct,
      wrong: Math.max(attempted - correct, 0),
      score,
      maxScore,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    };
  }, [result]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading result...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace('TestResult', { testId })}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'} </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Result
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cardTop}>
          <Text style={styles.testName}>{result?.test?.name || 'Test'}</Text>
          <Text style={styles.scoreText}>
            {stats.score} / {stats.maxScore}
          </Text>
        </View>

        <View style={styles.statGrid}>
          <StatTile label="Attempted" value={String(stats.attempted)} color="#0284C7" />
          <StatTile label="Correct" value={String(stats.correct)} color="#16A34A" />
          <StatTile label="Wrong" value={String(stats.wrong)} color="#DC2626" />
          <StatTile label="Accuracy" value={`${stats.accuracy}%`} color="#7C3AED" />
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.primaryBtnText}>Back To Batches</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatTile({ label, value, color }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  loadingText: { marginTop: 10, color: '#4B5563' },
  errorText: { color: '#B91C1C', marginBottom: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  content: { padding: 16, paddingBottom: 24 },
  cardTop: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  testName: { color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  scoreText: { color: '#1E3A8A', fontSize: 26, fontWeight: '800' },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  tile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tileValue: { fontSize: 22, fontWeight: '800' },
  tileLabel: { marginTop: 6, color: '#4B5563', fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});