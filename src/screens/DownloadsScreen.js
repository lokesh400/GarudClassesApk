import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DownloadsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Downloads</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>⬇</Text>
          <Text style={styles.emptyTitle}>No Downloads Yet</Text>
          <Text style={styles.emptySubtext}>
            Downloaded content will appear here for offline study.
          </Text>
        </View>
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
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 46, marginBottom: 10 },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '600',
  },
});
