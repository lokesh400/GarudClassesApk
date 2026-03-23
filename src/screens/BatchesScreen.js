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
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
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

  const totalBatches = batches.length;

  const renderBatch = ({ item }) => (
    <View style={styles.card}>
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
          <Text style={styles.studyButtonText}>Continue Learning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <AppHeader
          title="My Batches"
          navigation={navigation}
          showBack={true}
          right={<Image source={require('../../assets/icon.png')} style={styles.headerLogo} />}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading your batches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <AppHeader
          title="My Batches"
          navigation={navigation}
          showBack={true}
          right={<Image source={require('../../assets/icon.png')} style={styles.headerLogo} />}
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchBatches()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppHeader
        title="My Batches"
        navigation={navigation}
        showBack={true}
        right={<Image source={require('../../assets/icon.png')} style={styles.headerLogo} />}
      />
      <View style={styles.root}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>YOUR STUDY TRACKS</Text>
          <Text style={styles.summaryValue}>{totalBatches}</Text>
          <Text style={styles.summarySubText}>Batches available to continue</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 28,
    color: '#1E3A8A',
    fontWeight: '900',
  },
  summarySubText: {
    marginTop: 2,
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
  },
  cardImage: { width: '100%', height: 170 },
  cardImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  cardBody: { padding: 14 },
  batchName: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  batchDescription: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 12 },

  studyButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  studyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#B91C1C', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '700' },
});
