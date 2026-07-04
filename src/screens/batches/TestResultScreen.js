import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import apiClient from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#4C1D95',
  primaryLight: '#EDE9FE',
  primarySoft: '#F5F3FF',

  background: '#F8F7FC',
  white: '#FFFFFF',

  text: '#171717',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  border: '#E8E5EF',

  success: '#16A34A',
  successBg: '#DCFCE7',

  danger: '#DC2626',
  dangerBg: '#FEE2E2',

  warning: '#D97706',
  warningBg: '#FEF3C7',

  info: '#0284C7',
  infoBg: '#E0F2FE',
};

function makeAnswerKey(sectionId, questionId) {
  return `${String(sectionId)}::${String(questionId)}`;
}

function isAttemptedAnswer(answer) {
  if (!answer) return false;

  if (
    answer.selectedOption !== null &&
    answer.selectedOption !== undefined &&
    String(answer.selectedOption).trim() !== ''
  ) {
    return true;
  }

  if (
    Array.isArray(answer.selectedOptions) &&
    answer.selectedOptions.length > 0
  ) {
    return true;
  }

  return (
    answer.numericalAnswer !== null &&
    answer.numericalAnswer !== undefined &&
    String(answer.numericalAnswer).trim() !== ''
  );
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

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatPercent(numerator, denominator) {
  if (!denominator) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function answerToText(answer) {
  if (!answer || !isAttemptedAnswer(answer)) {
    return 'Not Attempted';
  }

  if (
    answer.selectedOption !== null &&
    answer.selectedOption !== undefined &&
    String(answer.selectedOption).trim() !== ''
  ) {
    return String(answer.selectedOption);
  }

  if (
    Array.isArray(answer.selectedOptions) &&
    answer.selectedOptions.length > 0
  ) {
    return answer.selectedOptions.join(', ');
  }

  if (
    answer.numericalAnswer !== null &&
    answer.numericalAnswer !== undefined &&
    String(answer.numericalAnswer).trim() !== ''
  ) {
    return String(answer.numericalAnswer);
  }

  return 'Not Attempted';
}

function correctAnswerText(question) {
  if (!question) return '-';

  if (question.type === 'mcq') {
    return question.correctOption || '-';
  }

  if (question.type === 'msq') {
    return Array.isArray(question.correctOptions) &&
      question.correctOptions.length > 0
      ? question.correctOptions.join(', ')
      : '-';
  }

  if (question.type === 'numerical') {
    return question.correctNumericalAnswer !== null &&
      question.correctNumericalAnswer !== undefined
      ? String(question.correctNumericalAnswer)
      : '-';
  }

  return '-';
}

export default function TestResultScreen({ route, navigation }) {
  const { logout } = useAuth();

  const { testId, initialResult } = route.params || {};

  const [result, setResult] = useState(initialResult || null);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [questionFilter, setQuestionFilter] = useState('all');

  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchResult = async () => {
      if (!initialResult) {
        setLoading(true);
      }

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
          setError(
            e.response?.data?.message || 'Could not load result.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
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

      const questionId = String(
        ans.question?._id ||
          ans.question ||
          ans.questionId ||
          ''
      );

      if (!sectionId || !questionId) return;

      map[makeAnswerKey(sectionId, questionId)] = ans;
    });

    return map;
  }, [result?.attempt?.answers]);

  const questionRows = useMemo(() => {
    const rows = [];

    (result?.test?.sections || []).forEach(
      (section, secIndex) => {
        const sectionId = String(section._id || '');

        (section.questions || []).forEach(
          (entry, qIndex) => {
            const question = entry?.question;

            const questionId = String(
              question?._id || entry?.questionId || ''
            );

            if (!questionId) return;

            const answer =
              answersByKey[
                makeAnswerKey(sectionId, questionId)
              ] || null;

            const status = getQuestionStatus(answer);

            const subjectName =
              question?.subject?.name || 'General';

            const chapterName =
              question?.chapter?.name || 'Unspecified';

            rows.push({
              key: makeAnswerKey(sectionId, questionId),
              index: rows.length + 1,
              sectionIndex: secIndex,
              questionIndex: qIndex,
              sectionId,
              sectionName:
                section.name || `Section ${secIndex + 1}`,
              questionId,
              question,
              status,
              subjectName,
              chapterName,
              answer,
              marksObtained: Number(
                answer?.marksObtained || 0
              ),
              timeSpent: Number(answer?.timeSpent || 0),
              selectedText: answerToText(answer),
              correctText: correctAnswerText(question),
            });
          }
        );
      }
    );

    return rows;
  }, [answersByKey, result?.test?.sections]);

  const stats = useMemo(() => {
    const score = Number(
      result?.attempt?.totalScore || 0
    );

    const maxScore = Number(
      result?.attempt?.maxScore || 0
    );

    const attempted = questionRows.filter(
      (row) => row.status !== 'skipped'
    ).length;

    const correct = questionRows.filter(
      (row) => row.status === 'correct'
    ).length;

    const wrong = questionRows.filter(
      (row) => row.status === 'wrong'
    ).length;

    const skipped = questionRows.filter(
      (row) => row.status === 'skipped'
    ).length;

    const totalTimeSpent = questionRows.reduce(
      (total, row) => total + row.timeSpent,
      0
    );

    const avgPerQuestion = questionRows.length
      ? totalTimeSpent / questionRows.length
      : 0;

    const correctRows = questionRows.filter(
      (row) => row.status === 'correct'
    );

    const wrongRows = questionRows.filter(
      (row) => row.status === 'wrong'
    );

    const avgCorrect = correct
      ? correctRows.reduce(
          (total, row) => total + row.timeSpent,
          0
        ) / correct
      : 0;

    const avgWrong = wrong
      ? wrongRows.reduce(
          (total, row) => total + row.timeSpent,
          0
        ) / wrong
      : 0;

    return {
      attempted,
      correct,
      wrong,
      skipped,
      score,
      maxScore,

      percentage:
        maxScore > 0
          ? Math.round((score / maxScore) * 100)
          : 0,

      accuracy:
        attempted > 0
          ? Math.round((correct / attempted) * 100)
          : 0,

      totalTimeSpent,
      avgPerQuestion,
      avgCorrect,
      avgWrong,
    };
  }, [
    questionRows,
    result?.attempt?.maxScore,
    result?.attempt?.totalScore,
  ]);

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

      if (row.status === 'correct') {
        ref.correct += 1;
      } else if (row.status === 'wrong') {
        ref.wrong += 1;
      } else {
        ref.skipped += 1;
      }
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

      if (row.status === 'correct') {
        ref.correct += 1;
      } else if (row.status === 'wrong') {
        ref.wrong += 1;
      } else {
        ref.skipped += 1;
      }
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

      if (row.status === 'correct') {
        ref.correct += 1;
      } else if (row.status === 'wrong') {
        ref.wrong += 1;
      } else {
        ref.skipped += 1;
      }
    });

    return Object.values(grouped);
  }, [questionRows]);

  const filteredQuestions = useMemo(() => {
    if (questionFilter === 'all') {
      return questionRows;
    }

    return questionRows.filter(
      (question) => question.status === questionFilter
    );
  }, [questionFilter, questionRows]);

  const sectionTopScore = useMemo(() => {
    const max = sectionStats.reduce(
      (currentMax, item) =>
        Math.max(currentMax, item.score),
      0
    );

    return max > 0 ? max : 1;
  }, [sectionStats]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.loadingIcon}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={38}
              color={COLORS.primary}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loadingText}>
            Preparing your result...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={55}
            color={COLORS.danger}
          />

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() =>
              navigation.replace('TestResult', { testId })
            }
          >
            <MaterialCommunityIcons
              name="refresh"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <LinearGradient
            colors={[
              COLORS.primaryDark,
              COLORS.primary,
              '#8B5CF6',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.topArea}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={23}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                Test Result
              </Text>

              <View style={styles.headerButtonPlaceholder} />
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.heroInfo}>
                  <View style={styles.resultLabel}>
                    <MaterialCommunityIcons
                      name="chart-timeline-variant"
                      size={14}
                      color="#DDD6FE"
                    />

                    <Text style={styles.resultLabelText}>
                      PERFORMANCE REPORT
                    </Text>
                  </View>

                  <Text style={styles.testName}>
                    {result?.test?.name || 'Test'}
                  </Text>

                  <View style={styles.submittedRow}>
                    <MaterialCommunityIcons
                      name="calendar-check-outline"
                      size={14}
                      color="#DDD6FE"
                    />

                    <Text style={styles.submittedAtText}>
                      {result?.attempt?.submittedAt
                        ? new Date(
                            result.attempt.submittedAt
                          ).toLocaleString('en-IN')
                        : '-'}
                    </Text>
                  </View>
                </View>

                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreCircleValue}>
                    {stats.percentage}%
                  </Text>

                  <Text style={styles.scoreCircleLabel}>
                    SCORE
                  </Text>
                </View>
              </View>

              <View style={styles.heroStats}>
                <HeroStat
                  icon="star-outline"
                  value={`${stats.score}/${stats.maxScore}`}
                  label="Marks"
                />

                <View style={styles.heroDivider} />

                <HeroStat
                  icon="target"
                  value={`${stats.accuracy}%`}
                  label="Accuracy"
                />

                <View style={styles.heroDivider} />

                <HeroStat
                  icon="timer-outline"
                  value={formatSeconds(stats.totalTimeSpent)}
                  label="Time"
                />
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
            nestedScrollEnabled
          >
            <TabBtn
              title="Overview"
              icon="view-dashboard-outline"
              active={activeTab === 'overview'}
              onPress={() => setActiveTab('overview')}
            />

            <TabBtn
              title="Section & Subject"
              icon="book-open-page-variant-outline"
              active={activeTab === 'sections'}
              onPress={() => setActiveTab('sections')}
            />

            <TabBtn
              title="Time Analysis"
              icon="clock-outline"
              active={activeTab === 'time'}
              onPress={() => setActiveTab('time')}
            />

            <TabBtn
              title="Questions Review"
              icon="clipboard-text-outline"
              active={activeTab === 'questions'}
              onPress={() => setActiveTab('questions')}
            />
          </ScrollView>

          <View style={styles.content}>
            {activeTab === 'overview' && (
              <OverviewTab
                stats={stats}
                questionRows={questionRows}
                sectionStats={sectionStats}
                sectionTopScore={sectionTopScore}
              />
            )}

            {activeTab === 'sections' && (
              <SectionsTab
                sectionStats={sectionStats}
                subjectStats={subjectStats}
                chapterStats={chapterStats}
              />
            )}

            {activeTab === 'time' && (
              <TimeTab
                stats={stats}
                sectionStats={sectionStats}
                questionRows={questionRows}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionsTab
                questionFilter={questionFilter}
                setQuestionFilter={setQuestionFilter}
                filteredQuestions={filteredQuestions}
                questionRows={questionRows}
                setFullscreenImage={setFullscreenImage}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <FullscreenImageModal
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </>
  );
}

function HeroStat({ icon, value, label }) {
  return (
    <View style={styles.heroStat}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color="#EDE9FE"
      />

      <Text style={styles.heroStatValue}>{value}</Text>

      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function OverviewTab({
  stats,
  questionRows,
  sectionStats,
  sectionTopScore,
}) {
  return (
    <View>
      <SectionHeader
        title="Performance Overview"
        subtitle="Your complete test performance"
      />

      <View style={styles.metricGrid}>
        <MetricCard
          icon="trophy-outline"
          label="Score"
          value={`${stats.score}/${stats.maxScore}`}
          color={COLORS.primary}
          bg={COLORS.primaryLight}
        />

        <MetricCard
          icon="target"
          label="Accuracy"
          value={`${stats.accuracy}%`}
          color="#7C3AED"
          bg="#F3E8FF"
        />

        <MetricCard
          icon="pencil-outline"
          label="Attempted"
          value={String(stats.attempted)}
          color={COLORS.info}
          bg={COLORS.infoBg}
        />

        <MetricCard
          icon="check-circle-outline"
          label="Correct"
          value={String(stats.correct)}
          color={COLORS.success}
          bg={COLORS.successBg}
        />

        <MetricCard
          icon="close-circle-outline"
          label="Wrong"
          value={String(stats.wrong)}
          color={COLORS.danger}
          bg={COLORS.dangerBg}
        />

        <MetricCard
          icon="minus-circle-outline"
          label="Skipped"
          value={String(stats.skipped)}
          color={COLORS.textSecondary}
          bg="#F1F5F9"
        />
      </View>

      <AnalysisCard
        title="Answer Distribution"
        icon="chart-donut"
      >
        <ProgressRow
          label="Correct"
          value={stats.correct}
          total={questionRows.length}
          color={COLORS.success}
          icon="check-circle"
        />

        <ProgressRow
          label="Wrong"
          value={stats.wrong}
          total={questionRows.length}
          color={COLORS.danger}
          icon="close-circle"
        />

        <ProgressRow
          label="Skipped"
          value={stats.skipped}
          total={questionRows.length}
          color={COLORS.textMuted}
          icon="minus-circle"
        />
      </AnalysisCard>

      <AnalysisCard
        title="Score Per Section"
        icon="chart-bar"
      >
        {sectionStats.map((section) => {
          const width = Math.max(
            4,
            Math.round(
              (section.score / sectionTopScore) * 100
            )
          );

          return (
            <View
              key={section.id}
              style={styles.sectionProgressItem}
            >
              <View style={styles.sectionProgressHeader}>
                <Text
                  style={styles.sectionProgressName}
                  numberOfLines={2}
                >
                  {section.name}
                </Text>

                <Text style={styles.sectionProgressScore}>
                  {section.score.toFixed(2)}
                </Text>
              </View>

              <View style={styles.sectionBarTrack}>
                <LinearGradient
                  colors={[
                    COLORS.primary,
                    '#8B5CF6',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.sectionBarFill,
                    { width: `${width}%` },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </AnalysisCard>
    </View>
  );
}

function SectionsTab({
  sectionStats,
  subjectStats,
  chapterStats,
}) {
  return (
    <View>
      <SectionHeader
        title="Detailed Analysis"
        subtitle="Section, subject and chapter performance"
      />

      <AnalysisCard
        title="Section-wise Breakdown"
        icon="view-grid-outline"
      >
        {sectionStats.map((item) => (
          <BreakdownCard
            key={item.id}
            title={item.name}
            correct={item.correct}
            wrong={item.wrong}
            skipped={item.skipped}
            accuracy={formatPercent(
              item.correct,
              item.total
            )}
            extraLabel="Score"
            extraValue={item.score.toFixed(2)}
          />
        ))}
      </AnalysisCard>

      <AnalysisCard
        title="Subject-wise Breakdown"
        icon="book-open-variant"
      >
        {subjectStats.map((item) => (
          <BreakdownCard
            key={item.key}
            title={item.key}
            correct={item.correct}
            wrong={item.wrong}
            skipped={item.skipped}
            accuracy={formatPercent(
              item.correct,
              item.total
            )}
            extraLabel="Avg Time"
            extraValue={formatSeconds(
              item.totalTime / Math.max(item.total, 1)
            )}
          />
        ))}
      </AnalysisCard>

      <AnalysisCard
        title="Chapter-wise Breakdown"
        icon="bookmark-multiple-outline"
      >
        {chapterStats.map((item) => (
          <BreakdownCard
            key={item.key}
            title={item.chapterName}
            subtitle={item.subjectName}
            correct={item.correct}
            wrong={item.wrong}
            skipped={item.skipped}
            accuracy={formatPercent(
              item.correct,
              item.total
            )}
            extraLabel="Avg Time"
            extraValue={formatSeconds(
              item.totalTime / Math.max(item.total, 1)
            )}
          />
        ))}
      </AnalysisCard>
    </View>
  );
}

function TimeTab({
  stats,
  sectionStats,
  questionRows,
}) {
  return (
    <View>
      <SectionHeader
        title="Time Analysis"
        subtitle="Understand where you spent your time"
      />

      <View style={styles.metricGrid}>
        <MetricCard
          icon="timer-outline"
          label="Total Time"
          value={formatSeconds(stats.totalTimeSpent)}
          color={COLORS.primary}
          bg={COLORS.primaryLight}
        />

        <MetricCard
          icon="clock-fast"
          label="Avg / Question"
          value={formatSeconds(stats.avgPerQuestion)}
          color={COLORS.info}
          bg={COLORS.infoBg}
        />

        <MetricCard
          icon="check-circle-outline"
          label="Avg Correct"
          value={formatSeconds(stats.avgCorrect)}
          color={COLORS.success}
          bg={COLORS.successBg}
        />

        <MetricCard
          icon="close-circle-outline"
          label="Avg Wrong"
          value={formatSeconds(stats.avgWrong)}
          color={COLORS.danger}
          bg={COLORS.dangerBg}
        />
      </View>

      <AnalysisCard
        title="Time Per Section"
        icon="clock-outline"
      >
        {sectionStats.map((item) => (
          <View
            key={item.id}
            style={styles.timeSectionRow}
          >
            <View style={styles.timeSectionIcon}>
              <MaterialCommunityIcons
                name="book-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>

            <Text
              style={styles.timeSectionName}
              numberOfLines={3}
            >
              {item.name}
            </Text>

            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>
                {formatSeconds(item.totalTime)}
              </Text>
            </View>
          </View>
        ))}
      </AnalysisCard>

      <AnalysisCard
        title="Question-wise Time"
        icon="format-list-numbered"
      >
        {questionRows.map((row) => (
          <QuestionTimeRow
            key={row.key}
            row={row}
          />
        ))}
      </AnalysisCard>
    </View>
  );
}

function QuestionsTab({
  questionFilter,
  setQuestionFilter,
  filteredQuestions,
  questionRows,
  setFullscreenImage,
}) {
  return (
    <View>
      <SectionHeader
        title="Question Review"
        subtitle="Review your answers question by question"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <FilterBtn
          title="All"
          count={questionRows.length}
          active={questionFilter === 'all'}
          onPress={() => setQuestionFilter('all')}
        />

        <FilterBtn
          title="Correct"
          count={
            questionRows.filter(
              (item) => item.status === 'correct'
            ).length
          }
          active={questionFilter === 'correct'}
          onPress={() => setQuestionFilter('correct')}
        />

        <FilterBtn
          title="Wrong"
          count={
            questionRows.filter(
              (item) => item.status === 'wrong'
            ).length
          }
          active={questionFilter === 'wrong'}
          onPress={() => setQuestionFilter('wrong')}
        />

        <FilterBtn
          title="Skipped"
          count={
            questionRows.filter(
              (item) => item.status === 'skipped'
            ).length
          }
          active={questionFilter === 'skipped'}
          onPress={() => setQuestionFilter('skipped')}
        />
      </ScrollView>

      {filteredQuestions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={48}
            color={COLORS.textMuted}
          />

          <Text style={styles.emptyTitle}>
            No questions found
          </Text>

          <Text style={styles.emptySubtitle}>
            There are no questions in this category.
          </Text>
        </View>
      ) : (
        filteredQuestions.map((row) => (
          <QuestionReviewCard
            key={row.key}
            row={row}
            totalQuestions={questionRows.length}
            onFullscreen={() =>
              setFullscreenImage(
                row.question?.imageUrl
              )
            }
          />
        ))
      )}
    </View>
  );
}

function QuestionReviewCard({
  row,
  totalQuestions,
  onFullscreen,
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.questionNumberWrap}>
          <Text style={styles.questionNumber}>
            Q{row.index}
          </Text>

          <Text style={styles.questionTotal}>
            of {totalQuestions}
          </Text>
        </View>

        <View style={styles.reviewHeaderRight}>
          <View style={styles.questionTypeBadge}>
            <Text style={styles.questionTypeText}>
              {String(
                row.question?.type || 'mcq'
              ).toUpperCase()}
            </Text>
          </View>

          <StatusPill status={row.status} />
        </View>
      </View>

      <View style={styles.questionInfoCard}>
        <View style={styles.questionInfoItem}>
          <MaterialCommunityIcons
            name="book-open-outline"
            size={15}
            color={COLORS.primary}
          />

          <Text
            style={styles.questionInfoText}
            numberOfLines={3}
          >
            {row.sectionName}
          </Text>
        </View>

        <View style={styles.questionInfoItem}>
          <MaterialCommunityIcons
            name="timer-outline"
            size={15}
            color={COLORS.info}
          />

          <Text style={styles.questionInfoText}>
            {formatSeconds(row.timeSpent)}
          </Text>
        </View>

        <View style={styles.questionInfoItem}>
          <MaterialCommunityIcons
            name="star-outline"
            size={15}
            color={COLORS.warning}
          />

          <Text style={styles.questionInfoText}>
            {row.marksObtained} Marks
          </Text>
        </View>
      </View>

      <View style={styles.subjectChapterWrap}>
        <Text style={styles.subjectText}>
          {row.subjectName}
        </Text>

        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={COLORS.textMuted}
        />

        <Text
          style={styles.chapterText}
          numberOfLines={2}
        >
          {row.chapterName}
        </Text>
      </View>

      {!!row.question?.imageUrl && (
        <View style={styles.reviewImageWrap}>
          <Image
            source={{
              uri: row.question.imageUrl,
            }}
            style={styles.reviewImage}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={onFullscreen}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="fullscreen"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.answerArea}>
        <AnswerRow
          icon={
            row.status === 'correct'
              ? 'check-circle'
              : row.status === 'wrong'
              ? 'close-circle'
              : 'minus-circle'
          }
          label="Your Answer"
          value={row.selectedText}
          color={
            row.status === 'correct'
              ? COLORS.success
              : row.status === 'wrong'
              ? COLORS.danger
              : COLORS.textSecondary
          }
          background={
            row.status === 'correct'
              ? COLORS.successBg
              : row.status === 'wrong'
              ? COLORS.dangerBg
              : '#F1F5F9'
          }
        />

        <AnswerRow
          icon="check-decagram"
          label="Correct Answer"
          value={row.correctText}
          color={COLORS.success}
          background={COLORS.successBg}
        />
      </View>
    </View>
  );
}

function AnswerRow({
  icon,
  label,
  value,
  color,
  background,
}) {
  return (
    <View
      style={[
        styles.answerRow,
        { backgroundColor: background },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={color}
      />

      <View style={styles.answerContent}>
        <Text style={styles.answerLabel}>{label}</Text>

        <Text
          style={[
            styles.answerValue,
            { color },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function BreakdownCard({
  title,
  subtitle,
  correct,
  wrong,
  skipped,
  accuracy,
  extraLabel,
  extraValue,
}) {
  return (
    <View style={styles.breakdownCard}>
      <View style={styles.breakdownTop}>
        <View style={styles.breakdownTitleWrap}>
          <Text
            style={styles.breakdownTitle}
            numberOfLines={3}
          >
            {title}
          </Text>

          {!!subtitle && (
            <Text style={styles.breakdownSubtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyBadgeValue}>
            {accuracy}
          </Text>

          <Text style={styles.accuracyBadgeLabel}>
            Accuracy
          </Text>
        </View>
      </View>

      <View style={styles.breakdownStats}>
        <SmallStat
          label="Correct"
          value={correct}
          color={COLORS.success}
        />

        <SmallStat
          label="Wrong"
          value={wrong}
          color={COLORS.danger}
        />

        <SmallStat
          label="Skipped"
          value={skipped}
          color={COLORS.textSecondary}
        />

        <SmallStat
          label={extraLabel}
          value={extraValue}
          color={COLORS.primary}
        />
      </View>
    </View>
  );
}

function SmallStat({ label, value, color }) {
  return (
    <View style={styles.smallStat}>
      <Text
        style={[
          styles.smallStatValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.smallStatLabel}>
        {label}
      </Text>
    </View>
  );
}

function QuestionTimeRow({ row }) {
  const statusColor =
    row.status === 'correct'
      ? COLORS.success
      : row.status === 'wrong'
      ? COLORS.danger
      : COLORS.textSecondary;

  return (
    <View style={styles.questionTimeRow}>
      <View
        style={[
          styles.questionTimeNumber,
          { backgroundColor: `${statusColor}15` },
        ]}
      >
        <Text
          style={[
            styles.questionTimeNumberText,
            { color: statusColor },
          ]}
        >
          {row.index}
        </Text>
      </View>

      <View style={styles.questionTimeContent}>
        <Text
          style={styles.questionTimeTitle}
          numberOfLines={2}
        >
          {row.sectionName}
        </Text>

        <Text style={styles.questionTimeSubtitle}>
          {row.subjectName} • {row.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.questionTimeRight}>
        <Text style={styles.questionTimeValue}>
          {formatSeconds(row.timeSpent)}
        </Text>

        <Text style={styles.questionTimeMarks}>
          {row.marksObtained} marks
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>
        {title}
      </Text>

      <Text style={styles.sectionHeaderSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function AnalysisCard({ title, icon, children }) {
  return (
    <View style={styles.analysisCard}>
      <View style={styles.analysisCardHeader}>
        <View style={styles.analysisIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.analysisCardTitle}>
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
  bg,
}) {
  return (
    <View style={styles.metricCard}>
      <View
        style={[
          styles.metricIcon,
          { backgroundColor: bg },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={color}
        />
      </View>

      <Text
        style={[
          styles.metricValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
  icon,
}) {
  const widthPct =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={17}
            color={color}
          />

          <Text style={styles.progressLabel}>
            {label}
          </Text>
        </View>

        <Text style={styles.progressValue}>
          {value} ({widthPct}%)
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${
                value > 0
                  ? Math.max(widthPct, 3)
                  : 0
              }%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function TabBtn({
  title,
  icon,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        active && styles.tabButtonActive,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={
          active
            ? COLORS.primary
            : COLORS.textSecondary
        }
      />

      <Text
        style={[
          styles.tabButtonText,
          active && styles.tabButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function FilterBtn({
  title,
  count,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        active && styles.filterButtonActive,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>

      <View
        style={[
          styles.filterCount,
          active && styles.filterCountActive,
        ]}
      >
        <Text
          style={[
            styles.filterCountText,
            active && styles.filterCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function StatusPill({ status }) {
  const config = {
    correct: {
      background: COLORS.successBg,
      color: COLORS.success,
      label: 'CORRECT',
      icon: 'check-circle',
    },

    wrong: {
      background: COLORS.dangerBg,
      color: COLORS.danger,
      label: 'WRONG',
      icon: 'close-circle',
    },

    skipped: {
      background: '#F1F5F9',
      color: COLORS.textSecondary,
      label: 'SKIPPED',
      icon: 'minus-circle',
    },
  };

  const item = config[status] || config.skipped;

  return (
    <View
      style={[
        styles.statusPill,
        { backgroundColor: item.background },
      ]}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={13}
        color={item.color}
      />

      <Text
        style={[
          styles.statusPillText,
          { color: item.color },
        ]}
      >
        {item.label}
      </Text>
    </View>
  );
}

function FullscreenImageModal({
  imageUrl,
  onClose,
}) {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={!!imageUrl}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
      />

      <View style={styles.fullscreenContainer}>
        <View style={styles.fullscreenHeader}>
          <Text style={styles.fullscreenTitle}>
            Question Image
          </Text>

          <TouchableOpacity
            style={styles.fullscreenCloseButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons
              name="close"
              size={27}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.fullscreenScroll}
          contentContainerStyle={
            styles.fullscreenScrollContent
          }
          maximumZoomScale={5}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          centerContent
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </ScrollView>

        <View style={styles.zoomHint}>
          <MaterialCommunityIcons
            name="gesture-pinch"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.zoomHintText}>
            Pinch to zoom
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  mainScroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: 45,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: COLORS.background,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  loadingText: {
    marginTop: 15,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  topArea: {
    paddingBottom: 18,
  },

  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonPlaceholder: {
    width: 40,
    height: 40,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 18,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  heroInfo: {
    flex: 1,
  },

  resultLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },

  resultLabelText: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  testName: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
  },

  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },

  submittedAtText: {
    flex: 1,
    color: '#DDD6FE',
    fontSize: 11,
    fontWeight: '600',
  },

  scoreCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreCircleValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  scoreCircleLabel: {
    color: '#DDD6FE',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 1,
  },

  heroStats: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroStat: {
    flex: 1,
    alignItems: 'center',
  },

  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },

  heroStatLabel: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  tabsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  tabButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  tabButtonActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: '#C4B5FD',
  },

  tabButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  content: {
    paddingHorizontal: 15,
    paddingTop: 18,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionHeaderTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },

  sectionHeaderSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 11,
    marginBottom: 16,
  },

  metricCard: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },

  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  metricValue: {
    fontSize: 21,
    fontWeight: '900',
  },

  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 15,
  },

  analysisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 17,
  },

  analysisIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  analysisCardTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },

  progressItem: {
    marginBottom: 15,
  },

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  progressLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  progressLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },

  progressValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  sectionProgressItem: {
    marginBottom: 17,
  },

  sectionProgressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },

  sectionProgressName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  sectionProgressScore: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '900',
  },

  sectionBarTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },

  sectionBarFill: {
    height: '100%',
    borderRadius: 999,
  },

  breakdownCard: {
    backgroundColor: COLORS.background,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    marginBottom: 11,
  },

  breakdownTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },

  breakdownTitleWrap: {
    flex: 1,
  },

  breakdownTitle: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },

  breakdownSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  accuracyBadge: {
    minWidth: 65,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },

  accuracyBadgeValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
  },

  accuracyBadgeLabel: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },

  breakdownStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  smallStat: {
    flex: 1,
    alignItems: 'center',
  },

  smallStatValue: {
    fontSize: 14,
    fontWeight: '900',
  },

  smallStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },

  timeSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  timeSectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeSectionName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  timeBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },

  timeBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  questionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  questionTimeNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  questionTimeNumberText: {
    fontSize: 13,
    fontWeight: '900',
  },

  questionTimeContent: {
    flex: 1,
  },

  questionTimeTitle: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  questionTimeSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },

  questionTimeRight: {
    alignItems: 'flex-end',
  },

  questionTimeValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
  },

  questionTimeMarks: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },

  filterContainer: {
    gap: 8,
    paddingBottom: 15,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  filterCount: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  filterCountText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },

  filterCountTextActive: {
    color: '#FFFFFF',
  },

  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 15,
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },

  questionNumberWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  questionNumber: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },

  questionTotal: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  reviewHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  questionTypeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  questionTypeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
  },

  questionInfoCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 9,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 11,
  },

  questionInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
  },

  questionInfoText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
  },

  subjectChapterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 11,
  },

  subjectText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  chapterText: {
    flexShrink: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  reviewImageWrap: {
    width: '100%',
    height: 240,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 13,
    position: 'relative',
  },

  reviewImage: {
    width: '100%',
    height: '100%',
  },

  fullscreenButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(23,23,23,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  answerArea: {
    gap: 9,
  },

  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 11,
  },

  answerContent: {
    flex: 1,
  },

  answerLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  answerValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 13,
  },

  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'center',
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  fullscreenHeader: {
    height: 65,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
  },

  fullscreenTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  fullscreenCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullscreenScroll: {
    flex: 1,
  },

  fullscreenScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 140,
  },

  zoomHint: {
    alignSelf: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  zoomHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});