import React, {
  useState,
  useEffect,
  useCallback,
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
   TEST SERIES CARD
============================================================ */

function TestSeriesCard({
  item,
  onPress,
}) {
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
            style={styles.cardImagePlaceholder}
          >
            <View
              style={styles.placeholderCircleOne}
            />

            <View
              style={styles.placeholderCircleTwo}
            />

            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={55}
              color="#DDD6FE"
            />

            <Text
              style={styles.placeholderTitle}
            >
              Garud Tests
            </Text>

            <Text
              style={styles.placeholderSubtitle}
            >
              Prepare • Practice • Perform
            </Text>
          </LinearGradient>
        )}


        {/* IMAGE OVERLAY */}

        <LinearGradient
          colors={[
            'rgba(33,16,93,0.02)',
            'rgba(33,16,93,0.18)',
            'rgba(33,16,93,0.82)',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.imageOverlay}
        />


        {/* TEST BADGE */}

        <View style={styles.testBadge}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={14}
            color="#FFFFFF"
          />

          <Text style={styles.testBadgeText}>
            MY TEST SERIES
          </Text>
        </View>


        {/* ACCESS BADGE */}

        <View style={styles.accessBadge}>
          <MaterialCommunityIcons
            name="check-decagram"
            size={15}
            color="#A7F3D0"
          />

          <Text style={styles.accessBadgeText}>
            ACTIVE
          </Text>
        </View>


        {/* IMAGE BOTTOM */}

        <View style={styles.imageBottomContent}>
          <View style={styles.imageBrandBadge}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={14}
              color="#DDD6FE"
            />

            <Text style={styles.imageBrandText}>
              GARUD CLASSES
            </Text>
          </View>
        </View>
      </View>


      {/* =====================================================
          CARD CONTENT
      ===================================================== */}

      <View style={styles.cardBody}>
        <Text
          style={styles.batchName}
          numberOfLines={2}
        >
          {item?.name || 'Test Series'}
        </Text>


        {!!item?.description && (
          <Text
            style={styles.batchDescription}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}


        {/* QUICK FEATURES */}

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
                name="timer-outline"
                size={17}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.quickFeatureContent}>
              <Text
                style={styles.quickFeatureTitle}
              >
                Timed
              </Text>

              <Text
                style={styles.quickFeatureSubtitle}
              >
                Exam Mode
              </Text>
            </View>
          </View>


          <View style={styles.quickFeatureDivider} />


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
                name="chart-line"
                size={17}
                color={COLORS.blue}
              />
            </View>

            <View style={styles.quickFeatureContent}>
              <Text
                style={styles.quickFeatureTitle}
              >
                Results
              </Text>

              <Text
                style={styles.quickFeatureSubtitle}
              >
                Analysis
              </Text>
            </View>
          </View>


          <View style={styles.quickFeatureDivider} />


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
                name="target"
                size={17}
                color={COLORS.success}
              />
            </View>

            <View style={styles.quickFeatureContent}>
              <Text
                style={styles.quickFeatureTitle}
              >
                Focused
              </Text>

              <Text
                style={styles.quickFeatureSubtitle}
              >
                Practice
              </Text>
            </View>
          </View>
        </View>


        {/* BUTTON */}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <View style={styles.continueButtonIcon}>
            <MaterialCommunityIcons
              name="play"
              size={17}
              color={COLORS.primary}
            />
          </View>

          <Text
            style={styles.continueButtonText}
          >
            Open Test Series
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}


/* ============================================================
   MY TESTS SCREEN
============================================================ */

export default function MyTestsScreen({
  navigation,
}) {
  const { logout } = useAuth();

  const insets = useSafeAreaInsets();


  /* =========================================================
     STATE
  ========================================================= */

  const [batches, setBatches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');


  /* =========================================================
     FETCH TEST SERIES
  ========================================================= */

  const fetchBatches = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setLoading(true);
      }

      setError('');

      try {
        const response =
          await apiClient.get(
            '/test-series/my-purchase'
          );

        setBatches(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (e) {
        if (e.response?.status === 401) {
          logout();

          return;
        }

        console.error(
          'ERROR FETCHING TEST SERIES:',
          e
        );

        setError(
          e.response?.data?.message ||
            'Failed to load your test series. Please try again.'
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
    fetchBatches();
  }, [fetchBatches]);


  /* =========================================================
     REFRESH
  ========================================================= */

  const onRefresh = () => {
    setRefreshing(true);

    fetchBatches(true);
  };


  /* =========================================================
     OPEN TEST SERIES
  ========================================================= */

  const openTestSeries = item => {
    navigation.navigate(
      'TestSeriesDetail',
      {
        item,
      }
    );
  };


  /* =========================================================
     HEADER
  ========================================================= */

  const renderHeader = () => (
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
          My Tests
        </Text>

        <Text style={styles.headerSubtitle}>
          Practice. Analyse. Improve.
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
                name="clipboard-text-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={styles.loader}
            />

            <Text style={styles.loadingTitle}>
              Loading Your Tests
            </Text>

            <Text style={styles.loadingText}>
              Preparing your purchased test
              series and practice content...
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
                name="clipboard-alert-outline"
                size={42}
                color={COLORS.error}
              />
            </View>

            <Text style={styles.errorTitle}>
              Unable to Load Tests
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                fetchBatches()
              }
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.retryText}>
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
        {/* BACKGROUND DECORATION */}

        <View
          style={styles.topPurpleCircle}
        />

        <View
          style={styles.leftPurpleCircle}
        />


        {/* HEADER */}

        {renderHeader()}


        {/* ===================================================
            SUMMARY
        =================================================== */}

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
          style={styles.summaryCard}
        >
          <View
            style={styles.summaryCircleOne}
          />

          <View
            style={styles.summaryCircleTwo}
          />


          <View style={styles.summaryHeader}>
            <View>
              <View style={styles.summaryBadge}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={13}
                  color="#FDE68A"
                />

                <Text
                  style={styles.summaryBadgeText}
                >
                  YOUR TEST LIBRARY
                </Text>
              </View>

              <Text
                style={styles.summaryTitle}
              >
                Ready to Practice?
              </Text>

              <Text
                style={styles.summaryDescription}
              >
                Continue your preparation and
                improve with every test.
              </Text>
            </View>


            <View style={styles.summaryCount}>
              <Text
                style={styles.summaryCountValue}
              >
                {batches.length}
              </Text>

              <Text
                style={styles.summaryCountLabel}
              >
                SERIES
              </Text>
            </View>
          </View>


          <View style={styles.summaryBottom}>
            <View style={styles.summaryStat}>
              <View
                style={styles.summaryStatIcon}
              >
                <MaterialCommunityIcons
                  name="clipboard-check-outline"
                  size={17}
                  color="#FFFFFF"
                />
              </View>

              <Text
                style={styles.summaryStatText}
              >
                Exam Practice
              </Text>
            </View>


            <View style={styles.summaryDivider} />


            <View style={styles.summaryStat}>
              <View
                style={styles.summaryStatIcon}
              >
                <MaterialCommunityIcons
                  name="chart-line"
                  size={17}
                  color="#FFFFFF"
                />
              </View>

              <Text
                style={styles.summaryStatText}
              >
                Result Analysis
              </Text>
            </View>
          </View>
        </LinearGradient>


        {/* ===================================================
            LIST
        =================================================== */}

        <FlatList
          data={batches}
          keyExtractor={(item, index) =>
            String(
              item?._id ??
                item?.id ??
                index
            )
          }
          renderItem={({ item }) => (
            <TestSeriesCard
              item={item}
              onPress={() =>
                openTestSeries(item)
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,

            {
              paddingBottom:
                Math.max(
                  insets.bottom + 90,
                  110
                ),
            },

            batches.length === 0 &&
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
            batches.length > 0 ? (
              <View style={styles.listHeader}>
                <View>
                  <Text
                    style={styles.listHeaderTitle}
                  >
                    Your Test Series
                  </Text>

                  <Text
                    style={
                      styles.listHeaderSubtitle
                    }
                  >
                    Select a series and start
                    practicing
                  </Text>
                </View>

                <View
                  style={styles.headerTestIcon}
                >
                  <MaterialCommunityIcons
                    name="target"
                    size={21}
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
                  name="clipboard-text-outline"
                  size={50}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Test Series Yet
              </Text>

              <Text style={styles.emptyText}>
                Your purchased test series will
                appear here. Explore available
                tests and start practicing.
              </Text>

              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() =>
                  navigation.navigate('Batches')
                }
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="compass-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.exploreButtonText
                  }
                >
                  Explore Test Series
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={19}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
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
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#DDD6FE',
    top: 610,
    left: -110,
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
     SUMMARY
  ========================================================= */

  summaryCard: {
    minHeight: 205,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 5,
    borderRadius: 27,
    padding: 20,
    overflow: 'hidden',

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },


  summaryCircleOne: {
    position: 'absolute',
    width: 165,
    height: 165,
    borderRadius: 83,
    backgroundColor: '#8B5CF6',
    top: -90,
    right: -60,
    opacity: 0.6,
  },


  summaryCircleTwo: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: '#A78BFA',
    bottom: -65,
    left: -20,
    opacity: 0.2,
  },


  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },


  summaryBadge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor:
      'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  summaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },


  summaryTitle: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },


  summaryDescription: {
    width: 205,
    marginTop: 7,
    color: '#DDD6FE',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '500',
  },


  summaryCount: {
    marginLeft: 'auto',
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor:
      'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },


  summaryCountValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 31,
  },


  summaryCountLabel: {
    marginTop: 1,
    color: '#DDD6FE',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },


  summaryBottom: {
    height: 49,
    marginTop: 17,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,255,255,0.11)',
    flexDirection: 'row',
    alignItems: 'center',
  },


  summaryStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },


  summaryStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },


  summaryStatText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },


  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor:
      'rgba(255,255,255,0.2)',
  },


  /* =========================================================
     LIST
  ========================================================= */

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
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


  headerTestIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },


  /* =========================================================
     CARD
  ========================================================= */

  card: {
    marginBottom: 19,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',

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
    height: 185,
    position: 'relative',
    backgroundColor: COLORS.primaryDark,
  },


  cardImage: {
    width: '100%',
    height: '100%',
  },


  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },


  placeholderCircleOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#8B5CF6',
    top: -85,
    right: -45,
    opacity: 0.55,
  },


  placeholderCircleTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#A78BFA',
    bottom: -70,
    left: -30,
    opacity: 0.28,
  },


  placeholderTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },


  placeholderSubtitle: {
    marginTop: 4,
    color: '#DDD6FE',
    fontSize: 9,
    fontWeight: '600',
  },


  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },


  testBadge: {
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


  testBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },


  accessBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor:
      'rgba(17,24,39,0.68)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },


  accessBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },


  imageBottomContent: {
    position: 'absolute',
    left: 14,
    bottom: 13,
  },


  imageBrandBadge: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor:
      'rgba(33,16,93,0.72)',
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
    minHeight: 67,
    marginTop: 15,
    paddingHorizontal: 5,
    borderRadius: 17,
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
  },


  quickFeature: {
    flex: 1,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },


  quickFeatureIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },


  quickFeatureContent: {
    flexShrink: 1,
  },


  quickFeatureTitle: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '900',
  },


  quickFeatureSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '600',
  },


  quickFeatureDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },


  /* =========================================================
     BUTTON
  ========================================================= */

  continueButton: {
    height: 55,
    marginTop: 15,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.22,
    shadowRadius: 13,
    elevation: 5,
  },


  continueButtonIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },


  continueButtonText: {
    flex: 1,
    marginLeft: 11,
    color: '#FFFFFF',
    fontSize: 13,
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
    minHeight: 420,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },


  emptyDecoration: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.7,
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


  exploreButton: {
    height: 53,
    marginTop: 24,
    paddingHorizontal: 18,
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
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },


  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});