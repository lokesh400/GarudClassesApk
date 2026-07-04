import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import apiClient from '../../api/client';

import { useAuth } from '../../auth/AuthContext';


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

  error: '#DC2626',

  errorLight: '#FEF2F2',
};


/* ============================================================
   FORMAT PRICE
============================================================ */

function formatPrice(amount) {
  const value = Number(amount || 0);

  return `₹${value.toLocaleString(
    'en-IN'
  )}`;
}


/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',

    month: 'short',

    year: 'numeric',

    hour: '2-digit',

    minute: '2-digit',

    hour12: true,
  });
}


/* ============================================================
   RECEIPT TITLE
============================================================ */

function makeReceiptTitle(
  purchase,
  index
) {
  const item = purchase?.itemId;

  if (item?.name) {
    return item.name;
  }

  if (item?.title) {
    return item.title;
  }

  return `Receipt #${index + 1}`;
}


/* ============================================================
   MY PURCHASES
============================================================ */

export default function MyPurchasesScreen({
  navigation,
}) {
  const { logout } = useAuth();


  /* =========================================================
     STATE
  ========================================================= */

  const [purchases, setPurchases] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');


  /* =========================================================
     FETCH PURCHASES
  ========================================================= */

  const fetchPurchases = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setLoading(true);
      }

      setError('');

      try {
        const res =
          await apiClient.get(
            '/purchase/my'
          );

        setPurchases(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (e) {
        console.log(
          'PURCHASE FETCH ERROR:',
          e
        );

        if (e.response?.status === 401) {
          logout();

          return;
        }

        setError(
          e.response?.data?.message ||
            'Failed to load your purchases.'
        );
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [logout]
  );


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchPurchases(false);
  }, [fetchPurchases]);


  /* =========================================================
     REFRESH
  ========================================================= */

  const onRefresh = () => {
    setRefreshing(true);

    fetchPurchases(true);
  };


  /* =========================================================
     OPEN RECEIPT
  ========================================================= */

  const openReceipt = (
    purchase,
    title
  ) => {
    navigation.navigate(
      'PurchaseReceiptDetail',
      {
        purchase,

        fallbackTitle: title,
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
            My Purchases
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Payment history & receipts
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
     LOADING
  ========================================================= */

  const renderLoading = () => {
    return (
      <View style={styles.centerState}>
        <View
          style={styles.loadingIconContainer}
        >
          <MaterialCommunityIcons
            name="receipt-text-clock-outline"
            size={37}
            color={COLORS.primary}
          />
        </View>

        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />

        <Text style={styles.loadingTitle}>
          Loading Purchases
        </Text>

        <Text style={styles.helperText}>
          Fetching your payment history...
        </Text>
      </View>
    );
  };


  /* =========================================================
     ERROR
  ========================================================= */

  const renderError = () => {
    return (
      <View style={styles.centerState}>
        <View
          style={styles.errorIconContainer}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={37}
            color={COLORS.error}
          />
        </View>

        <Text style={styles.errorTitle}>
          Unable to Load Purchases
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() =>
            fetchPurchases(false)
          }
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={styles.retryButtonText}
          >
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  };


  /* =========================================================
     EMPTY
  ========================================================= */

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={styles.emptyDecoration}
        />

        <View
          style={styles.emptyIconContainer}
        >
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={48}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No Purchases Yet
        </Text>

        <Text style={styles.emptySubtext}>
          Your successful course and test
          series payments will appear here.
        </Text>

        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() =>
            navigation.navigate('Batches')
          }
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="book-open-page-variant-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={styles.exploreButtonText}
          >
            Explore Courses
          </Text>
        </TouchableOpacity>
      </View>
    );
  };


  /* =========================================================
     RECEIPT
  ========================================================= */

  const renderReceipt = ({
    item,
    index,
  }) => {
    const title = makeReceiptTitle(
      item,
      index
    );

    const amount = formatPrice(
      item?.amount
    );

    const createdAt = formatDate(
      item?.createdAt
    );


    return (
      <TouchableOpacity
        style={styles.receiptCard}
        activeOpacity={0.88}
        onPress={() =>
          openReceipt(item, title)
        }
      >
        {/* RECEIPT ICON */}

        <View
          style={styles.receiptIconContainer}
        >
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={27}
            color={COLORS.primary}
          />

          <View
            style={styles.successBadge}
          >
            <MaterialCommunityIcons
              name="check"
              size={10}
              color="#FFFFFF"
            />
          </View>
        </View>


        {/* RECEIPT INFORMATION */}

        <View style={styles.receiptBody}>
          <Text
            style={styles.receiptTitle}
            numberOfLines={2}
          >
            {title}
          </Text>

          <View
            style={styles.receiptMetaRow}
          >
            <MaterialCommunityIcons
              name="calendar-outline"
              size={14}
              color={COLORS.muted}
            />

            <Text
              style={styles.receiptMeta}
              numberOfLines={1}
            >
              {createdAt}
            </Text>
          </View>


          <View
            style={styles.paymentStatusRow}
          >
            <View
              style={styles.paidStatus}
            >
              <View
                style={styles.paidDot}
              />

              <Text
                style={styles.paidStatusText}
              >
                PAID
              </Text>
            </View>

            <Text
              style={styles.amountText}
            >
              {amount}
            </Text>
          </View>
        </View>


        {/* ARROW */}

        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={COLORS.primary}
          />
        </View>
      </TouchableOpacity>
    );
  };


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


        {/* LOADING */}

        {loading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          <FlatList
            data={purchases}
            keyExtractor={(
              item,
              index
            ) =>
              String(
                item?._id || index
              )
            }
            contentContainerStyle={[
              styles.listContent,

              purchases.length === 0 &&
                styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={
              false
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={
                  COLORS.primary
                }
                colors={[
                  COLORS.primary,
                ]}
              />
            }
            ListHeaderComponent={
              purchases.length > 0 ? (
                <>
                  {/* SUMMARY HERO */}

                  <View
                    style={styles.summaryCard}
                  >
                    <View
                      style={
                        styles.summaryCircleOne
                      }
                    />

                    <View
                      style={
                        styles.summaryCircleTwo
                      }
                    />

                    <View
                      style={
                        styles.summaryIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="wallet-check-outline"
                        size={28}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.summaryContent
                      }
                    >
                      <Text
                        style={
                          styles.summaryLabel
                        }
                      >
                        PAYMENT HISTORY
                      </Text>

                      <Text
                        style={
                          styles.summaryTitle
                        }
                      >
                        {purchases.length}{' '}
                        {purchases.length === 1
                          ? 'Purchase'
                          : 'Purchases'}
                      </Text>

                      <Text
                        style={
                          styles.summarySubtitle
                        }
                      >
                        All your successful
                        payments in one place
                      </Text>
                    </View>
                  </View>


                  {/* SECTION HEADING */}

                  <View
                    style={
                      styles.sectionHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.sectionTitle
                        }
                      >
                        Purchase History
                      </Text>

                      <Text
                        style={
                          styles.sectionSubtitle
                        }
                      >
                        Tap a receipt to view
                        details
                      </Text>
                    </View>

                    <View
                      style={
                        styles.receiptCountBadge
                      }
                    >
                      <Text
                        style={
                          styles.receiptCountText
                        }
                      >
                        {purchases.length}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null
            }
            ListEmptyComponent={
              renderEmpty
            }
            renderItem={renderReceipt}
          />
        )}
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

    backgroundColor:
      COLORS.background,
  },


  root: {
    flex: 1,

    backgroundColor:
      COLORS.background,
  },


  /* =========================================================
     BACKGROUND
  ========================================================= */

  topPurpleCircle: {
    position: 'absolute',

    width: 260,

    height: 260,

    borderRadius: 130,

    backgroundColor: '#EDE9FE',

    top: -160,

    right: -100,

    opacity: 0.7,
  },


  leftPurpleCircle: {
    position: 'absolute',

    width: 120,

    height: 120,

    borderRadius: 60,

    backgroundColor: '#DDD6FE',

    top: 400,

    left: -90,

    opacity: 0.3,
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
     LIST
  ========================================================= */

  listContent: {
    paddingHorizontal: 20,

    paddingTop: 12,

    paddingBottom: 45,
  },


  emptyListContent: {
    flexGrow: 1,
  },


  /* =========================================================
     SUMMARY
  ========================================================= */

  summaryCard: {
    minHeight: 150,

    backgroundColor:
      COLORS.primaryDark,

    borderRadius: 28,

    padding: 21,

    flexDirection: 'row',

    alignItems: 'center',

    overflow: 'hidden',

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {
      width: 0,

      height: 12,
    },

    shadowOpacity: 0.18,

    shadowRadius: 22,

    elevation: 8,
  },


  summaryCircleOne: {
    position: 'absolute',

    width: 150,

    height: 150,

    borderRadius: 75,

    backgroundColor:
      COLORS.primary,

    top: -80,

    right: -40,

    opacity: 0.65,
  },


  summaryCircleTwo: {
    position: 'absolute',

    width: 100,

    height: 100,

    borderRadius: 50,

    backgroundColor: '#8B5CF6',

    bottom: -65,

    left: 30,

    opacity: 0.3,
  },


  summaryIcon: {
    width: 60,

    height: 60,

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.14)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 17,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.15)',
  },


  summaryContent: {
    flex: 1,
  },


  summaryLabel: {
    color: '#C4B5FD',

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1,
  },


  summaryTitle: {
    marginTop: 5,

    color: '#FFFFFF',

    fontSize: 24,

    fontWeight: '900',

    letterSpacing: -0.5,
  },


  summarySubtitle: {
    marginTop: 5,

    color: '#DDD6FE',

    fontSize: 11,

    lineHeight: 17,

    fontWeight: '500',
  },


  /* =========================================================
     SECTION
  ========================================================= */

  sectionHeader: {
    marginTop: 27,

    marginBottom: 14,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },


  sectionTitle: {
    color: COLORS.text,

    fontSize: 18,

    fontWeight: '900',

    letterSpacing: -0.4,
  },


  sectionSubtitle: {
    marginTop: 3,

    color: COLORS.muted,

    fontSize: 11,

    fontWeight: '500',
  },


  receiptCountBadge: {
    minWidth: 35,

    height: 35,

    paddingHorizontal: 10,

    borderRadius: 12,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',
  },


  receiptCountText: {
    color: COLORS.primary,

    fontSize: 13,

    fontWeight: '900',
  },


  /* =========================================================
     RECEIPT CARD
  ========================================================= */

  receiptCard: {
    minHeight: 125,

    backgroundColor: '#FFFFFF',

    borderRadius: 22,

    padding: 15,

    marginBottom: 12,

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


  receiptIconContainer: {
    position: 'relative',

    width: 57,

    height: 57,

    borderRadius: 19,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 14,
  },


  successBadge: {
    position: 'absolute',

    right: -3,

    bottom: -3,

    width: 21,

    height: 21,

    borderRadius: 11,

    backgroundColor:
      COLORS.success,

    borderWidth: 3,

    borderColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',
  },


  receiptBody: {
    flex: 1,
  },


  receiptTitle: {
    color: COLORS.text,

    fontSize: 14,

    fontWeight: '900',

    lineHeight: 19,

    marginBottom: 7,
  },


  receiptMetaRow: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },


  receiptMeta: {
    flex: 1,

    color: COLORS.muted,

    fontSize: 10,

    fontWeight: '600',
  },


  paymentStatusRow: {
    marginTop: 9,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },


  paidStatus: {
    height: 24,

    paddingHorizontal: 9,

    borderRadius: 8,

    backgroundColor:
      COLORS.successLight,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },


  paidDot: {
    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor:
      COLORS.success,
  },


  paidStatusText: {
    color: COLORS.success,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 0.5,
  },


  amountText: {
    color: COLORS.primaryDark,

    fontSize: 15,

    fontWeight: '900',
  },


  arrowContainer: {
    width: 34,

    height: 34,

    borderRadius: 12,

    backgroundColor:
      COLORS.primarySoft,

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 10,
  },


  /* =========================================================
     LOADING / ERROR
  ========================================================= */

  centerState: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 35,
  },


  loadingIconContainer: {
    width: 82,

    height: 82,

    borderRadius: 27,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',
  },


  loader: {
    marginTop: 22,
  },


  loadingTitle: {
    marginTop: 16,

    color: COLORS.text,

    fontSize: 18,

    fontWeight: '900',
  },


  helperText: {
    marginTop: 6,

    color: COLORS.muted,

    fontSize: 12,

    fontWeight: '500',

    textAlign: 'center',
  },


  errorIconContainer: {
    width: 82,

    height: 82,

    borderRadius: 27,

    backgroundColor:
      COLORS.errorLight,

    alignItems: 'center',

    justifyContent: 'center',
  },


  errorTitle: {
    marginTop: 20,

    color: COLORS.text,

    fontSize: 19,

    fontWeight: '900',

    textAlign: 'center',
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
    height: 51,

    marginTop: 23,

    paddingHorizontal: 24,

    borderRadius: 16,

    backgroundColor:
      COLORS.primary,

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


  retryButtonText: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '900',
  },


  /* =========================================================
     EMPTY
  ========================================================= */

  emptyContainer: {
    flex: 1,

    minHeight: 520,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 25,

    overflow: 'hidden',
  },


  emptyDecoration: {
    position: 'absolute',

    width: 180,

    height: 180,

    borderRadius: 90,

    backgroundColor:
      COLORS.primaryLight,

    opacity: 0.55,
  },


  emptyIconContainer: {
    width: 105,

    height: 105,

    borderRadius: 35,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: COLORS.border,

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


  emptySubtext: {
    marginTop: 8,

    maxWidth: 280,

    color: COLORS.muted,

    fontSize: 12,

    lineHeight: 19,

    fontWeight: '500',

    textAlign: 'center',
  },


  exploreButton: {
    height: 53,

    marginTop: 24,

    paddingHorizontal: 22,

    borderRadius: 17,

    backgroundColor:
      COLORS.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,

    shadowColor: COLORS.primary,

    shadowOffset: {
      width: 0,

      height: 8,
    },

    shadowOpacity: 0.23,

    shadowRadius: 15,

    elevation: 6,
  },


  exploreButtonText: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '900',
  },
});