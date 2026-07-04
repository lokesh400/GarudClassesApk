import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const COLORS = {
  primary: '#6D28D9',
  background: '#F8F7FC',
  white: '#FFFFFF',
  text: '#171717',
  textMuted: '#64748B',
  border: '#E8E5EF',
};

export default function AttemptedTestsScreen({ navigation }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const res = await apiClient.get('/tests/my-attempts');
      setAttempts(res.data);
    } catch (err) {
      setError('Could not load your test history.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TestResult', { testId: item.test?._id })}
    >
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={COLORS.primary} />
        <Text style={styles.testName} numberOfLines={1}>{item.test?.name || 'Unnamed Test'}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.scoreText}>Score: {item.totalScore} / {item.maxScore}</Text>
        <Text style={styles.dateText}>
          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attempted Tests</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : attempts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>You haven't attempted any tests yet.</Text>
        </View>
      ) : (
        <FlatList
          data={attempts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  placeholder: { width: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#DC2626', fontSize: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 16 },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  testName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginLeft: 8, flex: 1 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  dateText: { fontSize: 12, color: COLORS.textMuted },
});
