import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

function makeAnswerKey(sectionId, questionId) {
  return `${String(sectionId)}::${String(questionId)}`;
}

function isAttemptedAnswer(answer) {
  if (!answer) return false;
  if (answer.selectedOption) return true;
  if (Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0) return true;
  return answer.numericalAnswer !== null && answer.numericalAnswer !== undefined;
}

function getQuestionStatus(answer) {
  if (!isAttemptedAnswer(answer)) return 'skipped';
  return answer?.isCorrect ? 'correct' : 'wrong';
}

function formatSeconds(value) {
  const total = Math.max(0, Math.round(Number(value) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatPercent(numerator, denominator) {
  if (!denominator) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function answerToText(answer) {
  if (!answer || !isAttemptedAnswer(answer)) return 'Not Attempted';
  if (answer.selectedOption) return answer.selectedOption;
  if (Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0) {
    return answer.selectedOptions.join(', ');
  }
  if (answer.numericalAnswer !== null && answer.numericalAnswer !== undefined) {
    return String(answer.numericalAnswer);
  }
  return 'Not Attempted';
}

function correctAnswerText(question) {
  if (!question) return '-';
  if (question.type === 'mcq') return question.correctOption || '-';
  if (question.type === 'msq') {
    return Array.isArray(question.correctOptions) && question.correctOptions.length > 0
      ? question.correctOptions.join(', ')
      : '-';
  }
  if (question.type === 'numerical') {
    return question.correctNumericalAnswer !== null && question.correctNumericalAnswer !== undefined
      ? String(question.correctNumericalAnswer)
      : '-';
  }
  return '-';
}

export default function TestResultScreen({ route, navigation }) {
  const { logout } = useAuth();
  const { testId, initialResult } = route.params;

  const [result, setResult] = useState(initialResult || null);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [questionFilter, setQuestionFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    const fetchResult = async () => {
      if (!initialResult) setLoading(true);
      setError('');
      try {
        const res = await apiClient.get(`/tests/${testId}/my-result`);
        if (!mounted) return;
        setResult(res.data);
      } catch (e) {
        if (!mounted) return;
        if (e.response?.status === 401) {
          logout();
          return;
        }
        if (!initialResult) {
          setError(e.response?.data?.message || 'Could not load result.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchResult();
    return () => {
      mounted = false;
    };
  }, [initialResult, logout, testId]);

  const answersByKey = useMemo(() => {
    const map = {};
    (result?.attempt?.answers || []).forEach((ans) => {
      const sectionId = String(ans.sectionId || '');
      const questionId = String(ans.question?._id || ans.question || ans.questionId || '');
      if (!sectionId || !questionId) return;
      map[makeAnswerKey(sectionId, questionId)] = ans;
    });
    return map;
  }, [result?.attempt?.answers]);

  const questionRows = useMemo(() => {
    const rows = [];
    (result?.test?.sections || []).forEach((section, secIndex) => {
      const sectionId = String(section._id || '');
      (section.questions || []).forEach((entry, qIndex) => {
        const question = entry?.question;
        const questionId = String(question?._id || entry?.questionId || '');
        if (!questionId) return;

        const answer = answersByKey[makeAnswerKey(sectionId, questionId)] || null;
        const status = getQuestionStatus(answer);
        const subjectName = question?.subject?.name || 'General';
        const chapterName = question?.chapter?.name || 'Unspecified';

        rows.push({
          key: makeAnswerKey(sectionId, questionId),
          index: rows.length + 1,
          sectionIndex: secIndex,
          questionIndex: qIndex,
          sectionId,
          sectionName: section.name || `Section ${secIndex + 1}`,
          questionId,
          question,
          status,
          subjectName,
          chapterName,
          answer,
          marksObtained: Number(answer?.marksObtained || 0),
          timeSpent: Number(answer?.timeSpent || 0),
          selectedText: answerToText(answer),
          correctText: correctAnswerText(question),
        });
      });
    });
    return rows;
  }, [answersByKey, result?.test?.sections]);

  const stats = useMemo(() => {
    const score = Number(result?.attempt?.totalScore || 0);
    const maxScore = Number(result?.attempt?.maxScore || 0);
    const attempted = questionRows.filter((r) => r.status !== 'skipped').length;
    const correct = questionRows.filter((r) => r.status === 'correct').length;
    const wrong = questionRows.filter((r) => r.status === 'wrong').length;
    const skipped = questionRows.filter((r) => r.status === 'skipped').length;
    const totalTimeSpent = questionRows.reduce((acc, row) => acc + row.timeSpent, 0);
    const avgPerQuestion = questionRows.length ? totalTimeSpent / questionRows.length : 0;
    const avgCorrect = correct
      ? questionRows.filter((r) => r.status === 'correct').reduce((acc, r) => acc + r.timeSpent, 0) / correct
      : 0;
    const avgWrong = wrong
      ? questionRows.filter((r) => r.status === 'wrong').reduce((acc, r) => acc + r.timeSpent, 0) / wrong
      : 0;

    return {
      attempted,
      correct,
      wrong,
      skipped,
      score,
      maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
      totalTimeSpent,
      avgPerQuestion,
      avgCorrect,
      avgWrong,
    };
  }, [questionRows, result?.attempt?.maxScore, result?.attempt?.totalScore]);

  const sectionStats = useMemo(() => {
    const grouped = {};
    questionRows.forEach((row) => {
      if (!grouped[row.sectionId]) {
        grouped[row.sectionId] = {
          id: row.sectionId,
          name: row.sectionName,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          score: 0,
          totalTime: 0,
        };
      }
      const ref = grouped[row.sectionId];
      ref.total += 1;
      ref.score += row.marksObtained;
      ref.totalTime += row.timeSpent;
      if (row.status === 'correct') ref.correct += 1;
      else if (row.status === 'wrong') ref.wrong += 1;
      else ref.skipped += 1;
    });
    return Object.values(grouped);
  }, [questionRows]);

  const subjectStats = useMemo(() => {
    const grouped = {};
    questionRows.forEach((row) => {
      const key = row.subjectName;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          totalTime: 0,
        };
      }
      const ref = grouped[key];
      ref.total += 1;
      ref.totalTime += row.timeSpent;
      if (row.status === 'correct') ref.correct += 1;
      else if (row.status === 'wrong') ref.wrong += 1;
      else ref.skipped += 1;
    });
    return Object.values(grouped);
  }, [questionRows]);

  const chapterStats = useMemo(() => {
    const grouped = {};
    questionRows.forEach((row) => {
      const key = `${row.subjectName}::${row.chapterName}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          chapterName: row.chapterName,
          subjectName: row.subjectName,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          totalTime: 0,
        };
      }
      const ref = grouped[key];
      ref.total += 1;
      ref.totalTime += row.timeSpent;
      if (row.status === 'correct') ref.correct += 1;
      else if (row.status === 'wrong') ref.wrong += 1;
      else ref.skipped += 1;
    });
    return Object.values(grouped);
  }, [questionRows]);

  const filteredQuestions = useMemo(() => {
    if (questionFilter === 'all') return questionRows;
    if (questionFilter === 'correct') return questionRows.filter((q) => q.status === 'correct');
    if (questionFilter === 'wrong') return questionRows.filter((q) => q.status === 'wrong');
    return questionRows.filter((q) => q.status === 'skipped');
  }, [questionFilter, questionRows]);

  const sectionTopScore = useMemo(() => {
    const max = sectionStats.reduce((acc, item) => Math.max(acc, item.score), 0);
    return max > 0 ? max : 1;
  }, [sectionStats]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading result...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace('TestResult', { testId })}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Results</Text>
          <View style={{ width: 36 }} />
        </View> */}

        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.testName} numberOfLines={2}>{result?.test?.name || 'Test'}</Text>
            <Text style={styles.submittedAtText}>
              Submitted: {result?.attempt?.submittedAt ? new Date(result.attempt.submittedAt).toLocaleString() : '-'}
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeMain}>{stats.score}/{stats.maxScore}</Text>
            <Text style={styles.scoreBadgeSub}>{stats.percentage}%</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsOuter}
          contentContainerStyle={styles.tabsWrap}
        >
          <TabBtn title="Overview" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
          <TabBtn title="Section & Subject" active={activeTab === 'sections'} onPress={() => setActiveTab('sections')} />
          <TabBtn title="Time Analysis" active={activeTab === 'time'} onPress={() => setActiveTab('time')} />
          <TabBtn title="Questions Review" active={activeTab === 'questions'} onPress={() => setActiveTab('questions')} />
        </ScrollView>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'overview' && (
            <View style={styles.tabPanel}>
              <View style={styles.gridTwo}>
                <MetricCard label="Score" value={`${stats.score}/${stats.maxScore}`} color="#0F3D8A" />
                <MetricCard label="Accuracy" value={`${stats.accuracy}%`} color="#7C3AED" />
                <MetricCard label="Attempted" value={String(stats.attempted)} color="#0284C7" />
                <MetricCard label="Correct" value={String(stats.correct)} color="#16A34A" />
                <MetricCard label="Wrong" value={String(stats.wrong)} color="#DC2626" />
                <MetricCard label="Skipped" value={String(stats.skipped)} color="#6B7280" />
              </View>

              <View style={styles.blockCard}>
                <Text style={styles.blockTitle}>Answer Distribution</Text>
                <ProgressRow label="Correct" value={stats.correct} total={questionRows.length} color="#16A34A" />
                <ProgressRow label="Wrong" value={stats.wrong} total={questionRows.length} color="#DC2626" />
                <ProgressRow label="Skipped" value={stats.skipped} total={questionRows.length} color="#9CA3AF" />
              </View>

              <View style={styles.blockCard}>
                <Text style={styles.blockTitle}>Score Per Section</Text>
                {sectionStats.map((section) => (
                  <View key={section.id} style={styles.sectionScoreRow}>
                    <Text style={styles.sectionName}>{section.name}</Text>
                    <View style={styles.sectionBarTrack}>
                      <View
                        style={[
                          styles.sectionBarFill,
                          { width: `${Math.max(4, Math.round((section.score / sectionTopScore) * 100))}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.sectionScoreText}>{section.score.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'sections' && (
            <View style={styles.tabPanel}>
              <View style={styles.blockCard}>
                <Text style={styles.blockTitle}>Section-wise Breakdown</Text>
                {sectionStats.map((item) => (
                  <View key={item.id} style={styles.tableRowCard}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowMeta}>Correct: {item.correct}  Wrong: {item.wrong}  Skip: {item.skipped}</Text>
                    <Text style={styles.rowMeta}>Score: {item.score.toFixed(2)}  Accuracy: {formatPercent(item.correct, item.total)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.blockCard}>
                <Text style={styles.blockTitle}>Subject-wise Breakdown</Text>
                {subjectStats.map((item) => (
                  <View key={item.key} style={styles.tableRowCard}>
                    <Text style={styles.rowTitle}>{item.key}</Text>
                    <Text style={styles.rowMeta}>Correct: {item.correct}  Wrong: {item.wrong}  Skip: {item.skipped}</Text>
                    <Text style={styles.rowMeta}>Accuracy: {formatPercent(item.correct, item.total)}  Avg Time: {formatSeconds(item.totalTime / Math.max(item.total, 1))}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.blockCard}>
                <Text style={styles.blockTitle}>Chapter-wise Breakdown</Text>
                {chapterStats.map((item) => (
                  <View key={item.key} style={styles.tableRowCard}>
                    <Text style={styles.rowTitle}>{item.chapterName} ({item.subjectName})</Text>
                    <Text style={styles.rowMeta}>Correct: {item.correct}  Wrong: {item.wrong}  Skip: {item.skipped}</Text>
                    <Text style={styles.rowMeta}>Accuracy: {formatPercent(item.correct, item.total)}  Avg Time: {formatSeconds(item.totalTime / Math.max(item.total, 1))}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'time' && (
            <View style={styles.tabPanel}>
              <View style={styles.gridTwo}>
                <MetricCard label="Total Time" value={formatSeconds(stats.totalTimeSpent)} color="#0F3D8A" />
                <MetricCard label="Avg / Question" value={formatSeconds(stats.avgPerQuestion)} color="#475569" />
                <MetricCard label="Avg Correct" value={formatSeconds(stats.avgCorrect)} color="#16A34A" />
                <MetricCard label="Avg Wrong" value={formatSeconds(stats.avgWrong)} color="#DC2626" />
              </View>

              <View style={styles.blockCard}>
                <Text style={styles.blockTitle}>Time Per Section</Text>
                {sectionStats.map((item) => (
                  <View key={item.id} style={styles.sectionScoreRow}>
                    <Text style={styles.sectionName}>{item.name}</Text>
                    <Text style={styles.sectionScoreText}>{formatSeconds(item.totalTime)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.blockCard}>
                <Text style={styles.blockTitle}>Question-wise Time Detail</Text>
                {questionRows.map((row) => (
                  <View key={row.key} style={styles.questionTimeRow}>
                    <Text style={styles.qTimeIndex}>Q{row.index}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.qTimeLine}>{row.sectionName} • {row.subjectName}</Text>
                      <Text style={styles.qTimeLineMuted}>Result: {row.status.toUpperCase()}  Marks: {row.marksObtained}</Text>
                    </View>
                    <Text style={styles.qTimeValue}>{formatSeconds(row.timeSpent)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'questions' && (
            <View style={styles.tabPanel}>
              <View style={styles.filterRow}>
                <FilterBtn title="All" active={questionFilter === 'all'} onPress={() => setQuestionFilter('all')} />
                <FilterBtn title="Correct" active={questionFilter === 'correct'} onPress={() => setQuestionFilter('correct')} />
                <FilterBtn title="Wrong" active={questionFilter === 'wrong'} onPress={() => setQuestionFilter('wrong')} />
                <FilterBtn title="Skipped" active={questionFilter === 'skipped'} onPress={() => setQuestionFilter('skipped')} />
              </View>

              {filteredQuestions.map((row) => (
                <View key={row.key} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <Text style={styles.reviewTitle}>Q{row.index} / {questionRows.length}</Text>
                    <Text style={styles.reviewType}>{String(row.question?.type || 'mcq').toUpperCase()}</Text>
                  </View>
                  <View style={styles.reviewMetaStrip}>
                    <Text style={styles.reviewMetaStripText}>Section: {row.sectionName}</Text>
                    <Text style={styles.reviewMetaStripText}>Time: {formatSeconds(row.timeSpent)}</Text>
                    <Text style={styles.reviewMetaStripText}>Marks: {row.marksObtained}</Text>
                  </View>
                  <View style={styles.reviewHeadBottom}>
                    <Text style={styles.reviewSubTitle}>Subject: {row.subjectName} • {row.chapterName}</Text>
                    <StatusPill status={row.status} />
                  </View>
                  {!!row.question?.imageUrl && (
                    <View style={styles.reviewImageWrap}>
                      <Image
                        source={{ uri: row.question.imageUrl }}
                        style={styles.reviewImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <Text style={styles.reviewMeta}><Text style={styles.reviewMetaLabel}>Selected:</Text> {row.selectedText}</Text>
                  <Text style={styles.reviewMeta}><Text style={styles.reviewMetaLabel}>Correct:</Text> {row.correctText}</Text>
                </View>
              ))}
            </View>
          )}
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function TabBtn({ title, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

function FilterBtn({ title, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

function StatusPill({ status }) {
  const map = {
    correct: { bg: '#DCFCE7', text: '#166534', label: 'CORRECT' },
    wrong: { bg: '#FEE2E2', text: '#991B1B', label: 'WRONG' },
    skipped: { bg: '#E5E7EB', text: '#374151', label: 'SKIPPED' },
  };
  const cfg = map[status] || map.skipped;
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusPillText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({ label, value, total, color }) {
  const widthPct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.progressHead}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value} ({widthPct}%)</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(widthPct, value > 0 ? 4 : 0)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF2F8' },
  root: { flex: 1, backgroundColor: '#EEF2F8' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#EEF2F8',
  },
  loadingText: { marginTop: 10, color: '#4B5563', fontWeight: '600' },
  errorText: { color: '#B91C1C', marginBottom: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },

  header: {
    backgroundColor: '#0F3460',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },

  heroCard: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#123E70',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  submittedAtText: { color: '#BFDBFE', marginTop: 4, fontSize: 11, fontWeight: '600' },
  scoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 94,
    alignItems: 'center',
  },
  scoreBadgeMain: { color: '#fff', fontSize: 15, fontWeight: '900' },
  scoreBadgeSub: { color: '#DBEAFE', fontSize: 12, fontWeight: '800', marginTop: 2 },

  tabsOuter: {
    height: 50,
    minHeight: 50,
    marginTop: 2,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
  },
  tabsWrap: { paddingHorizontal: 10, alignItems: 'center', gap: 8, minHeight: 50 },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#0F3460' },
  tabBtnText: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  tabBtnTextActive: { color: '#0F3460' },

  content: { padding: 12, paddingBottom: 24, flexGrow: 1 },
  tabPanel: {
    width: '100%',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    width: '48.8%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  metricValue: { fontSize: 18, fontWeight: '900' },
  metricLabel: { marginTop: 4, color: '#64748B', fontSize: 12, fontWeight: '700' },

  blockCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  blockTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },

  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { color: '#334155', fontSize: 12, fontWeight: '700' },
  progressValue: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },

  sectionScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9, gap: 8 },
  sectionName: { width: 90, color: '#334155', fontSize: 12, fontWeight: '700' },
  sectionBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sectionBarFill: { height: '100%', backgroundColor: '#1D4ED8' },
  sectionScoreText: { width: 58, textAlign: 'right', color: '#0F172A', fontSize: 12, fontWeight: '800' },

  tableRowCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  rowTitle: { color: '#0F172A', fontSize: 13, fontWeight: '800', marginBottom: 3 },
  rowMeta: { color: '#475569', fontSize: 12, fontWeight: '600' },

  questionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
    gap: 8,
  },
  qTimeIndex: {
    width: 30,
    textAlign: 'center',
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 12,
  },
  qTimeLine: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  qTimeLineMuted: { color: '#64748B', fontSize: 11, fontWeight: '600', marginTop: 1 },
  qTimeValue: { color: '#0F172A', fontSize: 12, fontWeight: '800' },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    backgroundColor: '#0F3460',
    borderColor: '#0F3460',
  },
  filterBtnText: { color: '#374151', fontSize: 12, fontWeight: '700' },
  filterBtnTextActive: { color: '#fff' },

  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
    marginBottom: 8,
  },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewTitle: { color: '#111827', fontSize: 15, fontWeight: '800' },
  reviewType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3D91',
    backgroundColor: '#E7EEF9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reviewMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  reviewMetaStripText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewHeadBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  reviewSubTitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  reviewImageWrap: {
    width: '100%',
    minHeight: 140,
    maxHeight: 280,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewImage: {
    width: '100%',
    height: 220,
  },
  reviewMeta: { color: '#475569', fontSize: 12, fontWeight: '600', marginBottom: 3 },
  reviewMetaLabel: { color: '#0F172A', fontWeight: '800' },

  primaryBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 2,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
