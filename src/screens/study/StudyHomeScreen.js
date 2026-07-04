import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  StatusBar,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import apiClient from '../../api/client';

const COURSE_IMAGE = require('../../../assets/icon.png');

const { width } = Dimensions.get('window');

const SCREEN_PADDING = 15;
const GRID_GAP = 12;

const CARD_WIDTH =
  (width - SCREEN_PADDING * 2 - GRID_GAP) / 2;

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

  blue: '#0284C7',
  blueLight: '#E0F2FE',

  pink: '#DB2777',
  pinkLight: '#FCE7F3',
};

const COURSE_PALETTES = [
  {
    light: '#F5F3FF',
    medium: '#EDE9FE',
    accent: '#6D28D9',
    gradient: ['#6D28D9', '#8B5CF6'],
  },
  {
    light: '#EFF6FF',
    medium: '#DBEAFE',
    accent: '#2563EB',
    gradient: ['#2563EB', '#3B82F6'],
  },
  {
    light: '#FFF7ED',
    medium: '#FFEDD5',
    accent: '#EA580C',
    gradient: ['#EA580C', '#F97316'],
  },
  {
    light: '#FDF2F8',
    medium: '#FCE7F3',
    accent: '#DB2777',
    gradient: ['#DB2777', '#EC4899'],
  },
];

export default function StudyHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [myCourses, setMyCourses] = useState([]);

  const [myVisibleCount, setMyVisibleCount] = useState(4);

  const [
    failedImageByCourseId,
    setFailedImageByCourseId,
  ] = useState({});

  const [searchQuery, setSearchQuery] = useState('');

  const fetchCourses = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setLoading(true);
      }

      try {
        const myRes = await apiClient.get(
          '/study/my-courses'
        );

        const purchases = Array.isArray(myRes.data)
          ? myRes.data
          : [];

        const myCoursesMapped = purchases
          .filter((purchase) => purchase?.course)
          .map((purchase, index) => ({
            ...purchase.course,

            purchaseId: purchase.purchaseId,
            purchasedAt: purchase.purchasedAt,
            amount: purchase.amount,
            method: purchase.method,
            status: purchase.status,

            palette:
              COURSE_PALETTES[
                index % COURSE_PALETTES.length
              ],
          }));

        setMyCourses(myCoursesMapped);
      } catch (err) {
        console.log('Course loading error:', err);

        Alert.alert(
          'Unable to Load Courses',
          'We could not load your courses. Please try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses])
  );

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  useEffect(() => {
    setMyVisibleCount(4);
  }, [normalizedQuery]);

  const myFilteredCourses = useMemo(() => {
    if (!normalizedQuery) {
      return myCourses;
    }

    return myCourses.filter((course) => {
      const name = String(
        course?.name || ''
      ).toLowerCase();

      const description = String(
        course?.description || ''
      ).toLowerCase();

      return (
        name.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    });
  }, [myCourses, normalizedQuery]);

  const myVisibleCourses = useMemo(
    () =>
      myFilteredCourses.slice(
        0,
        myVisibleCount
      ),
    [myFilteredCourses, myVisibleCount]
  );

  const resolveCourseImageUri = (course) => {
    const raw = String(
      course?.image ||
        course?.imageUrl ||
        course?.thumbnail ||
        course?.thumbnailUrl ||
        course?.poster ||
        course?.coverImage ||
        ''
    ).trim();

    if (!raw) {
      return '';
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    const baseUrl = String(
      apiClient?.defaults?.baseURL || ''
    ).trim();

    if (!baseUrl) {
      return raw;
    }

    const origin = baseUrl.replace(
      /\/api\/?$/,
      ''
    );

    if (raw.startsWith('/')) {
      return `${origin}${raw}`;
    }

    return `${origin}/${raw}`;
  };

  const handleOpenCourse = (course) => {
    const courseId = String(
      course?._id || course?.id || ''
    );

    if (!courseId) {
      return;
    }

    navigation.navigate('StudyCourseDetail', {
      courseId,
      purchased: true,
    });
  };

  const onCourseImageError = (courseId) => {
    setFailedImageByCourseId((previous) => ({
      ...previous,
      [courseId]: true,
    }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses(true);
  };

  const renderCourseCard = (item, index) => {
    const courseId = String(
      item?._id || item?.id || ''
    );

    const palette =
      item?.palette ||
      COURSE_PALETTES[
        index % COURSE_PALETTES.length
      ];

    const lessonCount = Array.isArray(item?.lectures)
      ? item.lectures.length
      : Array.isArray(item?.videolist)
      ? item.videolist.length
      : 0;

    const imageUri = resolveCourseImageUri(item);

    const useFallbackImage =
      !imageUri ||
      !!failedImageByCourseId[courseId];

    const imageSource = useFallbackImage
      ? COURSE_IMAGE
      : {
          uri: imageUri,
        };

    return (
      <TouchableOpacity
        key={courseId || String(index)}
        style={styles.courseCard}
        activeOpacity={0.86}
        onPress={() => handleOpenCourse(item)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.courseImage}
            resizeMode="cover"
            onError={() =>
              onCourseImageError(courseId)
            }
          />

          <LinearGradient
            colors={[
              'transparent',
              'rgba(0,0,0,0.65)',
            ]}
            style={styles.imageOverlay}
          />

          <View
            style={[
              styles.courseBadge,
              {
                backgroundColor: palette.accent,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-decagram"
              size={11}
              color="#FFFFFF"
            />

            <Text style={styles.courseBadgeText}>
              MY COURSE
            </Text>
          </View>

          <View style={styles.playButton}>
            <MaterialCommunityIcons
              name="play"
              size={20}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.lessonOverlay}>
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={13}
              color="#FFFFFF"
            />

            <Text style={styles.lessonOverlayText}>
              {lessonCount} Lessons
            </Text>
          </View>
        </View>

        <View style={styles.courseBody}>
          <Text
            style={styles.courseTitle}
            numberOfLines={2}
          >
            {item?.name || 'Course'}
          </Text>

          {!!item?.description && (
            <Text
              style={styles.courseDescription}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View style={styles.courseFooter}>
            <View
              style={[
                styles.continueBadge,
                {
                  backgroundColor: palette.light,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={13}
                color={palette.accent}
              />

              <Text
                style={[
                  styles.continueText,
                  {
                    color: palette.accent,
                  },
                ]}
              >
                Continue
              </Text>
            </View>

            <View
              style={[
                styles.arrowButton,
                {
                  backgroundColor: palette.accent,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color="#FFFFFF"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIcon}>
              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />

            <Text style={styles.loadingTitle}>
              Loading your courses...
            </Text>

            <Text style={styles.loadingSubtitle}>
              Preparing your learning space
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
            contentContainerStyle={
              styles.scrollContent
            }
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
                  onPress={() =>
                    navigation.goBack()
                  }
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={23}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>
                    My Learning
                  </Text>

                  <Text
                    style={styles.headerSubtitle}
                  >
                    Continue your learning journey
                  </Text>
                </View>

                <View style={styles.logoWrap}>
                  <Image
                    source={COURSE_IMAGE}
                    style={styles.logo}
                  />
                </View>
              </View>

              <View style={styles.heroContent}>
                <View style={styles.heroTextContent}>
                  <Text style={styles.heroLabel}>
                    YOUR COURSES
                  </Text>

                  <Text style={styles.heroTitle}>
                    Keep Learning,
                    {'\n'}
                    Keep Growing
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    Pick up exactly where you left off
                  </Text>
                </View>

                <View style={styles.courseCountCard}>
                  <MaterialCommunityIcons
                    name="school-outline"
                    size={29}
                    color="#FFFFFF"
                  />

                  <Text style={styles.courseCount}>
                    {myCourses.length}
                  </Text>

                  <Text style={styles.courseCountLabel}>
                    Courses
                  </Text>
                </View>
              </View>

              <View style={styles.searchWrap}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={21}
                  color={COLORS.textSecondary}
                />

                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search your courses..."
                  placeholderTextColor={
                    COLORS.textMuted
                  }
                  style={styles.searchInput}
                  returnKeyType="search"
                />

                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setSearchQuery('')
                    }
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={19}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>

            <View style={styles.content}>
              {normalizedQuery ? (
                <View style={styles.searchResultWrap}>
                  <MaterialCommunityIcons
                    name={
                      myFilteredCourses.length > 0
                        ? 'magnify'
                        : 'book-search-outline'
                    }
                    size={17}
                    color={COLORS.primary}
                  />

                  <Text style={styles.searchResultText}>
                    {myFilteredCourses.length > 0
                      ? `${myFilteredCourses.length} course${
                          myFilteredCourses.length === 1
                            ? ''
                            : 's'
                        } found for "${searchQuery.trim()}"`
                      : `No courses found for "${searchQuery.trim()}"`}
                  </Text>
                </View>
              ) : null}

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    My Courses
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Continue from where you left off
                  </Text>
                </View>

                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>
                    {myFilteredCourses.length}
                  </Text>
                </View>
              </View>

              {myFilteredCourses.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconWrap}>
                    <MaterialCommunityIcons
                      name={
                        normalizedQuery
                          ? 'book-search-outline'
                          : 'book-open-blank-variant-outline'
                      }
                      size={48}
                      color={COLORS.primary}
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    {normalizedQuery
                      ? 'No Courses Found'
                      : 'No Courses Yet'}
                  </Text>

                  <Text style={styles.emptySubtitle}>
                    {normalizedQuery
                      ? 'Try searching with a different course name.'
                      : 'Your purchased courses will appear here.'}
                  </Text>

                  {normalizedQuery ? (
                    <TouchableOpacity
                      style={styles.clearSearchButton}
                      activeOpacity={0.8}
                      onPress={() =>
                        setSearchQuery('')
                      }
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={17}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.clearSearchButtonText
                        }
                      >
                        Clear Search
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <>
                  <View style={styles.grid}>
                    {myVisibleCourses.map(
                      (item, index) =>
                        renderCourseCard(
                          item,
                          index
                        )
                    )}
                  </View>

                  {myVisibleCount <
                    myFilteredCourses.length && (
                    <TouchableOpacity
                      style={styles.showMoreButton}
                      activeOpacity={0.84}
                      onPress={() =>
                        setMyVisibleCount(
                          (previous) =>
                            previous + 4
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={19}
                        color={COLORS.primary}
                      />

                      <Text style={styles.showMoreText}>
                        Show More Courses
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  loadingIcon: {
    width: 85,
    height: 85,
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

  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 110,
  },

  hero: {
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  header: {
    minHeight: 68,
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

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },

  logoWrap: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 4,
  },

  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },

  heroTextContent: {
    flex: 1,
  },

  heroLabel: {
    color: '#DDD6FE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 5,
  },

  heroSubtitle: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 7,
  },

  courseCountCard: {
    width: 86,
    minHeight: 105,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  courseCount: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 4,
  },

  courseCountLabel: {
    color: '#DDD6FE',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },

  searchWrap: {
    minHeight: 51,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,

    shadowColor: '#2E1065',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 12,
  },

  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
  },

  searchResultWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 17,
  },

  searchResultText: {
    flex: 1,
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    marginTop: 3,
  },

  sectionCount: {
    minWidth: 39,
    height: 39,
    borderRadius: 13,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionCountText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  courseCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: GRID_GAP,

    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  imageContainer: {
    height: 118,
    position: 'relative',
    backgroundColor: COLORS.primaryLight,
  },

  courseImage: {
    width: '100%',
    height: '100%',
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  courseBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    minHeight: 23,
    borderRadius: 7,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  courseBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  playButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 33,
    height: 33,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  lessonOverlay: {
    position: 'absolute',
    left: 9,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  lessonOverlayText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },

  courseBody: {
    padding: 11,
  },

  courseTitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    minHeight: 36,
  },

  courseDescription: {
    color: COLORS.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '600',
    marginTop: 4,
    minHeight: 28,
  },

  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 11,
  },

  continueBadge: {
    minHeight: 31,
    borderRadius: 9,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  continueText: {
    fontSize: 9,
    fontWeight: '900',
  },

  arrowButton: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  showMoreButton: {
    alignSelf: 'center',
    minHeight: 45,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
    marginBottom: 15,
  },

  showMoreText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 45,
    paddingHorizontal: 20,
  },

  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 34,
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

  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },

  clearSearchButton: {
    minHeight: 43,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
  },

  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});