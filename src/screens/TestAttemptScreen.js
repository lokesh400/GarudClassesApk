import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

function makeAnswerKey(sectionId, questionId) {
  return `${sectionId}::${questionId}`;
}

function buildInitialAnswers(attemptAnswers = []) {
  const map = {};
  attemptAnswers.forEach((ans) => {
    const sectionId = String(ans.sectionId || '');
    const questionId = String(ans.question || ans.questionId || '');
    if (!sectionId || !questionId) return;

    map[makeAnswerKey(sectionId, questionId)] = {
      selectedOption: ans.selectedOption || null,
      selectedOptions: Array.isArray(ans.selectedOptions) ? ans.selectedOptions : [],
      numericalAnswer:
        ans.numericalAnswer === null || ans.numericalAnswer === undefined
          ? ''
          : String(ans.numericalAnswer),
    };
  });
  return map;
}

export default function TestAttemptScreen({ route, navigation }) {
  const { logout } = useAuth();
  const { test, attempt, batchId } = route.params;

  const [answersMap, setAnswersMap] = useState(
    buildInitialAnswers(attempt?.answers || [])
  );
  const [visitedMap, setVisitedMap] = useState(() => {
    const initial = {};
    (attempt?.answers || []).forEach((ans) => {
      const sectionId = String(ans.sectionId || '');
      const questionId = String(ans.question || ans.questionId || '');
      if (!sectionId || !questionId) return;
      initial[makeAnswerKey(sectionId, questionId)] = true;
    });
    return initial;
  });
  const [reviewedMap, setReviewedMap] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(1.6);
  const [statsMenuOpen, setStatsMenuOpen] = useState(false);

  const questionEnteredAtRef = useRef(Date.now());
  const timeSpentMapRef = useRef({});
  const timerIntervalRef = useRef(null);

  const flattened = useMemo(() => {
    const list = [];
    (test.sections || []).forEach((section) => {
      (section.questions || []).forEach((entry) => {
        if (!entry?.question?._id) return;
        list.push({
          sectionId: String(section._id),
          sectionName: section.name || 'Section',
          questionEntryId: String(entry._id),
          questionId: String(entry.question._id),
          question: entry.question,
        });
      });
    });
    return list;
  }, [test.sections]);

  const totalQuestions = flattened.length;

  const currentSection = (test.sections || [])[currentSectionIndex] || null;
  const currentQuestionEntry = currentSection
    ? (currentSection.questions || [])[currentQuestionIndex] || null
    : null;
  const currentQuestion = currentQuestionEntry?.question || null;
  const currentKey = currentSection && currentQuestion
    ? makeAnswerKey(String(currentSection._id), String(currentQuestion._id))
    : null;

  useEffect(() => {
    const startedAt = attempt?.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
    const totalDurationSeconds = Number(test.duration || 0) * 60;
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    setTimeLeft(Math.max(0, totalDurationSeconds - elapsed));
    setTimerReady(true);
  }, [attempt?.startedAt, test.duration]);

  const flushCurrentQuestionTime = useCallback(() => {
    if (!currentKey) return;

    const now = Date.now();
    const spent = Math.max(0, Math.floor((now - questionEnteredAtRef.current) / 1000));
    if (spent > 0) {
      timeSpentMapRef.current[currentKey] = (timeSpentMapRef.current[currentKey] || 0) + spent;
    }
    questionEnteredAtRef.current = now;
  }, [currentKey]);

  useEffect(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!timerReady || timeLeft !== 0 || submitting) return;

    const runAutoSubmit = async () => {
      await submitTest(true);
    };
    runAutoSubmit();
  }, [submitting, timeLeft, timerReady]);

  useEffect(() => {
    if (!currentKey) return;
    setVisitedMap((prev) => {
      if (prev[currentKey]) return prev;
      return { ...prev, [currentKey]: true };
    });
    questionEnteredAtRef.current = Date.now();
  }, [currentKey]);

  useEffect(() => {
    return () => {
      flushCurrentQuestionTime();
    };
  }, [flushCurrentQuestionTime]);

  const getStatus = useCallback((key) => {
    const ans = answersMap[key];
    const isAnswered = !!ans && (
      !!ans.selectedOption ||
      (Array.isArray(ans.selectedOptions) && ans.selectedOptions.length > 0) ||
      (ans.numericalAnswer !== '' && ans.numericalAnswer !== null && ans.numericalAnswer !== undefined)
    );

    const isVisited = !!visitedMap[key];
    const isReviewed = !!reviewedMap[key];

    if (isReviewed && isAnswered) return 'answered-marked';
    if (isReviewed) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'not-answered';
    return 'not-visited';
  }, [answersMap, reviewedMap, visitedMap]);

  const statusColors = {
    'not-visited': { bg: '#D1D5DB', text: '#374151' },
    'not-answered': { bg: '#EF4444', text: '#FFFFFF' },
    answered: { bg: '#22C55E', text: '#FFFFFF' },
    marked: { bg: '#A855F7', text: '#FFFFFF' },
    'answered-marked': { bg: '#7C3AED', text: '#FFFFFF' },
  };

  const timerDisplay = useMemo(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeft]);

  const sectionAnsweredMap = useMemo(() => {
    const map = {};
    (test.sections || []).forEach((section) => {
      const sectionId = String(section._id);
      let count = 0;
      (section.questions || []).forEach((entry) => {
        const qId = String(entry?.question?._id || '');
        if (!qId) return;
        const key = makeAnswerKey(sectionId, qId);
        const st = getStatus(key);
        if (st === 'answered' || st === 'answered-marked') count += 1;
      });
      map[sectionId] = count;
    });
    return map;
  }, [getStatus, test.sections]);

  const overallStats = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let notVisited = 0;

    flattened.forEach((item) => {
      const key = makeAnswerKey(item.sectionId, item.questionId);
      const st = getStatus(key);
      if (st === 'answered') answered += 1;
      else if (st === 'not-answered') notAnswered += 1;
      else if (st === 'marked' || st === 'answered-marked') marked += 1;
      else notVisited += 1;
    });

    return { answered, notAnswered, marked, notVisited };
  }, [flattened, getStatus]);

  const sectionStats = useMemo(() => {
    return (test.sections || []).map((section) => {
      let answered = 0;
      let marked = 0;
      let notVisited = 0;
      let notAnswered = 0;

      (section.questions || []).forEach((entry) => {
        const qId = String(entry?.question?._id || '');
        if (!qId) return;
        const key = makeAnswerKey(String(section._id), qId);
        const st = getStatus(key);

        if (st === 'answered') answered += 1;
        else if (st === 'answered-marked') {
          answered += 1;
          marked += 1;
        } else if (st === 'marked') marked += 1;
        else if (st === 'not-answered') notAnswered += 1;
        else notVisited += 1;
      });

      return {
        sectionId: String(section._id),
        sectionName: section.name || 'Section',
        total: (section.questions || []).length,
        answered,
        marked,
        notAnswered,
        notVisited,
      };
    });
  }, [getStatus, test.sections]);

  const jumpToQuestion = (sectionIndex, questionIndex) => {
    flushCurrentQuestionTime();
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(questionIndex);
  };

  const setMcqAnswer = (sectionId, questionId, option) => {
    const key = makeAnswerKey(sectionId, questionId);
    setAnswersMap((prev) => ({
      ...prev,
      [key]: {
        selectedOption: option,
        selectedOptions: [],
        numericalAnswer: '',
      },
    }));
  };

  const toggleMsqAnswer = (sectionId, questionId, option) => {
    const key = makeAnswerKey(sectionId, questionId);
    setAnswersMap((prev) => {
      const current = prev[key] || {
        selectedOption: null,
        selectedOptions: [],
        numericalAnswer: '',
      };
      const currentSet = new Set(current.selectedOptions || []);
      if (currentSet.has(option)) currentSet.delete(option);
      else currentSet.add(option);

      return {
        ...prev,
        [key]: {
          selectedOption: null,
          selectedOptions: Array.from(currentSet),
          numericalAnswer: '',
        },
      };
    });
  };

  const setNumericalAnswer = (sectionId, questionId, value) => {
    const key = makeAnswerKey(sectionId, questionId);
    setAnswersMap((prev) => ({
      ...prev,
      [key]: {
        selectedOption: null,
        selectedOptions: [],
        numericalAnswer: value,
      },
    }));
    setVisitedMap((prev) => ({ ...prev, [key]: true }));
  };

  const clearAnswer = (sectionId, questionId) => {
    const key = makeAnswerKey(sectionId, questionId);
    setAnswersMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setReviewedMap((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const buildSubmitPayload = () => {
    return flattened.map((item) => {
      const key = makeAnswerKey(item.sectionId, item.questionId);
      const state = answersMap[key] || {};

      const numerical = String(state.numericalAnswer || '').trim();
      return {
        questionId: item.questionId,
        sectionId: item.sectionId,
        selectedOption: state.selectedOption || null,
        selectedOptions: Array.isArray(state.selectedOptions)
          ? state.selectedOptions
          : [],
        numericalAnswer: numerical === '' ? null : Number(numerical),
        timeSpent: timeSpentMapRef.current[key] || 0,
      };
    });
  };

  const submitTest = async (auto = false) => {
    if (submitting) return;

    flushCurrentQuestionTime();

    setSubmitting(true);
    try {
      const payload = buildSubmitPayload();
      const res = await apiClient.post(`/tests/${test._id}/submit`, {
        answers: payload,
        batchId,
      });

      navigation.replace('TestResult', {
        testId: test._id,
        initialResult: {
          attempt: {
            totalScore: res.data?.totalScore,
            maxScore: res.data?.maxScore,
            answers: res.data?.answers || [],
          },
          test: {
            _id: test._id,
            name: test.name,
            sections: test.sections || [],
          },
        },
      });
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        return;
      }
      Alert.alert('Submit failed', e.response?.data?.message || 'Please try again.');
      if (auto) {
        // Keep UI usable in case auto-submit fails due to transient network issues.
        setTimeLeft(1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPress = () => {
    if (submitting) return;

    const { answered, notAnswered, marked, notVisited } = overallStats;
    const message =
      `Answered: ${answered}\n` +
      `Not Answered: ${notAnswered}\n` +
      `Marked: ${marked}\n` +
      `Not Visited: ${notVisited}\n\n` +
      'Once submitted, this attempt will be finalized.';

    Alert.alert('Submit test', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        style: 'destructive',
        onPress: () => submitTest(false),
      },
    ]);
  };

  const goPrev = () => {
    if (!currentSection) return;
    if (currentQuestionIndex > 0) {
      jumpToQuestion(currentSectionIndex, currentQuestionIndex - 1);
      return;
    }
    if (currentSectionIndex > 0) {
      const prevSectionIndex = currentSectionIndex - 1;
      const prevSection = test.sections[prevSectionIndex];
      const prevQuestionCount = (prevSection?.questions || []).length;
      jumpToQuestion(prevSectionIndex, Math.max(prevQuestionCount - 1, 0));
    }
  };

  const goNext = () => {
    if (!currentSection) return;
    const sectionQuestionCount = (currentSection.questions || []).length;
    if (currentQuestionIndex < sectionQuestionCount - 1) {
      jumpToQuestion(currentSectionIndex, currentQuestionIndex + 1);
      return;
    }
    if (currentSectionIndex < (test.sections || []).length - 1) {
      jumpToQuestion(currentSectionIndex + 1, 0);
    }
  };

  const handleSaveAndNext = () => {
    if (!currentKey) return;
    setReviewedMap((prev) => {
      if (!prev[currentKey]) return prev;
      const next = { ...prev };
      delete next[currentKey];
      return next;
    });
    goNext();
  };

  const handleMarkAndNext = () => {
    if (!currentKey) return;
    setReviewedMap((prev) => ({ ...prev, [currentKey]: true }));
    goNext();
  };

  if (!currentSection || !currentQuestionEntry || !currentQuestion || !currentKey) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>Question data is unavailable.</Text>
      </View>
    );
  };

  const currentAnswerState = answersMap[currentKey] || {
    selectedOption: null,
    selectedOptions: [],
    numericalAnswer: '',
  };
  const currentType = currentQuestion.type || 'mcq';

  const handleQuestionImageLoad = (event) => {
    const width = event?.nativeEvent?.source?.width;
    const height = event?.nativeEvent?.source?.height;
    if (!width || !height) return;
    const ratio = width / height;
    if (Number.isFinite(ratio) && ratio > 0) {
      // Clamp extreme ratios so image never stretches beyond card bounds.
      const clampedRatio = Math.max(0.55, Math.min(ratio, 2.4));
      setImageAspectRatio(clampedRatio);
    }
  };

  useEffect(() => {
    // Reset to a safe default while loading the next question image.
    setImageAspectRatio(1.6);
  }, [currentQuestion?.imageUrl]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {test.name}
          </Text>
        </View>
        <View style={styles.topRightWrap}>
          <Text style={[styles.timerChip, timeLeft <= 300 && styles.timerChipDanger]}>{timerDisplay}</Text>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setStatsMenuOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuBtnText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

     <View>
      <View style={styles.paletteCardTop}>
        <View style={styles.paletteGrid}>
          {(currentSection.questions || []).map((entry, qIndex) => {
            const qId = String(entry?.question?._id || '');
            if (!qId) return null;
            const key = makeAnswerKey(String(currentSection._id), qId);
            const status = getStatus(key);
            const color = statusColors[status] || statusColors['not-visited'];
            const active = qIndex === currentQuestionIndex;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.paletteBtn,
                  { backgroundColor: color.bg, borderColor: active ? '#2563EB' : 'transparent' },
                ]}
                onPress={() => jumpToQuestion(currentSectionIndex, qIndex)}
              >
                <Text style={[styles.paletteBtnText, { color: color.text }]}>{qIndex + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

        <ScrollView
        horizontal
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        overScrollMode="never"
        style={styles.sectionTabsOuter}
        contentContainerStyle={styles.sectionTabsWrap}
        >
        {(test.sections || []).map((section, sectionIndex) => {
          const sectionId = String(section._id);
          const isActive = sectionIndex === currentSectionIndex;
          const answered = sectionAnsweredMap[sectionId] || 0;
          const total = (section.questions || []).length;
          return (
            <TouchableOpacity
              key={sectionId}
              style={[styles.sectionTabBtn, isActive && styles.sectionTabBtnActive]}
              onPress={() => jumpToQuestion(sectionIndex, 0)}
            >
              <Text
                style={[styles.sectionTabText, isActive && styles.sectionTabTextActive]}
                numberOfLines={1}
              >
                {section.name || `Section ${sectionIndex + 1}`}
              </Text>
              <View style={[styles.sectionTabBadge, isActive && styles.sectionTabBadgeActive]}>
                <Text style={[styles.sectionTabBadgeText, isActive && styles.sectionTabBadgeTextActive]}>
                  {answered}/{total}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>    
     

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionCard}>
          <View style={styles.questionHead}>
            <Text style={styles.questionIndex}>
              Q{currentQuestionIndex + 1} / {(currentSection.questions || []).length}
            </Text>
            <Text style={styles.questionType}>{currentType.toUpperCase()}</Text>
          </View>

          <View style={styles.metaStrip}>
            <Text style={styles.metaStripText}>Section: {currentSection.name || 'Section'}</Text>
            <Text style={styles.metaStripText}>+{currentQuestionEntry.positiveMarks || 0}</Text>
            <Text style={[styles.metaStripText, styles.metaStripNeg]}>
              -{currentQuestionEntry.negativeMarks || 0}
            </Text>
          </View>

          {!!currentQuestion?.imageUrl && (
            <View style={styles.questionImageFrame}>
              <Image
                key={currentQuestion.imageUrl}
                source={{ uri: currentQuestion.imageUrl }}
                style={[styles.questionImage, { aspectRatio: imageAspectRatio }]}
                resizeMode="contain"
                onLoad={handleQuestionImageLoad}
              />
            </View>
          )}

          {(currentType === 'mcq' || currentType === 'msq') && (
            <View style={styles.optionsRow}>
              {['A', 'B', 'C', 'D'].map((opt) => {
                const selected =
                  currentType === 'mcq'
                    ? currentAnswerState.selectedOption === opt
                    : (currentAnswerState.selectedOptions || []).includes(opt);

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, selected && styles.optionBtnActive]}
                    onPress={() =>
                      currentType === 'mcq'
                        ? setMcqAnswer(String(currentSection._id), String(currentQuestion._id), opt)
                        : toggleMsqAnswer(String(currentSection._id), String(currentQuestion._id), opt)
                    }
                  >
                    <View style={[styles.optionBadge, selected && styles.optionBadgeActive]}>
                      <Text style={[styles.optionBadgeText, selected && styles.optionBadgeTextActive]}>
                        {opt}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionBtnText,
                        selected && styles.optionBtnTextActive,
                      ]}
                    >
                      Option {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {currentType === 'numerical' && (
            <TextInput
              style={styles.numericalInput}
              value={String(currentAnswerState.numericalAnswer || '')}
              onChangeText={(v) => setNumericalAnswer(String(currentSection._id), String(currentQuestion._id), v)}
              placeholder="Enter numerical answer"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionPrimaryBtn} onPress={handleSaveAndNext}>
              <Text style={styles.actionPrimaryText}>Save & Next</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionMarkedBtn} onPress={handleMarkAndNext}>
              <Text style={styles.actionMarkedText}>Mark & Next</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={goPrev}>
              <Text style={styles.navBtnText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => clearAnswer(String(currentSection._id), String(currentQuestion._id))}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {statsMenuOpen && (
        <>
          <TouchableOpacity
            style={styles.statsOverlay}
            activeOpacity={1}
            onPress={() => setStatsMenuOpen(false)}
          />
          <View style={styles.statsDrawer}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Test Summary</Text>
              <TouchableOpacity onPress={() => setStatsMenuOpen(false)} style={styles.statsCloseBtn}>
                <Text style={styles.statsCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerActionWrap}>
              <TouchableOpacity
                style={[styles.drawerSubmitBtn, submitting && styles.disabledBtn]}
                onPress={() => {
                  setStatsMenuOpen(false);
                  handleSubmitPress();
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.drawerSubmitText}>Submit Test</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.statsContent}>
              <Text style={styles.statsBlockTitle}>Overall</Text>
              <View style={styles.legendWrap}>
                <Legend label="Answered" color="#22C55E" value={overallStats.answered} />
                <Legend label="Marked" color="#A855F7" value={overallStats.marked} />
                <Legend label="Not Answered" color="#EF4444" value={overallStats.notAnswered} />
                <Legend label="Not Visited" color="#D1D5DB" value={overallStats.notVisited} />
              </View>

              <Text style={styles.statsBlockTitle}>Section Wise</Text>
              {sectionStats.map((section) => (
                <View key={section.sectionId} style={styles.sectionStatsCard}>
                  <Text style={styles.sectionStatsTitle}>
                    {section.sectionName} ({section.total})
                  </Text>
                  <Text style={styles.sectionStatsLine}>Answered: {section.answered}</Text>
                  <Text style={styles.sectionStatsLine}>Marked: {section.marked}</Text>
                  <Text style={styles.sectionStatsLine}>Not Answered: {section.notAnswered}</Text>
                  <Text style={styles.sectionStatsLine}>Not Visited: {section.notVisited}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

function Legend({ label, color, value }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}: {value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9EDF2' },
  centerState: {
    flex: 1,
    backgroundColor: '#E9EDF2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#0D2C66',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerCenter: { flex: 1, paddingRight: 10 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  topRightWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBtn: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, lineHeight: 18 },
  timerChip: {
    color: '#0B2A5F',
    backgroundColor: '#F8FAFF',
    fontWeight: '800',
    fontSize: 12,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    minWidth: 88,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#D6E3FF',
  },
  timerChipDanger: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  sectionTabsOuter: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    height: 52,
    overflow: 'hidden',
  },
  sectionTabsWrap: {
    paddingHorizontal: 10,
    paddingVertical: 0,
    gap: 10,
    alignItems: 'center',
    height: 52,
    minHeight: 52,
    flexDirection: 'row',
    flexGrow: 0,
  },
  sectionTabBtn: {
    borderRadius: 8,
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: 40,
    minWidth: 132,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTabBtnActive: {
    backgroundColor: '#0B3D91',
    borderColor: '#0B3D91',
  },
  sectionTabText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    flexShrink: 1,
  },
  sectionTabTextActive: { color: '#FFFFFF' },
  sectionTabBadge: {
    backgroundColor: '#D9E1EC',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 46,
    alignItems: 'center',
  },
  sectionTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sectionTabBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  sectionTabBadgeTextActive: { color: '#DBEAFE' },

  paletteCardTop: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },

  content: { padding: 10, paddingBottom: 22 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  questionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questionIndex: { fontSize: 15, fontWeight: '800', color: '#111827' },
  questionType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3D91',
    backgroundColor: '#E7EEF9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metaStripText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  metaStripNeg: {
    color: '#DC2626',
  },
  questionImageFrame: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    minHeight: 180,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionImage: {
    width: '100%',
    maxWidth: '100%',
    height: undefined,
  },

  optionsRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 10,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionBtnActive: {
    backgroundColor: '#E9F2FF',
    borderColor: '#0B3D91',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeActive: {
    backgroundColor: '#0B3D91',
  },
  optionBadgeText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  optionBadgeTextActive: {
    color: '#FFFFFF',
  },
  optionBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  optionBtnTextActive: { color: '#0B3D91' },
  numericalInput: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  actionPrimaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  actionPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionMarkedBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  actionMarkedText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  clearText: { color: '#334155', fontSize: 12, fontWeight: '700' },

  navRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navBtn: {
    backgroundColor: '#EEF2F7',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 4,
    minWidth: 88,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navBtnText: { color: '#1F2937', fontSize: 13, fontWeight: '800' },

  paletteTitle: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteBtn: {
    width: 36,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  paletteBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  legendWrap: { marginTop: 12, gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },

  statsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 15,
  },
  statsDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '78%',
    maxWidth: 340,
    backgroundColor: '#fff',
    zIndex: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
  },
  statsHeader: {
    backgroundColor: '#0B3D91',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  statsCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCloseText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  drawerActionWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
  },
  drawerSubmitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  drawerSubmitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  statsContent: { padding: 12, paddingBottom: 24 },
  statsBlockTitle: {
    color: '#1E293B',
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionStatsCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  sectionStatsTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionStatsLine: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledBtn: { opacity: 0.7 },
});