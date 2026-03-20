import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchMyHelpRequests, createHelpRequest } from '../api/help';

export default function HelpSupportScreen({ navigation }) {
  const [message, setMessage] = useState('');
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadHelpRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchMyHelpRequests();
      setHelpRequests(data);
      setError(null);
    } catch (e) {
      setError('Failed to load help requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHelpRequests();
  }, []);

  const handleAddHelp = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await createHelpRequest(message.trim());
      setMessage('');
      await loadHelpRequests();
    } catch (e) {
      setError('Failed to submit help request');
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        {/* Top Navbar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1D4ED8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Submit a New Request</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe your issue or question..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleAddHelp}
              disabled={submitting || !message.trim()}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.submitBtnText}>{submitting ? 'Sending...' : 'Send'}</Text>
            </TouchableOpacity>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>My Requests</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 24 }} />
            ) : helpRequests.length === 0 ? (
              <Text style={styles.emptyText}>No help requests yet.</Text>
            ) : (
              <FlatList
                data={helpRequests}
                keyExtractor={item => item._id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.helpItem}>
                    <MaterialCommunityIcons name="message-question-outline" size={20} color="#1D4ED8" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.helpMessage}>{item.message}</Text>
                      <Text style={styles.helpDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    margin: 18,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 15,
    minHeight: 60,
    marginBottom: 10,
    color: '#0F172A',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 2,
    marginBottom: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: '#DC2626',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  listCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    margin: 18,
    marginTop: 8,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  helpMessage: {
    color: '#0F172A',
    fontSize: 15,
    marginBottom: 2,
  },
  helpDate: {
    color: '#64748B',
    fontSize: 12,
  },
});
