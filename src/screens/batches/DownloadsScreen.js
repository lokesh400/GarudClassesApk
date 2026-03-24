import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import { clearDownloadById, listDownloads } from '../../utils/downloads';

export default function DownloadsScreen({ navigation }) {
  const [items, setItems] = useState([]);

  const loadItems = useCallback(async () => {
    try {
      const data = await listDownloads();
      setItems(data);
    } catch {
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleDelete = (item) => {
    Alert.alert('Remove Download', 'This file will be deleted from your device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await clearDownloadById(item.id);
          setItems(updated);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.downloadCard}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('AttachmentViewer', {
          localFile: item,
          title: item.title,
        })
      }
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="file-document-outline" size={22} color="#1D4ED8" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Attachment'}</Text>
        {!!item.courseTitle && <Text style={styles.metaText} numberOfLines={1}>{item.courseTitle}</Text>}
        {!!item.lessonTitle && <Text style={styles.metaText} numberOfLines={1}>{item.lessonTitle}</Text>}
        <Text style={styles.metaText}>
          Downloaded: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
        </Text>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <MaterialCommunityIcons name="delete-outline" size={20} color="#B91C1C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppHeader title="My Downloads" navigation={navigation} showBack />
      <View style={styles.root}>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>⬇</Text>
              <Text style={styles.emptyTitle}>No Downloads Yet</Text>
              <Text style={styles.emptySubtext}>
                Open any lecture attachment and tap download to save it here.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  listContent: { paddingHorizontal: 14, paddingVertical: 12, flexGrow: 1 },
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
  downloadCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  metaText: { color: '#64748B', fontSize: 11, marginTop: 2, fontWeight: '600' },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
