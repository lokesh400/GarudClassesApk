import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import apiClient from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#4C1D95',
  primaryMedium: '#7C3AED',
  primaryLight: '#EDE9FE',
  primarySoft: '#F5F3FF',

  background: '#F8F7FC',
  white: '#FFFFFF',

  text: '#171717',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  border: '#E8E5EF',

  success: '#16A34A',
  successLight: '#DCFCE7',

  orange: '#EA580C',
  orangeLight: '#FFEDD5',

  blue: '#2563EB',
  blueLight: '#DBEAFE',

  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

const SUBJECT_PALETTES = [
  {
    background: '#F5F3FF',
    iconBackground: '#EDE9FE',
    accent: '#6D28D9',
    gradient: ['#6D28D9', '#8B5CF6'],
  },
  {
    background: '#EFF6FF',
    iconBackground: '#DBEAFE',
    accent: '#2563EB',
    gradient: ['#2563EB', '#3B82F6'],
  },
  {
    background: '#FFF7ED',
    iconBackground: '#FFEDD5',
    accent: '#EA580C',
    gradient: ['#EA580C', '#F97316'],
  },
  {
    background: '#FDF2F8',
    iconBackground: '#FCE7F3',
    accent: '#DB2777',
    gradient: ['#DB2777', '#EC4899'],
  },
  {
    background: '#F0FDF4',
    iconBackground: '#DCFCE7',
    accent: '#16A34A',
    gradient: ['#16A34A', '#22C55E'],
  },
];

function normalizeCoursePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (
    payload.course &&
    typeof payload.course === 'object'
  ) {
    return payload.course;
  }

  if (
    payload.data &&
    typeof payload.data === 'object'
  ) {
    return payload.data;
  }

  return payload;
}

async function fetchBestCoursePayload(courseId) {
  const candidates = [];

  const detailEndpoints = [
    `/study/published/${courseId}`,
    `/study/courses/published/${courseId}`,
    `/study/courses/${courseId}`,
  ];

  for (const endpoint of detailEndpoints) {
    try {
      const response = await apiClient.get(endpoint);

      candidates.push(response?.data);
    } catch (error) {
      console.log(
        `Course endpoint failed: ${endpoint}`
      );
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return normalizeCoursePayload(candidates[0]);
}

function formatScheduledDate(value) {
  if (!value) {
    return 'Available Now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Available Now';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudyCourseDetailScreen({
  route,
  navigation,
}) {
  const {
    courseId,
    purchased: initialPurchasedStatus,
  } = route.params || {};

  const { logout } = useAuth();

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [purchased, setPurchased] = useState(
    initialPurchasedStatus
  );

  const [activeTab, setActiveTab] =
    useState('Subjects');

  const [busyTestId, setBusyTestId] =
    useState('');

  const startTest = async (test) => {
    if (!test?._id) {
      Alert.alert(
        'Unable to Start',
        'Test ID is missing.'
      );

      return;
    }

    if (busyTestId) {
      return;
    }

    setBusyTestId(test._id);

    try {
      const response = await apiClient.post(
        `/tests/${test._id}/start`,
        {
          batchId: courseId,
        }
      );

      navigation.navigate('TestAttempt', {
        test: response.data.test,
        attempt: response.data.attempt,
        batchId: courseId,
      });
    } catch (error) {
      console.log(
        'Error starting test:',
        error?.message,
        error?.response?.data
      );

      if (error.response?.status === 401) {
        logout();

        return;
      }

      const message =
        error.response?.data?.message ||
        'Could not start test.';

      if (
        error.response?.status === 400 &&
        message
          .toLowerCase()
          .includes('already submitted')
      ) {
        navigation.navigate('TestResult', {
          testId: test._id,
        });

        return;
      }

      Alert.alert('Unable to Start', message);
    } finally {
      setBusyTestId('');
    }
  };

  const fetchCourse = async (
    isRefresh = false
  ) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      let verifiedPurchased = purchased;

      if (typeof purchased !== 'boolean') {
        try {
          const checkResponse =
            await apiClient.get(
              '/study/my-courses'
            );

          const myCourses = Array.isArray(
            checkResponse.data
          )
            ? checkResponse.data
            : [];

          verifiedPurchased = myCourses.some(
            (purchase) =>
              String(
                purchase?.course?._id ||
                  purchase?.course?.id
              ) === String(courseId)
          );

          setPurchased(verifiedPurchased);

          if (!verifiedPurchased) {
            Alert.alert(
              'Purchase Required',
              'Please purchase this course to access it.',
              [
                {
                  text: 'OK',
                  onPress: () =>
                    navigation.goBack(),
                },
              ]
            );

            return;
          }
        } catch (error) {
          Alert.alert(
            'Access Check Failed',
            'Could not verify purchase status. Please try again.'
          );

          return;
        }
      }

      const [
        normalizedCourse,
        publishedTestsResponse,
      ] = await Promise.all([
        fetchBestCoursePayload(courseId),

        apiClient.get('/tests/published'),
      ]);

      if (!normalizedCourse) {
        throw new Error(
          'Course payload missing'
        );
      }

      const publishedTestMap = {};

      (
        publishedTestsResponse.data || []
      ).forEach((test) => {
        if (test?._id) {
          publishedTestMap[
            String(test._id)
          ] = test;
        }
      });

      if (
        Array.isArray(normalizedCourse.tests)
      ) {
        normalizedCourse.tests =
          normalizedCourse.tests.map(
            (test) => {
              const publishedData =
                publishedTestMap[
                  String(test._id)
                ] || {};

              return {
                ...test,

                attempted:
                  !!publishedData.attempted,
              };
            }
          );
      }

      setCourse(normalizedCourse);
    } catch (error) {
      console.log(
        'Course detail loading error:',
        error
      );

      Alert.alert(
        'Unable to Load Course',
        'Failed to load course details.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const handleRefresh = () => {
    setRefreshing(true);

    fetchCourse(true);
  };

  const handleOpenSubject = (subject) => {
    navigation.navigate('StudySubjectDetail', {
      courseId,
      purchased,
      subject,
    });
  };

  const subjects = Array.isArray(
    course?.subjects
  )
    ? course.subjects
    : [];

  const tests = Array.isArray(course?.tests)
    ? course.tests
    : [];

  const renderSubjectsTab = () => {
    if (subjects.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="book-open-blank-variant-outline"
              size={46}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Subjects Yet
          </Text>

          <Text style={styles.emptyDescription}>
            Subjects added to this course will
            appear here.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.subjectList}>
        {subjects.map((subject, index) => {
          const palette =
            SUBJECT_PALETTES[
              index % SUBJECT_PALETTES.length
            ];

          const acronym = subject?.name
            ? subject.name
                .substring(0, 2)
                .toUpperCase()
            : 'SU';

          const chapterCount = Array.isArray(
            subject?.chapters
          )
            ? subject.chapters.length
            : 0;

          return (
            <TouchableOpacity
              key={
                subject?._id ||
                `subject-${index}`
              }
              style={styles.subjectCard}
              activeOpacity={0.84}
              onPress={() =>
                handleOpenSubject(subject)
              }
            >
              <View
                style={[
                  styles.subjectAccent,
                  {
                    backgroundColor:
                      palette.accent,
                  },
                ]}
              />

              <View
                style={[
                  styles.subjectIcon,
                  {
                    backgroundColor:
                      palette.iconBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subjectAcronym,
                    {
                      color: palette.accent,
                    },
                  ]}
                >
                  {acronym}
                </Text>
              </View>

              <View style={styles.subjectBody}>
                <Text
                  style={styles.subjectName}
                  numberOfLines={2}
                >
                  {subject?.name || 'Subject'}
                </Text>

                <View style={styles.subjectMeta}>
                  <MaterialCommunityIcons
                    name="book-outline"
                    size={13}
                    color={COLORS.textMuted}
                  />

                  <Text
                    style={styles.subjectMetaText}
                  >
                    {chapterCount}{' '}
                    {chapterCount === 1
                      ? 'Chapter'
                      : 'Chapters'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.subjectArrow,
                  {
                    backgroundColor:
                      palette.background,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={palette.accent}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTestsTab = () => {
    if (tests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={46}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Tests Found
          </Text>

          <Text style={styles.emptyDescription}>
            Tests assigned to this course will
            appear here.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.testList}>
        {tests.map((test, index) => {
          const scheduledDate =
            formatScheduledDate(
              test?.scheduledAt
            );

          const isBusy =
            busyTestId === test?._id;

          return (
            <View
              key={
                test?._id || `test-${index}`
              }
              style={styles.testCard}
            >
              <View style={styles.testTopRow}>
                <View style={styles.testIconWrap}>
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={25}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.testTopContent}>
                  <View style={styles.testBadgeRow}>
                    <View
                      style={styles.testTypeBadge}
                    >
                      <Text
                        style={styles.testTypeText}
                      >
                        {test?.testType || 'TEST'}
                      </Text>
                    </View>

                    {test?.attempted && (
                      <View
                        style={
                          styles.attemptedBadge
                        }
                      >
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={12}
                          color={COLORS.success}
                        />

                        <Text
                          style={
                            styles.attemptedText
                          }
                        >
                          Attempted
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={styles.testName}
                    numberOfLines={2}
                  >
                    {test?.name || 'Test'}
                  </Text>
                </View>
              </View>

              {!!test?.syllabus && (
                <View style={styles.syllabusBox}>
                  <MaterialCommunityIcons
                    name="book-open-outline"
                    size={15}
                    color={COLORS.primary}
                  />

                  <Text
                    style={styles.testSyllabus}
                    numberOfLines={2}
                  >
                    {test.syllabus}
                  </Text>
                </View>
              )}

              <View style={styles.testInfoRow}>
                <View style={styles.testInfoItem}>
                  <View
                    style={styles.testInfoIcon}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>

                  <View>
                    <Text
                      style={styles.testInfoLabel}
                    >
                      Duration
                    </Text>

                    <Text
                      style={styles.testInfoValue}
                    >
                      {test?.duration || 0} mins
                    </Text>
                  </View>
                </View>

                <View style={styles.testInfoDivider} />

                <View style={styles.testInfoItem}>
                  <View
                    style={styles.testInfoIcon}
                  >
                    <MaterialCommunityIcons
                      name="calendar-blank-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.testInfoLabel}
                    >
                      Schedule
                    </Text>

                    <Text
                      style={styles.testInfoValue}
                      numberOfLines={1}
                    >
                      {scheduledDate}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.testActions}>
                {(!test?.attempted ||
                  test?.mode !== 'real') && (
                  <TouchableOpacity
                    style={[
                      styles.attemptButton,
                      isBusy &&
                        styles.buttonDisabled,
                    ]}
                    activeOpacity={0.84}
                    disabled={isBusy}
                    onPress={() =>
                      startTest(test)
                    }
                  >
                    <LinearGradient
                      colors={[
                        COLORS.primary,
                        '#8B5CF6',
                      ]}
                      start={{
                        x: 0,
                        y: 0,
                      }}
                      end={{
                        x: 1,
                        y: 0,
                      }}
                      style={
                        styles.attemptButtonGradient
                      }
                    >
                      {isBusy ? (
                        <ActivityIndicator
                          color="#FFFFFF"
                          size="small"
                        />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name={
                              test?.attempted
                                ? 'refresh'
                                : 'play-circle-outline'
                            }
                            size={18}
                            color="#FFFFFF"
                          />

                          <Text
                            style={
                              styles.attemptButtonText
                            }
                          >
                            {test?.attempted
                              ? 'Retry Test'
                              : 'Attempt Test'}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {test?.attempted && (
                  <TouchableOpacity
                    style={styles.resultButton}
                    activeOpacity={0.82}
                    onPress={() =>
                      navigation.navigate(
                        'TestResult',
                        {
                          testId: test._id,
                        }
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="chart-box-outline"
                      size={18}
                      color={COLORS.primary}
                    />

                    <Text
                      style={
                        styles.resultButtonText
                      }
                    >
                      View Result
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primaryDark}
        />

        <SafeAreaView
          style={styles.safeArea}
          edges={['top']}
        >
          <LinearGradient
            colors={[
              COLORS.primaryDark,
              COLORS.primary,
            ]}
            style={styles.loadingHeader}
          />

          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconWrap}>
              <MaterialCommunityIcons
                name="school-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />

            <Text style={styles.loadingTitle}>
              Loading Study Room...
            </Text>

            <Text style={styles.loadingSubtitle}>
              Preparing your course content
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!course) {
    return (
      <SafeAreaView
        style={styles.errorSafeArea}
        edges={['top']}
      >
        <View style={styles.errorState}>
          <View style={styles.errorIcon}>
            <MaterialCommunityIcons
              name="book-alert-outline"
              size={48}
              color={COLORS.danger}
            />
          </View>

          <Text style={styles.errorTitle}>
            Course Not Found
          </Text>

          <Text style={styles.errorDescription}>
            We could not find this course.
          </Text>

          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>
              Go Back
            </Text>
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
        edges={['top']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient
            colors={[
              COLORS.primaryDark,
              COLORS.primary,
              '#8B5CF6',
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={styles.hero}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerButton}
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={23}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <Text style={styles.headerLabel}>
                  STUDY ROOM
                </Text>

                <Text
                  style={styles.headerTitle}
                  numberOfLines={1}
                >
                  {course?.name || 'Course'}
                </Text>
              </View>

              <View style={styles.headerButton}>
                <MaterialCommunityIcons
                  name="school-outline"
                  size={23}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name="book-open-page-variant-outline"
                  size={31}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.heroTextContent}>
                <Text style={styles.heroLabel}>
                  CONTINUE LEARNING
                </Text>

                <Text
                  style={styles.heroTitle}
                  numberOfLines={2}
                >
                  {course?.name || 'Your Course'}
                </Text>

                <Text style={styles.heroSubtitle}>
                  Explore subjects, chapters and tests
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="book-multiple-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  {subjects.length}
                </Text>

                <Text style={styles.statLabel}>
                  Subjects
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  {tests.length}
                </Text>

                <Text style={styles.statLabel}>
                  Tests
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="check-decagram-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  Active
                </Text>

                <Text style={styles.statLabel}>
                  Access
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.stickyTabContainer}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === 'Subjects' &&
                    styles.tabItemActive,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  setActiveTab('Subjects')
                }
              >
                <MaterialCommunityIcons
                  name={
                    activeTab === 'Subjects'
                      ? 'book-open-page-variant'
                      : 'book-open-page-variant-outline'
                  }
                  size={18}
                  color={
                    activeTab === 'Subjects'
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Subjects' &&
                      styles.tabTextActive,
                  ]}
                >
                  Subjects
                </Text>

                <View
                  style={[
                    styles.tabCount,
                    activeTab === 'Subjects' &&
                      styles.tabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      activeTab === 'Subjects' &&
                        styles.tabCountTextActive,
                    ]}
                  >
                    {subjects.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === 'Tests' &&
                    styles.tabItemActive,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  setActiveTab('Tests')
                }
              >
                <MaterialCommunityIcons
                  name={
                    activeTab === 'Tests'
                      ? 'clipboard-text'
                      : 'clipboard-text-outline'
                  }
                  size={18}
                  color={
                    activeTab === 'Tests'
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Tests' &&
                      styles.tabTextActive,
                  ]}
                >
                  Tests
                </Text>

                <View
                  style={[
                    styles.tabCount,
                    activeTab === 'Tests' &&
                      styles.tabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      activeTab === 'Tests' &&
                        styles.tabCountTextActive,
                    ]}
                  >
                    {tests.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'Subjects'
                    ? 'Course Subjects'
                    : 'Course Tests'}
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {activeTab === 'Subjects'
                    ? 'Choose a subject to continue learning'
                    : 'Practice and measure your performance'}
                </Text>
              </View>
            </View>

            {activeTab === 'Subjects'
              ? renderSubjectsTab()
              : renderTestsTab()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  errorSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 115,
  },

  hero: {
    paddingBottom: 22,
  },

  header: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    flex: 1,
  },

  headerLabel: {
    color: '#DDD6FE',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 11,
  },

  heroIcon: {
    width: 63,
    height: 63,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.19)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  heroTextContent: {
    flex: 1,
  },

  heroLabel: {
    color: '#DDD6FE',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 4,
  },

  heroSubtitle: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },

  statsRow: {
    marginHorizontal: 16,
    marginTop: 20,
    minHeight: 75,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },

  statLabel: {
    color: '#DDD6FE',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  stickyTabContainer: {
    backgroundColor: COLORS.background,
    paddingTop: 10,
    paddingBottom: 5,
  },

  tabBar: {
    marginHorizontal: 15,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 5,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  tabItem: {
    flex: 1,
    minHeight: 45,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  tabItemActive: {
    backgroundColor: COLORS.primarySoft,
  },

  tabText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },

  tabTextActive: {
    color: COLORS.primary,
  },

  tabCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 7,
    paddingHorizontal: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabCountActive: {
    backgroundColor: COLORS.primaryLight,
  },

  tabCountText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '900',
  },

  tabCountTextActive: {
    color: COLORS.primary,
  },

  content: {
    paddingHorizontal: 15,
    paddingTop: 18,
  },

  sectionHeader: {
    marginBottom: 15,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },

  subjectList: {
    gap: 11,
  },

  subjectCard: {
    minHeight: 82,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 13,
    overflow: 'hidden',

    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 9,
    elevation: 2,
  },

  subjectAccent: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 12,
  },

  subjectIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  subjectAcronym: {
    fontSize: 15,
    fontWeight: '900',
  },

  subjectBody: {
    flex: 1,
    paddingVertical: 13,
  },

  subjectName: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },

  subjectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },

  subjectMetaText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },

  subjectArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  testList: {
    gap: 13,
  },

  testCard: {
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,

    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  testTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  testIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  testTopContent: {
    flex: 1,
  },

  testBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 5,
  },

  testTypeBadge: {
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },

  testTypeText: {
    color: COLORS.orange,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  attemptedBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  attemptedText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '800',
  },

  testName: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },

  syllabusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 11,
    padding: 10,
    marginTop: 13,
  },

  testSyllabus: {
    flex: 1,
    color: COLORS.primaryDark,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  testInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 9,
    marginTop: 12,
  },

  testInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  testInfoIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  testInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },

  testInfoLabel: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: '700',
  },

  testInfoValue: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },

  testActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 13,
  },

  attemptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },

  attemptButtonGradient: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },

  attemptButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  resultButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },

  resultButtonText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 18,
  },

  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },

  loadingHeader: {
    height: 68,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  loadingTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 15,
  },

  loadingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },

  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  errorIcon: {
    width: 95,
    height: 95,
    borderRadius: 32,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 18,
  },

  errorDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 7,
  },

  goBackButton: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 19,
  },

  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});