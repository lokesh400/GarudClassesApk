import React, {
  useState,
  useEffect,
  useMemo,
} from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../auth/AuthContext';

import apiClient from '../../api/client';


/* ============================================================
   COLORS
============================================================ */

const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#21105D',
  primaryLight: '#F3E8FF',
  primarySoft: '#FAF8FF',

  background: '#FBFBFE',

  white: '#FFFFFF',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  border: '#E8E3F3',

  success: '#059669',
  successLight: '#ECFDF5',

  blue: '#2563EB',
  blueLight: '#EFF6FF',

  orange: '#F97316',
  orangeLight: '#FFF7ED',

  pink: '#DB2777',
  pinkLight: '#FDF2F8',

  error: '#DC2626',
  errorLight: '#FEF2F2',
};


/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  icon,
  label,
  value,
  iconColor = COLORS.primary,
  iconBackground = COLORS.primaryLight,
}) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailItem}>
      <View
        style={[
          styles.detailItemIcon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={iconColor}
        />
      </View>

      <View style={styles.detailItemContent}>
        <Text style={styles.detailItemLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailItemValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}


/* ============================================================
   TEST CARD
============================================================ */

function TestCard({
  test,
  index,
  running,
  onStart,
  onResult,
}) {
  const attempted = !!test?.attempted;

  const isRealMode =
    String(test?.mode || '').toLowerCase() ===
    'real';

  const canStart =
    !attempted || !isRealMode;

  const modeLabel =
    String(test?.mode || '').toLowerCase() ===
    'practice'
      ? 'Practice'
      : 'Exam';

  return (
    <View style={styles.testCard}>
      {/* =====================================================
          TOP
      ===================================================== */}

      <View style={styles.testTopRow}>
        <View style={styles.testNumberContainer}>
          <LinearGradient
            colors={[
              COLORS.primaryDark,
              COLORS.primary,
            ]}
            style={styles.testNumberGradient}
          >
            <Text style={styles.testNumberText}>
              {String(index + 1).padStart(2, '0')}
            </Text>
          </LinearGradient>
        </View>


        <View style={styles.testTitleContent}>
          <Text
            style={styles.testName}
            numberOfLines={2}
          >
            {test?.name ||
              test?.title ||
              `Test ${index + 1}`}
          </Text>

          <View style={styles.testMetaRow}>
            {!!test?.duration && (
              <View style={styles.testMetaItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={13}
                  color={COLORS.muted}
                />

                <Text style={styles.testMetaText}>
                  {test.duration} min
                </Text>
              </View>
            )}

            {!!test?.mode && (
              <View style={styles.testMetaItem}>
                <MaterialCommunityIcons
                  name={
                    modeLabel === 'Practice'
                      ? 'book-open-page-variant-outline'
                      : 'clipboard-text-outline'
                  }
                  size={13}
                  color={COLORS.muted}
                />

                <Text style={styles.testMetaText}>
                  {modeLabel}
                </Text>
              </View>
            )}
          </View>
        </View>


        <View
          style={[
            styles.statusBadge,

            attempted
              ? styles.completedBadge
              : styles.pendingBadge,
          ]}
        >
          <MaterialCommunityIcons
            name={
              attempted
                ? 'check-circle'
                : 'clock-outline'
            }
            size={13}
            color={
              attempted
                ? COLORS.success
                : COLORS.orange
            }
          />

          <Text
            style={[
              styles.statusBadgeText,

              {
                color: attempted
                  ? COLORS.success
                  : COLORS.orange,
              },
            ]}
          >
            {attempted ? 'DONE' : 'NEW'}
          </Text>
        </View>
      </View>


      {/* =====================================================
          DIVIDER
      ===================================================== */}

      <View style={styles.testDivider} />


      {/* =====================================================
          ACTION
      ===================================================== */}

      <View style={styles.testActionRow}>
        <View style={styles.testActionInfo}>
          <View
            style={[
              styles.testActionInfoIcon,

              {
                backgroundColor: attempted
                  ? COLORS.successLight
                  : COLORS.primaryLight,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                attempted
                  ? 'chart-box-outline'
                  : 'lightning-bolt-outline'
              }
              size={16}
              color={
                attempted
                  ? COLORS.success
                  : COLORS.primary
              }
            />
          </View>

          <Text style={styles.testActionInfoText}>
            {attempted
              ? 'Attempt completed'
              : 'Ready to attempt'}
          </Text>
        </View>


        <View style={styles.testActions}>
          {attempted && (
            <TouchableOpacity
              style={styles.resultButton}
              onPress={onResult}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="chart-line"
                size={16}
                color={COLORS.primary}
              />

              <Text style={styles.resultButtonText}>
                Result
              </Text>
            </TouchableOpacity>
          )}


          {canStart && (
            <TouchableOpacity
              style={[
                styles.startButton,

                running &&
                  styles.startButtonDisabled,
              ]}
              onPress={onStart}
              disabled={running}
              activeOpacity={0.85}
            >
              {running ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={
                      attempted
                        ? 'refresh'
                        : 'play'
                    }
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text style={styles.startButtonText}>
                    {attempted
                      ? 'Retry'
                      : 'Start'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}


/* ============================================================
   TEST SERIES DETAIL SCREEN
============================================================ */

export default function TestSeriesDetailScreen({
  route,
  navigation,
}) {
  const { item } = route.params;

  const { logout } = useAuth();

  const insets = useSafeAreaInsets();


  /* =========================================================
     STATE
  ========================================================= */

  const [detail, setDetail] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [publishedMap, setPublishedMap] =
    useState({});

  const [busyTestId, setBusyTestId] =
    useState('');


  /* =========================================================
     FETCH DETAILS
  ========================================================= */

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);

      setError('');

      try {
        const [
          detailRes,
          publishedRes,
        ] = await Promise.all([
          apiClient.get(
            `/test-series/published/${item._id}`
          ),

          apiClient.get('/tests/published'),
        ]);


        setDetail(detailRes.data);


        const nextMap = {};


        (publishedRes.data || []).forEach(
          test => {
            if (!test?._id) {
              return;
            }

            nextMap[String(test._id)] =
              test;
          }
        );


        setPublishedMap(nextMap);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();

          return;
        }


        console.error(
          'ERROR FETCHING TEST SERIES DETAIL:',
          e
        );


        setError(
          e.response?.data?.message ||
            'Could not load test series details.'
        );
      } finally {
        setLoading(false);
      }
    };


    fetchDetail();
  }, [item._id, logout]);


  /* =========================================================
     DATA
  ========================================================= */

  const data = detail ?? item;


  /* =========================================================
     TESTS
  ========================================================= */

  const tests = useMemo(() => {
    if (!Array.isArray(data?.tests)) {
      return [];
    }


    return data.tests
      .map((entry, index) => {
        if (!entry) {
          return null;
        }


        /* STRING TEST ID */

        if (typeof entry === 'string') {
          const info =
            publishedMap[entry] || {};


          return {
            _id: entry,

            name:
              info.name ||
              `Test ${index + 1}`,

            duration: info.duration,

            mode: info.mode,

            attempted: !!info.attempted,
          };
        }


        /* OBJECT TEST */

        const testId = String(
          entry._id || entry.id || ''
        );


        if (!testId) {
          return null;
        }


        const info =
          publishedMap[testId] || {};


        return {
          ...entry,

          _id: testId,

          name:
            entry.name ||
            info.name ||
            `Test ${index + 1}`,

          duration:
            entry.duration ??
            info.duration,

          mode:
            entry.mode || info.mode,

          attempted:
            typeof info.attempted ===
            'boolean'
              ? info.attempted
              : false,
        };
      })
      .filter(Boolean);
  }, [data?.tests, publishedMap]);


  /* =========================================================
     START TEST
  ========================================================= */

  const startTest = async test => {
    if (!test?._id || busyTestId) {
      return;
    }


    setBusyTestId(test._id);


    try {
      const res = await apiClient.post(
        `/tests/${test._id}/start`,
        {
          batchId: item._id,
        }
      );


      navigation.navigate('TestAttempt', {
        test: res.data.test,

        attempt: res.data.attempt,

        batchId: item._id,
      });
    } catch (e) {
      if (e.response?.status === 401) {
        logout();

        return;
      }


      const message =
        e.response?.data?.message ||
        'Could not start test.';


      if (
        e.response?.status === 400 &&
        message
          .toLowerCase()
          .includes('already submitted')
      ) {
        navigation.navigate('TestResult', {
          testId: test._id,
        });

        return;
      }


      Alert.alert(
        'Unable to start',
        message
      );
    } finally {
      setBusyTestId('');
    }
  };


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formattedDate = detail?.createdAt
    ? new Date(
        detail.createdAt
      ).toLocaleDateString('en-IN', {
        day: 'numeric',

        month: 'short',

        year: 'numeric',
      })
    : null;


  /* =========================================================
     UI
  ========================================================= */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />


      <View style={styles.root}>
        {/* ===================================================
            BACKGROUND
        =================================================== */}

        <View style={styles.topPurpleCircle} />

        <View style={styles.leftPurpleCircle} />


        {/* ===================================================
            HEADER
        =================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={23}
              color={COLORS.primaryDark}
            />
          </TouchableOpacity>


          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Test Series
            </Text>

            <Text style={styles.headerSubtitle}>
              Practice • Analyse • Improve
            </Text>
          </View>


          <View style={styles.headerLogoWrap}>
            <Image
              source={require(
                '../../../assets/icon.png'
              )}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <ScrollView
          contentContainerStyle={[
            styles.scroll,

            {
              paddingBottom: Math.max(
                insets.bottom + 90,
                110
              ),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              HERO
          ================================================= */}

          <View style={styles.heroCard}>
            {data?.image ? (
              <Image
                source={{
                  uri: data.image,
                }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[
                  COLORS.primaryDark,
                  COLORS.primary,
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={styles.heroPlaceholder}
              >
                <View
                  style={styles.heroPlaceholderCircleOne}
                />

                <View
                  style={styles.heroPlaceholderCircleTwo}
                />

                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={60}
                  color="#DDD6FE"
                />

                <Text
                  style={styles.heroPlaceholderTitle}
                >
                  Garud Tests
                </Text>

                <Text
                  style={styles.heroPlaceholderSubtitle}
                >
                  Prepare • Practice • Perform
                </Text>
              </LinearGradient>
            )}


            <LinearGradient
              colors={[
                'rgba(33,16,93,0)',
                'rgba(33,16,93,0.35)',
                'rgba(33,16,93,0.95)',
              ]}
              locations={[0, 0.45, 1]}
              style={styles.heroOverlay}
            />


            <View style={styles.heroTopBadge}>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={14}
                color="#FFFFFF"
              />

              <Text style={styles.heroTopBadgeText}>
                TEST SERIES
              </Text>
            </View>


            <View style={styles.heroActiveBadge}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={15}
                color="#A7F3D0"
              />

              <Text
                style={styles.heroActiveBadgeText}
              >
                ACTIVE
              </Text>
            </View>


            <View style={styles.heroContent}>
              <Text
                style={styles.heroTitle}
                numberOfLines={3}
              >
                {data?.name || 'Test Series'}
              </Text>


              <View style={styles.heroMeta}>
                <View style={styles.heroMetaItem}>
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={15}
                    color="#DDD6FE"
                  />

                  <Text
                    style={styles.heroMetaText}
                  >
                    {tests.length} Tests
                  </Text>
                </View>


                {!!data?.language && (
                  <>
                    <View
                      style={styles.heroMetaDot}
                    />

                    <View
                      style={styles.heroMetaItem}
                    >
                      <MaterialCommunityIcons
                        name="translate"
                        size={15}
                        color="#DDD6FE"
                      />

                      <Text
                        style={styles.heroMetaText}
                      >
                        {data.language}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <View style={styles.loadingCard}>
              <View
                style={styles.loadingIconContainer}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={27}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.loadingContent}>
                <Text style={styles.loadingTitle}>
                  Loading Details
                </Text>

                <Text style={styles.loadingText}>
                  Fetching tests and series information...
                </Text>
              </View>

              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />
            </View>
          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!!error && (
            <View style={styles.errorCard}>
              <View
                style={styles.errorIconContainer}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={22}
                  color={COLORS.error}
                />
              </View>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}


          {/* =================================================
              ABOUT
          ================================================= */}

          {!!data?.description && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View
                  style={styles.sectionIconContainer}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>

                <View>
                  <Text style={styles.sectionTitle}>
                    About This Series
                  </Text>

                  <Text
                    style={styles.sectionSubtitle}
                  >
                    Know your test series
                  </Text>
                </View>
              </View>


              <Text style={styles.description}>
                {data.description}
              </Text>
            </View>
          )}


          {/* =================================================
              SERIES DETAILS
          ================================================= */}

          {!loading && detail && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View
                  style={styles.sectionIconContainer}
                >
                  <MaterialCommunityIcons
                    name="view-grid-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>

                <View>
                  <Text style={styles.sectionTitle}>
                    Series Details
                  </Text>

                  <Text
                    style={styles.sectionSubtitle}
                  >
                    Important information
                  </Text>
                </View>
              </View>


              <View style={styles.detailsGrid}>
                <DetailItem
                  icon="book-open-page-variant-outline"
                  label="Subject"
                  value={detail.subject}
                  iconColor={COLORS.primary}
                  iconBackground={
                    COLORS.primaryLight
                  }
                />


                <DetailItem
                  icon="target"
                  label="Target Exam"
                  value={detail.targetExam}
                  iconColor={COLORS.orange}
                  iconBackground={
                    COLORS.orangeLight
                  }
                />


                <DetailItem
                  icon="clipboard-text-outline"
                  label="Total Tests"
                  value={
                    detail.totalTests
                      ? String(detail.totalTests)
                      : tests.length
                        ? String(tests.length)
                        : null
                  }
                  iconColor={COLORS.blue}
                  iconBackground={
                    COLORS.blueLight
                  }
                />


                <DetailItem
                  icon="calendar-clock-outline"
                  label="Validity"
                  value={detail.validity}
                  iconColor={COLORS.pink}
                  iconBackground={
                    COLORS.pinkLight
                  }
                />


                <DetailItem
                  icon="translate"
                  label="Medium"
                  value={detail.language}
                  iconColor={COLORS.success}
                  iconBackground={
                    COLORS.successLight
                  }
                />


                <DetailItem
                  icon="calendar-plus"
                  label="Added On"
                  value={formattedDate}
                  iconColor={COLORS.primary}
                  iconBackground={
                    COLORS.primaryLight
                  }
                />
              </View>
            </View>
          )}


          {/* =================================================
              TESTS
          ================================================= */}

          {!loading && tests.length > 0 && (
            <View style={styles.testsSection}>
              <View style={styles.testsSectionHeader}>
                <View>
                  <Text
                    style={styles.testsSectionTitle}
                  >
                    Available Tests
                  </Text>

                  <Text
                    style={
                      styles.testsSectionSubtitle
                    }
                  >
                    Select a test and start practicing
                  </Text>
                </View>


                <View style={styles.testCountBadge}>
                  <Text
                    style={styles.testCountValue}
                  >
                    {tests.length}
                  </Text>

                  <Text
                    style={styles.testCountLabel}
                  >
                    TESTS
                  </Text>
                </View>
              </View>


              {tests.map((test, index) => (
                <TestCard
                  key={test._id ?? index}
                  test={test}
                  index={index}
                  running={
                    busyTestId === test._id
                  }
                  onStart={() => startTest(test)}
                  onResult={() =>
                    navigation.navigate(
                      'TestResult',
                      {
                        testId: test._id,
                      }
                    )
                  }
                />
              ))}
            </View>
          )}


          {/* =================================================
              EMPTY TESTS
          ================================================= */}

          {!loading && !tests.length && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyDecoration} />

              <View
                style={styles.emptyIconContainer}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-clock-outline"
                  size={43}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Tests Coming Soon
              </Text>

              <Text style={styles.emptyText}>
                No tests are available in this
                series yet. New practice tests will
                appear here when published.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },


  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },


  /* =========================================================
     BACKGROUND
  ========================================================= */

  topPurpleCircle: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#EDE9FE',
    top: -170,
    right: -110,
    opacity: 0.7,
  },


  leftPurpleCircle: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DDD6FE',
    top: 650,
    left: -130,
    opacity: 0.25,
  },


  /* =========================================================
     HEADER
  ========================================================= */

  header: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },


  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEAFB',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },


  headerContent: {
    flex: 1,
    marginLeft: 14,
  },


  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },


  headerSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },


  headerLogoWrap: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },


  headerLogo: {
    width: 34,
    height: 34,
  },


  /* =========================================================
     SCROLL
  ========================================================= */

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },


  /* =========================================================
     HERO
  ========================================================= */

  heroCard: {
    height: 245,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },


  heroImage: {
    width: '100%',
    height: '100%',
  },


  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },


  heroPlaceholderCircleOne: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#8B5CF6',
    top: -105,
    right: -55,
    opacity: 0.55,
  },


  heroPlaceholderCircleTwo: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: '#A78BFA',
    bottom: -90,
    left: -35,
    opacity: 0.28,
  },


  heroPlaceholderTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },


  heroPlaceholderSubtitle: {
    marginTop: 4,
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '600',
  },


  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },


  heroTopBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    height: 31,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  heroTopBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },


  heroActiveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    height: 31,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor:
      'rgba(17,24,39,0.68)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  heroActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },


  heroContent: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },


  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -0.5,
  },


  heroMeta: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },


  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  heroMetaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },


  heroMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C4B5FD',
    marginHorizontal: 10,
  },


  /* =========================================================
     SECTION
  ========================================================= */

  sectionCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },


  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  sectionIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },


  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },


  sectionSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '600',
  },


  description: {
    marginTop: 15,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
  },


  /* =========================================================
     DETAILS
  ========================================================= */

  detailsGrid: {
    marginTop: 17,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },


  detailItem: {
    width: '48.5%',
    minHeight: 74,
    marginBottom: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#F0ECF8',
    flexDirection: 'row',
    alignItems: 'center',
  },


  detailItemIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },


  detailItemContent: {
    flex: 1,
  },


  detailItemLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '700',
  },


  detailItemValue: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
  },


  /* =========================================================
     TEST SECTION
  ========================================================= */

  testsSection: {
    marginTop: 25,
  },


  testsSectionHeader: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  testsSectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },


  testsSectionSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '500',
  },


  testCountBadge: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  testCountValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },


  testCountLabel: {
    marginTop: 1,
    color: COLORS.primary,
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.7,
  },


  /* =========================================================
     TEST CARD
  ========================================================= */

  testCard: {
    marginBottom: 13,
    padding: 15,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.055,
    shadowRadius: 13,
    elevation: 3,
  },


  testTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  testNumberContainer: {
    width: 49,
    height: 49,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 11,
  },


  testNumberGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },


  testNumberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },


  testTitleContent: {
    flex: 1,
  },


  testName: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },


  testMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },


  testMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },


  testMetaText: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '600',
  },


  statusBadge: {
    minHeight: 28,
    paddingHorizontal: 8,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 7,
  },


  completedBadge: {
    backgroundColor: COLORS.successLight,
  },


  pendingBadge: {
    backgroundColor: COLORS.orangeLight,
  },


  statusBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },


  testDivider: {
    height: 1,
    backgroundColor: '#F1EDF8',
    marginVertical: 13,
  },


  testActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  testActionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },


  testActionInfoIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },


  testActionInfoText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
  },


  testActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },


  resultButton: {
    height: 39,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },


  resultButtonText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
  },


  startButton: {
    minWidth: 78,
    height: 39,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },


  startButtonDisabled: {
    opacity: 0.65,
  },


  startButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },


  /* =========================================================
     LOADING
  ========================================================= */

  loadingCard: {
    minHeight: 78,
    marginTop: 18,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },


  loadingIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  loadingContent: {
    flex: 1,
    marginLeft: 11,
  },


  loadingTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
  },


  loadingText: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '500',
  },


  /* =========================================================
     ERROR
  ========================================================= */

  errorCard: {
    minHeight: 70,
    marginTop: 18,
    padding: 14,
    borderRadius: 19,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
  },


  errorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },


  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700',
  },


  /* =========================================================
     EMPTY
  ========================================================= */

  emptyCard: {
    minHeight: 330,
    marginTop: 20,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    overflow: 'hidden',
  },


  emptyDecoration: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.8,
  },


  emptyIconContainer: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },


  emptyTitle: {
    marginTop: 22,
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },


  emptyText: {
    maxWidth: 275,
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
});