import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../api/client';

export default function TestSeriesDetailScreen({ route, navigation }) {
  const { item } = route.params;

  const { logout } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishedMap, setPublishedMap] = useState({});
  const [busyTestId, setBusyTestId] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [detailRes, publishedRes] = await Promise.all([
          apiClient.get(`/test-series/published/${item._id}`),
          apiClient.get('/tests/published'),
        ]);

        setDetail(detailRes.data);

        const nextMap = {};
        (publishedRes.data || []).forEach((t) => {
          if (!t?._id) return;
          nextMap[String(t._id)] = t;
        });
        setPublishedMap(nextMap);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
        } else {
          setError('Could not load batch details.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [item._id, logout]);

  const data = detail ?? item;

  const tests = useMemo(() => {
    if (!Array.isArray(data.tests)) return [];
    return data.tests
      .map((entry, idx) => {
        if (!entry) return null;

        if (typeof entry === 'string') {
          const info = publishedMap[entry] || {};
          return {
            _id: entry,
            name: info.name || `Test ${idx + 1}`,
            duration: info.duration,
            mode: info.mode,
            attempted: !!info.attempted,
          };
        }

        const testId = String(entry._id || entry.id || '');
        if (!testId) return null;
        const info = publishedMap[testId] || {};
        return {
          ...entry,
          _id: testId,
          name: entry.name || info.name || `Test ${idx + 1}`,
          duration: entry.duration ?? info.duration,
          mode: entry.mode || info.mode,
          attempted: typeof info.attempted === 'boolean' ? info.attempted : false,
        };
      })
      .filter(Boolean);
  }, [data.tests, publishedMap]);

  const startTest = async (test) => {
    if (!test?._id || busyTestId) return;

    setBusyTestId(test._id);
    try {
      const res = await apiClient.post(`/tests/${test._id}/start`, {
        batchId: item._id,
      });

      navigation.navigate('TestAttempt', {
        test: res.data.test,
        attempt: res.data.attempt,
        batchId: item._id,
      });
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        return;
      }

      const message = e.response?.data?.message || 'Could not start test.';
      if (e.response?.status === 400 && message.toLowerCase().includes('already submitted')) {
        navigation.navigate('TestResult', { testId: test._id });
        return;
      }

      Alert.alert('Unable to start', message);
    } finally {
      setBusyTestId('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppHeader title={data.name} navigation={navigation} showBack />
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!!data.image && (
            <Image
              source={{ uri: data.image }}
              style={styles.banner}
              resizeMode="cover"
            />
          )}

          <View style={styles.section}>
            <Text style={styles.title}>{data.name}</Text>
          </View>

          {!!data.description && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About</Text>
              <Text style={styles.description}>{data.description}</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1D4ED8" />
              <Text style={styles.loadingText}>Loading details...</Text>
            </View>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {!loading && detail && (
            <>
              {!!detail.subject && (
                <InfoRow label="Subject" value={detail.subject} />
              )}
              {!!detail.targetExam && (
                <InfoRow label="Target Exam" value={detail.targetExam} />
              )}
              {!!detail.totalTests && (
                <InfoRow label="Total Tests" value={String(detail.totalTests)} />
              )}
              {!!detail.validity && (
                <InfoRow label="Validity" value={detail.validity} />
              )}
              {!!detail.price && (
                <InfoRow label="Price" value={`₹${detail.price}`} />
              )}
              {!!detail.language && (
                <InfoRow label="Medium" value={detail.language} />
              )}
              {!!detail.createdAt && (
                <InfoRow
                  label="Added on"
                  value={new Date(detail.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                />
              )}

              {tests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Tests ({tests.length})</Text>
                  {tests.map((test, i) => {
                    const running = busyTestId === test._id;
                    const canViewResult = !!test.attempted;
                    const primaryLabel = test.attempted && test.mode === 'practice' ? 'Retry' : 'Start';

                    return (
                    <View key={test._id ?? i} style={styles.testRow}>
                      <View style={styles.testIndex}>
                        <Text style={styles.testIndexText}>{i + 1}</Text>
                      </View>
                      <View style={styles.testInfo}>
                        <Text style={styles.testName}>{test.name || test.title || `Test ${i + 1}`}</Text>
                        {!!test.duration && (
                          <Text style={styles.testMeta}>{test.duration} mins</Text>
                        )}
                        {!!test.mode && (
                          <Text style={styles.testMeta}>Mode: {test.mode}</Text>
                        )}
                      </View>

                      <View style={styles.testActions}>
                        <TouchableOpacity
                          style={[styles.startBtn, running && styles.startBtnDisabled]}
                          onPress={() => startTest(test)}
                          disabled={running}
                        >
                          {running ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.startBtnText}>{primaryLabel}</Text>
                          )}
                        </TouchableOpacity>

                        {canViewResult && (
                          <TouchableOpacity
                            style={styles.resultBtn}
                            onPress={() => navigation.navigate('TestResult', { testId: test._id })}
                          >
                            <Text style={styles.resultBtnText}>Result</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                  })}
                </View>
              )}

              {!tests.length && (
                <View style={styles.section}>
                  <Text style={styles.description}>No tests are available in this batch yet.</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  root: { flex: 1, backgroundColor: '#F3F4F6' },

  // header styles removed (now using AppHeader)

  scroll: { paddingBottom: 24 },

  banner: {
    width: '100%',
    height: 200,
    backgroundColor: '#D1D5DB',
  },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', lineHeight: 28 },
  description: { fontSize: 14, color: '#374151', lineHeight: 22 },

  infoRow: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },

  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  testIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  testIndexText: { fontSize: 13, fontWeight: '700', color: '#1E3A8A' },
  testInfo: { flex: 1 },
  testName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  testMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  testActions: {
    marginLeft: 8,
    alignItems: 'flex-end',
    gap: 8,
  },
  startBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.7 },
  startBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  resultBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resultBtnText: { color: '#1E3A8A', fontSize: 12, fontWeight: '700' },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  loadingText: { fontSize: 13, color: '#6B7280' },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 24,
  },
});
