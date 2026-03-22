import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import apiClient from '../api/client';
import { Picker } from '@react-native-picker/picker';

export default function CreateBattlegroundScreen({ navigation }) {
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch subjects when classLevel changes
  useEffect(() => {
    if (!classLevel) return;
    setSubject(''); setChapter(''); setTopic(''); setQuestion('');
    setLoading(true);
    apiClient.get(`/subjects?classLevel=${classLevel}`)
      .then(res => setSubjects(res.data || []))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }, [classLevel]);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (!subject) return;
    setChapter(''); setTopic(''); setQuestion('');
    setLoading(true);
    apiClient.get(`/chapters?subject=${subject}`)
      .then(res => setChapters(res.data || []))
      .catch(() => setChapters([]))
      .finally(() => setLoading(false));
  }, [subject]);

  // Fetch topics when chapter changes
  useEffect(() => {
    if (!chapter) return;
    setTopic(''); setQuestion('');
    setLoading(true);
    apiClient.get(`/topics?chapter=${chapter}`)
      .then(res => setTopics(res.data || []))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, [chapter]);

  // Fetch questions when topic changes
  useEffect(() => {
    if (!topic) return;
    setQuestion('');
    setLoading(true);
    apiClient.get(`/questions?topic=${topic}`)
      .then(res => setQuestions(res.data || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [topic]);

  const handleCreate = () => {
    if (!classLevel || !question) return;
    // Call API to create battleground quiz
    // ...
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Create Battleground" navigation={navigation} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Class</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={classLevel}
            onValueChange={setClassLevel}
            style={styles.picker}
          >
            <Picker.Item label="Select Class" value="" />
            <Picker.Item label="Class 11" value="11" />
            <Picker.Item label="Class 12" value="12" />
          </Picker>
        </View>
        <Text style={styles.label}>Subject</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={subject}
            onValueChange={setSubject}
            style={styles.picker}
            enabled={!!classLevel}
          >
            <Picker.Item label="Select Subject" value="" />
            {subjects.map((s) => (
              <Picker.Item key={s._id} label={s.name} value={s._id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Chapter</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={chapter}
            onValueChange={setChapter}
            style={styles.picker}
            enabled={!!subject}
          >
            <Picker.Item label="Select Chapter" value="" />
            {chapters.map((c) => (
              <Picker.Item key={c._id} label={c.name} value={c._id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Topic</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={topic}
            onValueChange={setTopic}
            style={styles.picker}
            enabled={!!chapter}
          >
            <Picker.Item label="Select Topic" value="" />
            {topics.map((t) => (
              <Picker.Item key={t._id} label={t.name} value={t._id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Question</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={question}
            onValueChange={setQuestion}
            style={styles.picker}
            enabled={!!topic}
          >
            <Picker.Item label="Select Question" value="" />
            {questions.map((q) => (
              <Picker.Item key={q._id} label={q.text?.slice(0, 60) || 'Question'} value={q._id} />
            ))}
          </Picker>
        </View>
        <TouchableOpacity
          style={[styles.createBtn, (!classLevel || !question) && { opacity: 0.5 }]}
          onPress={handleCreate}
          disabled={!classLevel || !question || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Battleground</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#1D4ED8', marginTop: 18, marginBottom: 6 },
  pickerWrap: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  picker: { height: 48, width: '100%' },
  createBtn: { backgroundColor: '#1D4ED8', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
