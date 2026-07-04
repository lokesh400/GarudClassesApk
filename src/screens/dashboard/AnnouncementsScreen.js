import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const COLORS = {
  primary: '#F97316',
  primaryLight: '#FFF7ED',
  background: '#FBFBFE',
  white: '#FFFFFF',
  text: '#171717',
  textMuted: '#64748B',
  border: '#E8E5EF',
};

export default function AnnouncementsScreen({ route, navigation }) {
  const { batchId } = route.params || {};
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [batchId]);

  const fetchAnnouncements = async () => {
    if (!batchId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/student/announcements?batchId=${batchId}`);
      setAnnouncements(res.data);
    } catch (err) {
      setError('Could not load announcements.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="bullhorn-outline" size={24} color={COLORS.primary} />
        <Text style={styles.dateText}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
        </Text>
      </View>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
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
      ) : announcements.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="bell-off-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No announcements found.</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
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
  emptyText: { color: COLORS.textMuted, fontSize: 16, marginTop: 12 },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.primaryLight, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FFEDD5' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  messageText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  dateText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
});
