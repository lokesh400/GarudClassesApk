import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../api/client';

export default function BatchesScreen({ navigation }) {
  const { logout } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBatches = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/test-series/my-purchase');
        setBatches(response.data);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
        } else {
          console.error('Error fetching batches:', e);
          setError('Failed to load batches. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBatches(true);
  };

  const renderBatch = ({ item }) => (
    <View style={styles.card}>
      {/* Banner image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImagePlaceholderText}>No Image</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.batchName}>{item.name || 'Batch'}</Text>
        {!!item.description && (
          <Text style={styles.batchDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <TouchableOpacity
          style={styles.studyButton}
          onPress={() => navigation.navigate('TestSeriesDetail', { item })}
          activeOpacity={0.85}
        >
          <Text style={styles.studyButtonText}>Study →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading your batches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchBatches()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Batches</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={batches}
        keyExtractor={(item, index) => String(item._id ?? item.id ?? index)}
        renderItem={renderBatch}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No batches found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: { color: '#9CA3AF', fontSize: 13 },
  cardBody: { padding: 14 },
  batchName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  batchDescription: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12 },

  // Study button
  studyButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  studyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // States
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#B91C1C', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
});
