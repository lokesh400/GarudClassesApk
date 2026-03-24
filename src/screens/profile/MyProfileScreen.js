import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import apiClient from '../../api/client';
import { fetchTargetExams } from '../../api/exams';

export default function MyProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', class: '', targetExam: '', mobile: '', address: '' });
  const [exams, setExams] = useState([]);

  useEffect(() => {
    apiClient.get('/auth/m/me')
      .then(res => {
        setProfile(res.data);
        setForm({
          name: res.data.name || '',
          class: res.data.class || '',
          targetExam: res.data.targetExam || '',
          mobile: res.data.mobile || '',
          address: res.data.address || '',
        });
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load profile');
        setLoading(false);
      });
    fetchTargetExams().then(setExams).catch(() => setExams([]));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/student/profile', {
        name: form.name,
        class: form.class,
        targetExam: form.targetExam,
        mobile: form.mobile,
        address: form.address,
      });
      setProfile({ ...profile, ...form });
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
    }
    setSaving(false);
  };

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        {/* Top Navbar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1D4ED8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(e => !e)}>
            <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} size={22} color="#1D4ED8" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.avatar}
            resizeMode="contain"
          />
          {loading ? (
            <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 24 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : profile ? (
            <View style={styles.card}>
              {editMode ? (
                <>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="account" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputModern}
                      value={form.name}
                      onChangeText={v => handleChange('name', v)}
                      placeholder="Name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="school" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputModern}
                      value={form.class}
                      onChangeText={v => handleChange('class', v)}
                      placeholder="Class"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="target" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <View style={{ flex: 1 }}>
                      <Picker
                        selectedValue={form.targetExam}
                        onValueChange={v => handleChange('targetExam', v)}
                        style={styles.picker}
                        dropdownIconColor="#1D4ED8"
                      >
                        <Picker.Item label="Select Target Exam" value="" color="#94A3B8" />
                        {exams.map((exam) => (
                          <Picker.Item key={exam._id || exam.id || exam} label={exam.name || exam} value={exam.name || exam} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="phone" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputModern}
                      value={form.mobile}
                      onChangeText={v => handleChange('mobile', v)}
                      placeholder="Mobile"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#1D4ED8" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.inputModern, { minHeight: 44 }]}
                      value={form.address}
                      onChangeText={v => handleChange('address', v)}
                      placeholder="Address"
                      placeholderTextColor="#94A3B8"
                      multiline
                    />
                  </View>
                  <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                    <MaterialCommunityIcons name="content-save" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </>
               
              ) : (
                <>
                  <Text style={styles.name}>{profile.name}</Text>
                  <Text style={styles.email}>{profile.email}</Text>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="account" size={18} color="#64748B" /><Text style={styles.label}>Role: <Text style={styles.value}>{profile.role}</Text></Text></View>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="school" size={18} color="#64748B" /><Text style={styles.label}>Class: <Text style={styles.value}>{profile.class || '-'}</Text></Text></View>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="target" size={18} color="#64748B" /><Text style={styles.label}>Target Exam: <Text style={styles.value}>{profile.targetExam || '-'}</Text></Text></View>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="phone" size={18} color="#64748B" /><Text style={styles.label}>Mobile: <Text style={styles.value}>{profile.mobile || '-'}</Text></Text></View>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="map-marker" size={18} color="#64748B" /><Text style={styles.label}>Address: <Text style={styles.value}>{profile.address || '-'}</Text></Text></View>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="cart-outline" size={18} color="#64748B" /><Text style={styles.label}>Purchased Series: <Text style={styles.value}>{Array.isArray(profile.purchasedSeries) ? profile.purchasedSeries.length : 0}</Text></Text></View>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="calendar" size={18} color="#64748B" /><Text style={styles.label}>Created: <Text style={styles.value}>{profile.createdAt ? new Date(profile.createdAt).toLocaleString() : '-'}</Text></Text></View>
                  <View style={styles.infoRow}><MaterialCommunityIcons name="update" size={18} color="#64748B" /><Text style={styles.label}>Updated: <Text style={styles.value}>{profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : '-'}</Text></Text></View>
                </>
              )}
            </View>
          ) : null}
        </ScrollView>
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
  editBtn: {
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
    input: {
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 10,
      fontSize: 15,
      minHeight: 40,
      marginBottom: 10,
      color: '#0F172A',
    },
    editLabel: {
      fontSize: 14,
      color: '#64748B',
      marginBottom: 2,
      marginTop: 6,
      fontWeight: '700',
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1D4ED8',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
      marginTop: 10,
    },
    saveBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  scrollContent: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  card: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'flex-start',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 2, alignSelf: 'center' },
  email: { fontSize: 15, color: '#334155', marginBottom: 10, alignSelf: 'center' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: { fontSize: 15, color: '#64748B' },
  value: { color: '#0F172A', fontWeight: '700' },
  error: { color: '#DC2626', fontSize: 16, marginTop: 20 },
   inputRow: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F1F5F9',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  marginBottom: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                },
                inputIcon: {
                  marginRight: 8,
                },
                inputModern: {
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#0F172A',
                  fontSize: 15,
                  paddingVertical: 10,
                  borderWidth: 0,
                },
                picker: {
                      backgroundColor: 'transparent',
                      color: '#0F172A',
                      fontSize: 15,
                      flex: 1,
                      marginLeft: -8,
                      marginRight: -8,
                      minHeight: 44,
                    },
});
