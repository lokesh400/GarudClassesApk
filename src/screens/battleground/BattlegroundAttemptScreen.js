import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import apiClient from '../../api/client';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function BattlegroundAttemptScreen({ navigation, route }) {
  const item = route.params?.item || {};
  const itemId = String(item?._id || '');

  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [numericalAnswer, setNumericalAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9);

  const questionType = useMemo(
    () => String(item?.questionType || item?.type || item?.question?.type || 'mcq').toLowerCase(),
    [item]
  );

  const questionText =
    item?.questionText || item?.question?.text || item?.question?.questionText || item?.text || 'Question text not available.';

  const imageUrl = item?.imageUrl || item?.question?.imageUrl || '';

  const getOptionText = (optionKey) => {
    const fallback = `Option ${optionKey}`;
    const rawOptions = item?.options || item?.question?.options;

    if (Array.isArray(rawOptions)) {
      const index = ['A', 'B', 'C', 'D'].indexOf(optionKey);
      return String(rawOptions[index] || fallback);
    }

    if (rawOptions && typeof rawOptions === 'object') {
      return String(rawOptions[optionKey] || rawOptions[optionKey.toLowerCase()] || fallback);
    }

    return String(
      item?.[`option${optionKey}`] ||
      item?.[`option${optionKey.toLowerCase()}`] ||
      item?.question?.[`option${optionKey}`] ||
      item?.question?.[`option${optionKey.toLowerCase()}`] ||
      fallback
    );
  };

  const toggleMsqOption = (option) => {
    setSelectedOptions((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(option)) nextSet.delete(option);
      else nextSet.add(option);
      return Array.from(nextSet);
    });
  };

  const hasAnswer =
    (questionType === 'mcq' && !!selectedOption) ||
    (questionType === 'msq' && selectedOptions.length > 0) ||
    (questionType === 'numerical' && String(numericalAnswer).trim().length > 0);

  const buildPlainAnswer = () => {
    if (questionType === 'mcq') return selectedOption || '';
    if (questionType === 'msq') return selectedOptions.join(',');
    if (questionType === 'numerical') return String(numericalAnswer).trim();
    return '';
  };

  const handleQuestionImageLoad = (event) => {
    const width = event?.nativeEvent?.source?.width;
    const height = event?.nativeEvent?.source?.height;
    if (width && height) {
      setImageAspectRatio(width / height);
    }
  };

  const submitAnswer = async () => {
    const answer = buildPlainAnswer();
    const numericalValue = Number(numericalAnswer);
    if (!itemId || !answer) return;

    setSubmitting(true);
    try {
      const res = await apiClient.post('/battlegrounds/submit', {
        answer,
        quizId: itemId,
        battlegroundId: itemId,
        subjectKey: item.subjectKey,
        selectedOption: questionType === 'mcq' ? selectedOption : null,
        selectedOptions: questionType === 'msq' ? selectedOptions : [],
        numericalAnswer:
          questionType === 'numerical' && Number.isFinite(numericalValue) ? numericalValue : null,
      });

      Alert.alert('Submitted', res.data?.isCorrect ? 'Correct answer! Streak updated.' : 'Answer submitted.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Attempt Battleground" navigation={navigation} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <Text style={styles.subjectChip}>{String(item.subjectKey || 'subject').toUpperCase()}</Text>
          <Text style={styles.typeChip}>{questionType.toUpperCase()}</Text>
        </View>

        <Text style={styles.questionText}>{questionText}</Text>

        {!!imageUrl && (
          <View style={styles.questionImageWrap}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.questionImage, { aspectRatio: imageAspectRatio }]}
              resizeMode="contain"
              onLoad={handleQuestionImageLoad}
            />
          </View>
        )}

        {(questionType === 'mcq' || questionType === 'msq') && (
          <View style={styles.optionsWrap}>
            {['A', 'B', 'C', 'D'].map((opt) => {
              const selected = questionType === 'mcq' ? selectedOption === opt : selectedOptions.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, selected && styles.optionBtnActive]}
                  onPress={() => {
                    if (questionType === 'mcq') {
                      setSelectedOption(opt);
                      setSelectedOptions([]);
                      setNumericalAnswer('');
                    } else {
                      setSelectedOption(null);
                      setNumericalAnswer('');
                      toggleMsqOption(opt);
                    }
                  }}
                >
                  <Text style={[styles.optionKey, selected && styles.optionKeyActive]}>{opt}.</Text>
                  <Text style={[styles.optionText, selected && styles.optionTextActive]}>{getOptionText(opt)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {questionType === 'numerical' && (
          <TextInput
            style={styles.input}
            placeholder="Enter numerical answer"
            value={numericalAnswer}
            onChangeText={(v) => {
              setNumericalAnswer(v);
              setSelectedOption(null);
              setSelectedOptions([]);
            }}
            keyboardType="decimal-pad"
            editable={!submitting}
          />
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (!hasAnswer || submitting) && styles.disabledBtn]}
          onPress={submitAnswer}
          disabled={!hasAnswer || submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Answer'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  subjectChip: {
    color: '#0B3B8E',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '700',
    fontSize: 12,
  },
  typeChip: {
    color: '#1E40AF',
    backgroundColor: '#E0E7FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '700',
    fontSize: 12,
  },
  questionText: { fontSize: 16, lineHeight: 24, color: '#0F172A', fontWeight: '600' },
  questionImageWrap: {
    marginTop: 14,
    marginBottom: 14,
    marginHorizontal: -20,
    backgroundColor: '#E2E8F0',
  },
  questionImage: {
    width: SCREEN_WIDTH,
    backgroundColor: '#E2E8F0',
  },
  optionsWrap: { marginTop: 4, marginBottom: 10 },
  optionBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionBtnActive: { borderColor: '#1D4ED8', backgroundColor: '#DBEAFE' },
  optionKey: { width: 28, fontWeight: '800', color: '#334155' },
  optionKeyActive: { color: '#1D4ED8' },
  optionText: { flex: 1, color: '#0F172A', fontWeight: '600' },
  optionTextActive: { color: '#0B3B8E' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    fontSize: 16,
    backgroundColor: '#F1F5F9',
  },
  submitBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabledBtn: { opacity: 0.5 },
});
