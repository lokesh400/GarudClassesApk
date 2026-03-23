import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Linking, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

// Use fallback image for all courses
const COURSE_IMAGE = require('../../../assets/icon.png');

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const SCREEN_PADDING = 16;
const CARD_WIDTH = (width - SCREEN_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = 232;

const COURSE_COLORS = [
  { shell: '#E0F2FE', edge: '#BFDBFE', tag: '#0EA5E9' },
  { shell: '#F0FDF4', edge: '#BBF7D0', tag: '#16A34A' },
  { shell: '#FEFCE8', edge: '#FDE68A', tag: '#CA8A04' },
  { shell: '#FFF1F2', edge: '#FECDD3', tag: '#E11D48' },
];

export default function OttHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [myVisibleCount, setMyVisibleCount] = useState(4);
  const [exploreVisibleCount, setExploreVisibleCount] = useState(4);
  const [failedImageByCourseId, setFailedImageByCourseId] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [myRes, exploreRes] = await Promise.all([
        apiClient.get('/ott/my-courses'),
        apiClient.get('/ott/explore-courses'),
      ]);
      // Map course data and attach display tokens used by the premium card theme.
      const myCoursesMapped = myRes.data.map((purchase, idx) => ({
        ...purchase.course,
        purchaseId: purchase.purchaseId,
        purchasedAt: purchase.purchasedAt,
        amount: purchase.amount,
        method: purchase.method,
        status: purchase.status,
        palette: COURSE_COLORS[idx % COURSE_COLORS.length],
      }));
      const exploreCoursesMapped = exploreRes.data.map((course, idx) => ({
        ...course,
        palette: COURSE_COLORS[idx % COURSE_COLORS.length],
      }));
      setMyCourses(myCoursesMapped);
      setExploreCourses(exploreCoursesMapped);
    } catch (err) {
      Alert.alert('Error', 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const purchasedCourseIds = useMemo(
    () => new Set(myCourses.map((item) => String(item?._id || item?.id || ''))),
    [myCourses]
  );

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  useEffect(() => {
    setMyVisibleCount(4);
    setExploreVisibleCount(4);
  }, [normalizedQuery]);

  const myFilteredCourses = useMemo(() => {
    if (!normalizedQuery) return myCourses;
    return myCourses.filter((course) =>
      String(course?.name || '').toLowerCase().includes(normalizedQuery)
    );
  }, [myCourses, normalizedQuery]);

  const exploreFilteredCourses = useMemo(() => {
    if (!normalizedQuery) return exploreCourses;
    return exploreCourses.filter((course) =>
      String(course?.name || '').toLowerCase().includes(normalizedQuery)
    );
  }, [exploreCourses, normalizedQuery]);

  const myVisibleCourses = useMemo(
    () => myFilteredCourses.slice(0, myVisibleCount),
    [myFilteredCourses, myVisibleCount]
  );

  const exploreVisibleCourses = useMemo(
    () => exploreFilteredCourses.slice(0, exploreVisibleCount),
    [exploreFilteredCourses, exploreVisibleCount]
  );

  const formatRupees = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 'Price on website';
    return `Rs. ${n}`;
  };

  const resolveCoursePrice = (course) => (
    course?.price ?? course?.amount ?? course?.coursePrice ?? course?.mrp ?? course?.cost
  );

  const resolveBuyLink = (course) => {
    const raw =
      course?.buyLink ||
      course?.websiteUrl ||
      course?.purchaseUrl ||
      course?.checkoutUrl ||
      course?.link ||
      '';
    return String(raw).trim();
  };

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

    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;

    const baseUrl = String(apiClient?.defaults?.baseURL || '').trim();
    if (!baseUrl) return raw;
    const origin = baseUrl.replace(/\/api\/?$/, '');

    if (raw.startsWith('/')) return `${origin}${raw}`;
    return `${origin}/${raw}`;
  };

  const handleOpenCourse = (course, purchased) => {
    const courseId = String(course?._id || course?.id || '');
    if (!courseId) return;

    if (!purchased) {
      Alert.alert('Purchase Required', 'Please buy this course from website to access lessons.');
      return;
    }

    navigation.navigate('OttCourseDetail', { courseId, purchased: true });
  };

  const handleBuyOnWebsite = async (course) => {
    const buyLink = resolveBuyLink(course);
    if (!buyLink) {
      Alert.alert('Link Not Available', 'Buy link is not available for this course right now.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(buyLink);
      if (!supported) {
        Alert.alert('Invalid Link', 'Cannot open the website link for this course.');
        return;
      }
      await Linking.openURL(buyLink);
    } catch (err) {
      Alert.alert('Error', 'Failed to open website link.');
    }
  };

  const onCourseImageError = (courseId) => {
    setFailedImageByCourseId((prev) => ({
      ...prev,
      [courseId]: true,
    }));
  };

  const renderCard = (item, index, sectionKey) => {
    const courseId = String(item?._id || item?.id || '');
    const isPurchased = purchasedCourseIds.has(courseId);
    const lessonCount =
      Array.isArray(item?.lectures) ? item.lectures.length :
      Array.isArray(item?.videolist) ? item.videolist.length :
      0;
    const priceLabel = formatRupees(resolveCoursePrice(item));
    const imageUri = resolveCourseImageUri(item);
    const useFallbackImage = !imageUri || !!failedImageByCourseId[courseId];
    const imageSource = useFallbackImage ? COURSE_IMAGE : { uri: imageUri };
    const cardKey = `${sectionKey}-${courseId || index}`;

    return (
      <View
        key={cardKey}
        style={[
          styles.card,
          {
            backgroundColor: item.palette?.shell || '#F8FAFC',
            borderColor: item.palette?.edge || '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardTouchable}
          onPress={() => handleOpenCourse(item, isPurchased)}
        >
          <View style={styles.cardBadgeRow}>
            <View style={[styles.premiumTag, { backgroundColor: item.palette?.tag || '#1D4ED8' }]}>
              <Text style={styles.premiumTagText}>{isPurchased ? 'MY COURSE' : 'EXPLORE'}</Text>
            </View>
            <MaterialCommunityIcons name={isPurchased ? 'play-circle' : 'cart-outline'} size={20} color="#0F172A" />
          </View>

          <Image
            source={imageSource}
            style={styles.cardImageSmall}
            resizeMode="cover"
            onError={() => onCourseImageError(courseId)}
          />

          <Text style={styles.cardTitleSmall} numberOfLines={2}>{item.name || 'Course'}</Text>

          <View style={styles.cardFooterRow}>
            {isPurchased ? (
              <>
                <Text style={styles.footerLabel}>{lessonCount} lessons</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#334155" />
              </>
            ) : (
              <View style={styles.purchaseWrap}>
                <Text style={styles.priceText}>{priceLabel}</Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.buyButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleBuyOnWebsite(item);
                  }}
                >
                  <Text style={styles.buyButtonText}>Buy On Website</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const purchasedCount = myCourses.length;
  const exploreCount = exploreCourses.length;
  const hasAnyFilteredResults = myFilteredCourses.length > 0 || exploreFilteredCourses.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader
        title="GC OTT"
        navigation={navigation}
        showBack={true}
        right={
          <Image
            source={COURSE_IMAGE}
            style={{ width: 32, height: 32, borderRadius: 8, marginRight: 2 }}
          />
        }
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroWrap}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.heroTitle}>Welcome To Premium Learning</Text>
            <Text style={styles.heroSubTitle}>Learn daily with cinematic-quality lectures and structured modules.</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillNumber}>{purchasedCount}</Text>
                <Text style={styles.heroPillLabel}>Purchased</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillNumber}>{exploreCount}</Text>
                <Text style={styles.heroPillLabel}>Explore</Text>
              </View>
            </View>

            <View style={styles.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search courses..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {searchQuery.trim().length > 0 && (
              <Text style={styles.searchMetaText}>
                {hasAnyFilteredResults
                  ? `Showing results for "${searchQuery.trim()}"`
                  : `No courses found for "${searchQuery.trim()}"`}
              </Text>
            )}
          </View>

          <View style={styles.sectionHeadRow}>
            <Text style={styles.heading}>My Purchased Courses</Text>
            <Text style={styles.sectionHint}>Continue learning</Text>
          </View>

          {myFilteredCourses.length === 0 ? (
            <Text style={styles.emptyText}>
              {normalizedQuery ? 'No purchased course matches your search.' : 'You have not purchased any courses yet.'}
            </Text>
          ) : (
            <>
              <View style={styles.gridWrap}>
                {myVisibleCourses.map((item, index) => renderCard(item, index, 'my'))}
              </View>

              {myVisibleCount < myFilteredCourses.length && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setMyVisibleCount((prev) => prev + 4)}
                >
                  <Text style={styles.showMoreText}>Show More</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={styles.sectionHeadRow}>
            <Text style={styles.heading}>Explore Courses</Text>
            <Text style={styles.sectionHint}>Find your next track</Text>
          </View>

          {exploreFilteredCourses.length === 0 ? (
            <Text style={styles.emptyText}>
              {normalizedQuery ? 'No explore course matches your search.' : 'No explore courses available right now.'}
            </Text>
          ) : (
            <>
              <View style={styles.gridWrap}>
                {exploreVisibleCourses.map((item, index) => renderCard(item, index, 'explore'))}
              </View>

              {exploreVisibleCount < exploreFilteredCourses.length && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setExploreVisibleCount((prev) => prev + 4)}
                >
                  <Text style={styles.showMoreText}>Show More</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  heroWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  greeting: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 31,
  },
  heroSubTitle: {
    marginTop: 6,
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  heroStatsRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  searchWrap: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 10,
  },
  searchMetaText: {
    marginTop: 8,
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  heroPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginRight: 8,
    minWidth: 96,
  },
  heroPillNumber: {
    color: '#1D4ED8',
    fontSize: 17,
    fontWeight: '800',
  },
  heroPillLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionHeadRow: {
    marginTop: 8,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    marginLeft: 16,
    marginBottom: 18,
  },
  gridWrap: {
    marginHorizontal: SCREEN_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    marginBottom: GRID_GAP,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  cardTouchable: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '100%',
    height: '100%',
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumTag: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  premiumTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardImageSmall: {
    width: '100%',
    height: 88,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  cardTitleSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 18,
    minHeight: 36,
  },
  cardFooterRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
  },
  purchaseWrap: {
    width: '100%',
  },
  priceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 5,
  },
  buyButton: {
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  showMoreButton: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
  },
  showMoreText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
});
