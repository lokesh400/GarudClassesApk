import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

function formatPrice(amount) {
  const value = Number(amount || 0);
  return `INR ${value.toLocaleString('en-IN')}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeReceiptTitle(purchase, index) {
  const item = purchase?.itemId;
  if (item?.name) return item.name;
  if (item?.title) return item.title;
  return `Receipt #${index + 1}`;
}

export default function MyPurchasesScreen({ navigation }) {
  const { logout } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPurchases = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/purchase/my');
      setPurchases(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        return;
      }
      setError(e.response?.data?.message || 'Failed to load purchases.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchPurchases(false);
  }, [fetchPurchases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPurchases(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.helperText}>Loading purchases...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPurchases(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Purchases</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <FlatList
          data={purchases}
          keyExtractor={(item, index) => String(item?._id || index)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="file-document-outline" size={44} color="#64748B" />
              <Text style={styles.emptyTitle}>No Receipts Found</Text>
              <Text style={styles.emptySubtext}>Your successful payments will appear here.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const title = makeReceiptTitle(item, index);
            const amount = formatPrice(item?.amount);
            const createdAt = formatDate(item?.createdAt);

            return (
              <TouchableOpacity
                style={styles.receiptCard}
                activeOpacity={0.86}
                onPress={() => navigation.navigate('PurchaseReceiptDetail', { purchase: item, fallbackTitle: title })}
              >
                <View style={styles.receiptIconWrap}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={26} color="#1D4ED8" />
                </View>
                <View style={styles.receiptBody}>
                  <Text style={styles.receiptTitle} numberOfLines={2}>{title}</Text>
                  <Text style={styles.receiptMeta}>Paid: {amount}</Text>
                  <Text style={styles.receiptMeta}>On: {createdAt}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  backBtnText: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  backBtnPlaceholder: { width: 36, height: 36 },
  title: { color: '#0F172A', fontSize: 18, fontWeight: '800' },

  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20 },
  receiptCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptBody: { flex: 1 },
  receiptTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  receiptMeta: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  helperText: { marginTop: 10, color: '#64748B', fontWeight: '600' },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  emptyWrap: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { marginTop: 10, color: '#0F172A', fontSize: 18, fontWeight: '900' },
  emptySubtext: { marginTop: 4, color: '#64748B', fontSize: 12, fontWeight: '600' },
});
