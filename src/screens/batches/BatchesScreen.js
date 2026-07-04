import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Keyboard,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

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
   FORMAT PRICE
============================================================ */

function formatPrice(price) {
  const value = Number(price || 0);

  if (value === 0) {
    return 'FREE';
  }

  return `₹${value.toLocaleString('en-IN')}`;
}


/* ============================================================
   ITEM CARD
============================================================ */

function ExploreCard({
  item,
  onPress,
}) {
  const isCourse = item._type === 'course';

  const isFree =
    Number(item?.price || 0) === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* =====================================================
          IMAGE
      ===================================================== */}

      <View style={styles.cardImageContainer}>
        {item?.image ? (
          <Image
            source={{
              uri: item.image,
            }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <View
              style={
                styles.placeholderCircleOne
              }
            />

            <View
              style={
                styles.placeholderCircleTwo
              }
            />

            <MaterialCommunityIcons
              name={
                isCourse
                  ? 'school-outline'
                  : 'clipboard-text-outline'
              }
              size={54}
              color="#DDD6FE"
            />

            <Text
              style={styles.placeholderTitle}
            >
              Garud Classes
            </Text>
          </View>
        )}


        {/* IMAGE OVERLAY */}

        <View style={styles.imageOverlay} />


        {/* TYPE BADGE */}

        <View
          style={[
            styles.typeBadge,

            !isCourse &&
              styles.testTypeBadge,
          ]}
        >
          <MaterialCommunityIcons
            name={
              isCourse
                ? 'crown-outline'
                : 'clipboard-check-outline'
            }
            size={13}
            color="#FFFFFF"
          />

          <Text style={styles.typeBadgeText}>
            {isCourse
              ? 'PREMIUM BATCH'
              : 'TEST SERIES'}
          </Text>
        </View>


        {/* VERIFIED BADGE */}

        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons
            name="check-decagram"
            size={15}
            color="#FFFFFF"
          />

          <Text
            style={styles.verifiedBadgeText}
          >
            VERIFIED
          </Text>
        </View>


        {/* IMAGE BOTTOM INFO */}

        <View style={styles.imageBottomInfo}>
          <View style={styles.imageBrandRow}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={14}
              color="#DDD6FE"
            />

            <Text
              style={styles.imageBrandText}
            >
              GARUD CLASSES
            </Text>
          </View>
        </View>
      </View>


      {/* =====================================================
          CARD BODY
      ===================================================== */}

      <View style={styles.cardBody}>
        <Text
          style={styles.batchName}
          numberOfLines={2}
        >
          {item?.name || 'Untitled'}
        </Text>


        {!!item?.description && (
          <Text
            style={styles.batchDescription}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}


        {/* FEATURES */}

        <View style={styles.quickFeatures}>
          <View style={styles.quickFeature}>
            <View
              style={[
                styles.quickFeatureIcon,
                {
                  backgroundColor:
                    COLORS.primaryLight,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  isCourse
                    ? 'play-circle-outline'
                    : 'timer-outline'
                }
                size={15}
                color={COLORS.primary}
              />
            </View>

            <Text
              style={styles.quickFeatureText}
            >
              {isCourse
                ? 'Classes'
                : 'Exam Mode'}
            </Text>
          </View>


          <View style={styles.quickFeature}>
            <View
              style={[
                styles.quickFeatureIcon,
                {
                  backgroundColor:
                    COLORS.blueLight,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  isCourse
                    ? 'file-document-outline'
                    : 'chart-line'
                }
                size={15}
                color={COLORS.blue}
              />
            </View>

            <Text
              style={styles.quickFeatureText}
            >
              {isCourse
                ? 'Material'
                : 'Analysis'}
            </Text>
          </View>


          <View style={styles.quickFeature}>
            <View
              style={[
                styles.quickFeatureIcon,
                {
                  backgroundColor:
                    COLORS.successLight,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="lightning-bolt-outline"
                size={15}
                color={COLORS.success}
              />
            </View>

            <Text
              style={styles.quickFeatureText}
            >
              Instant
            </Text>
          </View>
        </View>


        {/* DIVIDER */}

        <View style={styles.cardDivider} />


        {/* PRICE */}

        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>
              {isFree
                ? 'ACCESS PRICE'
                : 'START LEARNING AT'}
            </Text>

            <Text
              style={[
                styles.priceText,

                isFree &&
                  styles.freePriceText,
              ]}
            >
              {formatPrice(item?.price)}
            </Text>
          </View>


          <View
            style={[
              styles.exploreButton,

              isFree &&
                styles.freeExploreButton,
            ]}
          >
            <Text
              style={styles.exploreButtonText}
            >
              {isFree
                ? 'Explore'
                : 'View Batch'}
            </Text>

            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}


/* ============================================================
   BATCHES SCREEN
============================================================ */

export default function BatchesScreen({
  navigation,
}) {
  const { logout } = useAuth();

  const insets = useSafeAreaInsets();


  /* =========================================================
     STATE
  ========================================================= */

  const [allItems, setAllItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [selectedFilter, setSelectedFilter] =
    useState('all');


  /* =========================================================
     FETCH DATA
  ========================================================= */

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setLoading(true);
      }

      setError('');

      try {
        const [
          pubCoursesRes,
          pubTestsRes,
          myCoursesRes,
          myTestsRes,
        ] = await Promise.all([
          apiClient.get(
            '/courses/published?minimal=true'
          ),

          apiClient.get(
            '/test-series/published'
          ),

          apiClient.get(
            '/study/my-courses'
          ),

          apiClient.get(
            '/test-series/my-purchase'
          ),
        ]);


        /* ===============================================
           PURCHASED COURSE IDS
        =============================================== */

        const purchasedCourseIds =
          new Set(
            (
              myCoursesRes.data || []
            )
              .map(
                course =>
                  course.course?._id ||
                  course._id
              )
              .filter(Boolean)
          );


        /* ===============================================
           PURCHASED TEST IDS
        =============================================== */

        const purchasedTestIds =
          new Set(
            (
              myTestsRes.data || []
            )
              .map(test => test._id)
              .filter(Boolean)
          );


        /* ===============================================
           UNPURCHASED COURSES
        =============================================== */

        const unpurchasedCourses = (
          pubCoursesRes.data || []
        )
          .filter(
            course =>
              !purchasedCourseIds.has(
                course._id
              )
          )
          .map(course => ({
            ...course,

            _type: 'course',
          }));


        /* ===============================================
           UNPURCHASED TESTS
        =============================================== */

        const unpurchasedTests = (
          pubTestsRes.data || []
        )
          .filter(
            test =>
              !purchasedTestIds.has(
                test._id
              )
          )
          .map(test => ({
            ...test,

            _type: 'test-series',
          }));


        setAllItems([
          ...unpurchasedCourses,

          ...unpurchasedTests,
        ]);
      } catch (e) {
        console.error(
          'ERROR FETCHING EXPLORE ITEMS:',
          e
        );

        if (e.response?.status === 401) {
          logout();

          return;
        }

        setError(
          e.response?.data?.message ||
            'Failed to load learning content. Please try again.'
        );
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [logout]
  );


  /* =========================================================
     INITIAL FETCH
  ========================================================= */

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  /* =========================================================
     REFRESH
  ========================================================= */

  const onRefresh = () => {
    setRefreshing(true);

    fetchData(true);
  };


  /* =========================================================
     FILTERED ITEMS
  ========================================================= */

  const filteredItems = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return allItems.filter(item => {
      /* TYPE FILTER */

      if (
        selectedFilter === 'courses' &&
        item._type !== 'course'
      ) {
        return false;
      }

      if (
        selectedFilter === 'tests' &&
        item._type !== 'test-series'
      ) {
        return false;
      }


      /* SEARCH */

      if (!query) {
        return true;
      }

      const name = String(
        item?.name || ''
      ).toLowerCase();

      const description = String(
        item?.description || ''
      ).toLowerCase();

      return (
        name.includes(query) ||
        description.includes(query)
      );
    });
  }, [
    allItems,
    searchQuery,
    selectedFilter,
  ]);


  /* =========================================================
     COUNTS
  ========================================================= */

  const courseCount = allItems.filter(
    item => item._type === 'course'
  ).length;

  const testCount = allItems.filter(
    item => item._type === 'test-series'
  ).length;


  /* =========================================================
     OPEN ITEM
  ========================================================= */

  const openItem = item => {
    const isCourse =
      item._type === 'course';

    Keyboard.dismiss();

    navigation.navigate(
      'PurchasePreview',
      {
        item,

        type: isCourse
          ? 'course'
          : 'test-series',
      }
    );
  };


  /* =========================================================
     HEADER
  ========================================================= */

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={23}
            color={COLORS.primaryDark}
          />
        </TouchableOpacity>

        <View
          style={styles.headerTitleContainer}
        >
          <Text style={styles.headerTitle}>
            Explore
          </Text>

          <Text style={styles.headerSubtitle}>
            Discover your next batch
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
    );
  };


  /* =========================================================
     FILTER BUTTON
  ========================================================= */

  const FilterButton = ({
    id,
    label,
    icon,
    count,
  }) => {
    const active =
      selectedFilter === id;

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,

          active &&
            styles.activeFilterButton,
        ]}
        onPress={() =>
          setSelectedFilter(id)
        }
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={
            active
              ? '#FFFFFF'
              : COLORS.muted
          }
        />

        <Text
          style={[
            styles.filterText,

            active &&
              styles.activeFilterText,
          ]}
        >
          {label}
        </Text>

        <View
          style={[
            styles.filterCount,

            active &&
              styles.activeFilterCount,
          ]}
        >
          <Text
            style={[
              styles.filterCountText,

              active &&
                styles.activeFilterCountText,
            ]}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.background
          }
        />

        <View style={styles.root}>
          <View
            style={styles.topPurpleCircle}
          />

          {renderHeader()}

          <View style={styles.centerState}>
            <View
              style={
                styles.loadingIconContainer
              }
            >
              <MaterialCommunityIcons
                name="school-outline"
                size={39}
                color={COLORS.primary}
              />
            </View>

            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={styles.loader}
            />

            <Text style={styles.loadingTitle}>
              Finding the Best for You
            </Text>

            <Text style={styles.loadingText}>
              Discovering batches and test
              series for your preparation...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            COLORS.background
          }
        />

        <View style={styles.root}>
          <View
            style={styles.topPurpleCircle}
          />

          {renderHeader()}

          <View style={styles.centerState}>
            <View
              style={styles.errorIconContainer}
            >
              <MaterialCommunityIcons
                name="cloud-alert-outline"
                size={39}
                color={COLORS.error}
              />
            </View>

            <Text style={styles.errorTitle}>
              Unable to Load
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchData()}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={styles.retryText}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }


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
        backgroundColor={
          COLORS.background
        }
      />

      <View style={styles.root}>
        {/* BACKGROUND */}

        <View
          style={styles.topPurpleCircle}
        />

        <View
          style={styles.leftPurpleCircle}
        />


        {/* HEADER */}

        {renderHeader()}


        {/* ===================================================
            SEARCH
        =================================================== */}

        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <View style={styles.searchIconWrap}>
              <MaterialCommunityIcons
                name="magnify"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search batches & test series"
              placeholderTextColor={
                COLORS.lightMuted
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />

            {!!searchQuery && (
              <TouchableOpacity
                style={styles.clearSearch}
                onPress={() =>
                  setSearchQuery('')
                }
              >
                <MaterialCommunityIcons
                  name="close"
                  size={17}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>


        {/* ===================================================
            FILTERS
        =================================================== */}

        <View style={styles.filtersContainer}>
          <FilterButton
            id="all"
            label="All"
            icon="view-grid-outline"
            count={allItems.length}
          />

          <FilterButton
            id="courses"
            label="Batches"
            icon="school-outline"
            count={courseCount}
          />

          <FilterButton
            id="tests"
            label="Tests"
            icon="clipboard-text-outline"
            count={testCount}
          />
        </View>


        {/* ===================================================
            LIST
        =================================================== */}

        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) =>
            String(item?._id ?? index)
          }
          renderItem={({ item }) => (
            <ExploreCard
              item={item}
              onPress={() => openItem(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.listContent,

            {
              paddingBottom:
                Math.max(
                  insets.bottom + 90,
                  110
                ),
            },

            filteredItems.length === 0 &&
              styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            filteredItems.length > 0 ? (
              <View style={styles.listHeader}>
                <View>
                  <Text
                    style={styles.listHeaderTitle}
                  >
                    Recommended for You
                  </Text>

                  <Text
                    style={
                      styles.listHeaderSubtitle
                    }
                  >
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1
                      ? 'learning option'
                      : 'learning options'}{' '}
                    available
                  </Text>
                </View>

                <View style={styles.sparkleIcon}>
                  <MaterialCommunityIcons
                    name="creation-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={styles.emptyDecoration}
              />

              <View
                style={
                  styles.emptyIconContainer
                }
              >
                <MaterialCommunityIcons
                  name={
                    searchQuery
                      ? 'magnify-close'
                      : 'school-outline'
                  }
                  size={48}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? 'Nothing Found'
                  : 'You’re All Caught Up'}
              </Text>

              <Text style={styles.emptyText}>
                {searchQuery
                  ? `We couldn't find anything matching "${searchQuery}".`
                  : 'No new batches or test series are available to explore right now.'}
              </Text>

              {!!searchQuery && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() =>
                    setSearchQuery('')
                  }
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.clearButtonText
                    }
                  >
                    Clear Search
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
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
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DDD6FE',
    top: 550,
    left: -105,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEAFB',

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },


  headerTitleContainer: {
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEAFB',
  },


  headerLogo: {
    width: 34,
    height: 34,
  },


  /* =========================================================
     SEARCH
  ========================================================= */

  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 7,
  },


  searchContainer: {
    height: 57,
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.05,
    shadowRadius: 13,
    elevation: 3,
  },


  searchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  searchInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },


  clearSearch: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },


  /* =========================================================
     FILTERS
  ========================================================= */

  filtersContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    flexDirection: 'row',
    gap: 8,
  },


  filterButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },


  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 11,
    elevation: 5,
  },


  filterText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
  },


  activeFilterText: {
    color: '#FFFFFF',
  },


  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 7,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  activeFilterCount: {
    backgroundColor:
      'rgba(255,255,255,0.18)',
  },


  filterCountText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
  },


  activeFilterCountText: {
    color: '#FFFFFF',
  },


  /* =========================================================
     LIST
  ========================================================= */

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },


  emptyListContent: {
    flexGrow: 1,
  },


  listHeader: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  listHeaderTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },


  listHeaderSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '500',
  },


  sparkleIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  /* =========================================================
     CARD
  ========================================================= */

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 17,
    elevation: 5,
  },


  cardImageContainer: {
    height: 195,
    position: 'relative',
    backgroundColor: COLORS.primaryDark,
  },


  cardImage: {
    width: '100%',
    height: '100%',
  },


  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },


  placeholderCircleOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.primary,
    top: -80,
    right: -45,
    opacity: 0.7,
  },


  placeholderCircleTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8B5CF6',
    bottom: -70,
    left: -25,
    opacity: 0.35,
  },


  placeholderTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },


  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(33,16,93,0.12)',
  },


  typeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  testTypeBadge: {
    backgroundColor: COLORS.pink,
  },


  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },


  verifiedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(17,24,39,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },


  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },


  imageBottomInfo: {
    position: 'absolute',
    left: 14,
    bottom: 13,
  },


  imageBrandRow: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(33,16,93,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  imageBrandText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },


  cardBody: {
    padding: 17,
  },


  batchName: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },


  batchDescription: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '500',
  },


  /* =========================================================
     QUICK FEATURES
  ========================================================= */

  quickFeatures: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 7,
  },


  quickFeature: {
    flex: 1,
    minHeight: 39,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
  },


  quickFeatureIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },


  quickFeatureText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
  },


  cardDivider: {
    height: 1,
    marginVertical: 15,
    backgroundColor: '#F1F0F6',
  },


  /* =========================================================
     PRICE
  ========================================================= */

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  priceContainer: {
    flex: 1,
  },


  priceLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
  },


  priceText: {
    marginTop: 3,
    color: COLORS.primaryDark,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },


  freePriceText: {
    color: COLORS.success,
  },


  exploreButton: {
    minWidth: 128,
    height: 47,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },


  freeExploreButton: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },


  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },


  /* =========================================================
     LOADING / ERROR
  ========================================================= */

  centerState: {
    flex: 1,
    paddingHorizontal: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },


  loadingIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 29,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  loader: {
    marginTop: 22,
  },


  loadingTitle: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
  },


  loadingText: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
  },


  errorIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 29,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  errorTitle: {
    marginTop: 20,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },


  errorText: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
  },


  retryButton: {
    height: 52,
    marginTop: 23,
    paddingHorizontal: 23,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.23,
    shadowRadius: 14,
    elevation: 5,
  },


  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },


  /* =========================================================
     EMPTY
  ========================================================= */

  emptyContainer: {
    flex: 1,
    minHeight: 430,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },


  emptyDecoration: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.6,
  },


  emptyIconContainer: {
    width: 105,
    height: 105,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#312E81',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },


  emptyTitle: {
    marginTop: 25,
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },


  emptyText: {
    marginTop: 8,
    maxWidth: 285,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
  },


  clearButton: {
    height: 51,
    marginTop: 23,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },


  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});