import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function getTitle(purchase, fallbackTitle) {
  const item = purchase?.itemId;
  return item?.name || item?.title || fallbackTitle || 'Purchase Receipt';
}

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

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '-'}</Text>
    </View>
  );
}

export default function PurchaseReceiptDetailScreen({ route, navigation }) {
  const { purchase, fallbackTitle } = route.params || {};
  const item = purchase?.itemId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Receipt Details</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="receipt-text-outline" size={28} color="#1D4ED8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{getTitle(purchase, fallbackTitle)}</Text>
              <Text style={styles.heroSub}>Payment Receipt</Text>
            </View>
          </View>

          <View style={styles.blockCard}>
            <Text style={styles.blockTitle}>Transaction</Text>
            <Row label="Amount" value={formatPrice(purchase?.amount)} />
            <Row label="Status" value={String(purchase?.status || '-').toUpperCase()} />
            <Row label="Method" value={String(purchase?.method || '-').toUpperCase()} />
            <Row label="Purchased On" value={formatDate(purchase?.createdAt)} />
          </View>

          <View style={styles.blockCard}>
            <Text style={styles.blockTitle}>Item Details</Text>
            <Row label="Item Type" value={purchase?.itemType || '-'} />
            <Row label="Item Name" value={item?.name || item?.title || '-'} />
            <Row label="Item ID" value={String(item?._id || purchase?.itemId?._id || purchase?.itemId || '-')} />
          </View>

          <View style={styles.blockCard}>
            <Text style={styles.blockTitle}>Payment Gateway</Text>
            <Row label="Order ID" value={purchase?.razorpayOrderId || '-'} />
            <Row label="Payment ID" value={purchase?.razorpayPaymentId || '-'} />
            <Row label="Signature" value={purchase?.razorpaySignature || '-'} />
          </View>
        </ScrollView>
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

  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  heroCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  heroIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#0F172A', fontSize: 15, fontWeight: '900' },
  heroSub: { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 2 },

  blockCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  blockTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  rowLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  rowValue: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
});
