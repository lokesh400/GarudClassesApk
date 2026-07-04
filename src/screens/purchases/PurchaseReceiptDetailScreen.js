import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';


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
};


/* ============================================================
   GET TITLE
============================================================ */

function getTitle(
  purchase,
  fallbackTitle
) {
  const item = purchase?.itemId;

  return (
    item?.name ||
    item?.title ||
    fallbackTitle ||
    'Purchase Receipt'
  );
}


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
   FORMAT VALUE
============================================================ */

function formatValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '-';
  }

  return String(value);
}


/* ============================================================
   INFORMATION ROW
============================================================ */

function InformationRow({
  icon,
  label,
  value,
  iconColor = COLORS.primary,
  iconBackground = COLORS.primaryLight,
  valueColor = COLORS.text,
  isLast = false,
}) {
  return (
    <View
      style={[
        styles.informationRow,

        !isLast &&
          styles.informationRowBorder,
      ]}
    >
      <View
        style={[
          styles.rowIconContainer,

          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={iconColor}
        />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.rowValue,

            {
              color: valueColor,
            },
          ]}
          selectable
        >
          {formatValue(value)}
        </Text>
      </View>
    </View>
  );
}


/* ============================================================
   SECTION CARD
============================================================ */

function SectionCard({
  icon,
  title,
  subtitle,
  iconColor = COLORS.primary,
  iconBackground = COLORS.primaryLight,
  children,
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIconContainer,

            {
              backgroundColor:
                iconBackground,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={iconColor}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          {!!subtitle && (
            <Text
              style={styles.sectionSubtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}


/* ============================================================
   PURCHASE RECEIPT DETAIL
============================================================ */

export default function PurchaseReceiptDetailScreen({
  route,
  navigation,
}) {
  const {
    purchase,
    fallbackTitle,
  } = route.params || {};

  const item = purchase?.itemId;

  const title = getTitle(
    purchase,
    fallbackTitle
  );

  const paymentStatus = String(
    purchase?.status || '-'
  ).toUpperCase();

  const paymentMethod = String(
    purchase?.method || '-'
  ).toUpperCase();

  const isPaid =
    paymentStatus === 'PAID' ||
    paymentStatus === 'SUCCESS' ||
    paymentStatus === 'COMPLETED';


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
        {/* ===================================================
            BACKGROUND
        =================================================== */}

        <View
          style={styles.topPurpleCircle}
        />

        <View
          style={styles.leftPurpleCircle}
        />


        {/* ===================================================
            HEADER
        =================================================== */}

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
            style={
              styles.headerTitleContainer
            }
          >
            <Text style={styles.headerTitle}>
              Receipt Details
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Payment information
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>
        </View>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* =================================================
              RECEIPT HERO
          ================================================= */}

          <View style={styles.heroCard}>
            <View
              style={styles.heroCircleOne}
            />

            <View
              style={styles.heroCircleTwo}
            />

            <View
              style={styles.heroTopRow}
            >
              <View
                style={styles.heroIconContainer}
              >
                <MaterialCommunityIcons
                  name="receipt-text-check-outline"
                  size={31}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.statusBadge,

                  isPaid
                    ? styles.successStatusBadge
                    : styles.normalStatusBadge,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,

                    {
                      backgroundColor: isPaid
                        ? '#10B981'
                        : '#F59E0B',
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusBadgeText,

                    {
                      color: isPaid
                        ? '#A7F3D0'
                        : '#FDE68A',
                    },
                  ]}
                >
                  {paymentStatus}
                </Text>
              </View>
            </View>


            <Text style={styles.heroLabel}>
              PAYMENT RECEIPT
            </Text>

            <Text
              style={styles.heroTitle}
              numberOfLines={2}
            >
              {title}
            </Text>


            <View
              style={styles.heroAmountContainer}
            >
              <Text
                style={styles.heroAmountLabel}
              >
                Amount Paid
              </Text>

              <Text
                style={styles.heroAmount}
              >
                {formatPrice(
                  purchase?.amount
                )}
              </Text>
            </View>


            <View style={styles.heroDivider} />


            <View
              style={styles.heroFooter}
            >
              <View style={styles.heroFooterItem}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={15}
                  color="#C4B5FD"
                />

                <Text
                  style={styles.heroFooterText}
                  numberOfLines={1}
                >
                  {formatDate(
                    purchase?.createdAt
                  )}
                </Text>
              </View>

              <View
                style={styles.methodBadge}
              >
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={14}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.methodBadgeText}
                >
                  {paymentMethod}
                </Text>
              </View>
            </View>
          </View>


          {/* =================================================
              TRANSACTION
          ================================================= */}

          <SectionCard
            icon="wallet-outline"
            title="Transaction"
            subtitle="Payment summary"
            iconColor={COLORS.primary}
            iconBackground={
              COLORS.primaryLight
            }
          >
            <InformationRow
              icon="currency-inr"
              label="Amount"
              value={formatPrice(
                purchase?.amount
              )}
              iconColor={COLORS.primary}
              iconBackground={
                COLORS.primaryLight
              }
            />

            <InformationRow
              icon={
                isPaid
                  ? 'check-circle-outline'
                  : 'clock-outline'
              }
              label="Payment Status"
              value={paymentStatus}
              iconColor={
                isPaid
                  ? COLORS.success
                  : COLORS.orange
              }
              iconBackground={
                isPaid
                  ? COLORS.successLight
                  : COLORS.orangeLight
              }
              valueColor={
                isPaid
                  ? COLORS.success
                  : COLORS.orange
              }
            />

            <InformationRow
              icon="credit-card-outline"
              label="Payment Method"
              value={paymentMethod}
              iconColor={COLORS.blue}
              iconBackground={
                COLORS.blueLight
              }
            />

            <InformationRow
              icon="calendar-clock-outline"
              label="Purchased On"
              value={formatDate(
                purchase?.createdAt
              )}
              iconColor={COLORS.orange}
              iconBackground={
                COLORS.orangeLight
              }
              isLast
            />
          </SectionCard>


          {/* =================================================
              ITEM DETAILS
          ================================================= */}

          <SectionCard
            icon="book-open-page-variant-outline"
            title="Item Details"
            subtitle="Purchased learning content"
            iconColor={COLORS.blue}
            iconBackground={COLORS.blueLight}
          >
            <InformationRow
              icon="shape-outline"
              label="Item Type"
              value={purchase?.itemType}
              iconColor={COLORS.blue}
              iconBackground={
                COLORS.blueLight
              }
            />

            <InformationRow
              icon="book-outline"
              label="Item Name"
              value={
                item?.name ||
                item?.title
              }
              iconColor={COLORS.primary}
              iconBackground={
                COLORS.primaryLight
              }
            />

            <InformationRow
              icon="identifier"
              label="Item ID"
              value={
                item?._id ||
                purchase?.itemId?._id ||
                purchase?.itemId
              }
              iconColor={COLORS.pink}
              iconBackground={
                COLORS.pinkLight
              }
              isLast
            />
          </SectionCard>


          {/* =================================================
              PAYMENT GATEWAY
          ================================================= */}

          <SectionCard
            icon="shield-lock-outline"
            title="Payment Gateway"
            subtitle="Secure transaction references"
            iconColor={COLORS.success}
            iconBackground={
              COLORS.successLight
            }
          >
            <InformationRow
              icon="shopping-outline"
              label="Order ID"
              value={
                purchase?.razorpayOrderId
              }
              iconColor={COLORS.primary}
              iconBackground={
                COLORS.primaryLight
              }
            />

            <InformationRow
              icon="credit-card-check-outline"
              label="Payment ID"
              value={
                purchase?.razorpayPaymentId
              }
              iconColor={COLORS.success}
              iconBackground={
                COLORS.successLight
              }
            />

            <InformationRow
              icon="key-outline"
              label="Signature"
              value={
                purchase?.razorpaySignature
              }
              iconColor={COLORS.orange}
              iconBackground={
                COLORS.orangeLight
              }
              isLast
            />
          </SectionCard>


          {/* =================================================
              SECURE PAYMENT
          ================================================= */}

          <View style={styles.secureCard}>
            <View
              style={styles.secureIconContainer}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={25}
                color={COLORS.success}
              />
            </View>

            <View style={styles.secureContent}>
              <Text style={styles.secureTitle}>
                Secure Payment
              </Text>

              <Text style={styles.secureText}>
                Your payment was processed
                securely through the payment
                gateway.
              </Text>
            </View>
          </View>


          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="receipt-text-check-outline"
              size={15}
              color={COLORS.primary}
            />

            <Text style={styles.footerText}>
              Garud Classes Payment Receipt
            </Text>
          </View>
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

    width: 120,

    height: 120,

    borderRadius: 60,

    backgroundColor: '#DDD6FE',

    top: 430,

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


  headerIcon: {
    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#EEEAFB',
  },


  /* =========================================================
     SCROLL
  ========================================================= */

  scrollView: {
    flex: 1,
  },


  content: {
    paddingHorizontal: 20,

    paddingTop: 12,

    paddingBottom: 45,
  },


  /* =========================================================
     HERO
  ========================================================= */

  heroCard: {
    minHeight: 280,

    backgroundColor:
      COLORS.primaryDark,

    borderRadius: 30,

    padding: 22,

    overflow: 'hidden',

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {
      width: 0,

      height: 12,
    },

    shadowOpacity: 0.2,

    shadowRadius: 22,

    elevation: 8,
  },


  heroCircleOne: {
    position: 'absolute',

    width: 190,

    height: 190,

    borderRadius: 95,

    backgroundColor:
      COLORS.primary,

    top: -100,

    right: -60,

    opacity: 0.65,
  },


  heroCircleTwo: {
    position: 'absolute',

    width: 140,

    height: 140,

    borderRadius: 70,

    backgroundColor: '#8B5CF6',

    bottom: -90,

    left: -35,

    opacity: 0.3,
  },


  heroTopRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },


  heroIconContainer: {
    width: 59,

    height: 59,

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.14)',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.15)',
  },


  statusBadge: {
    minHeight: 29,

    paddingHorizontal: 11,

    borderRadius: 10,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    borderWidth: 1,
  },


  successStatusBadge: {
    backgroundColor:
      'rgba(16,185,129,0.13)',

    borderColor:
      'rgba(167,243,208,0.2)',
  },


  normalStatusBadge: {
    backgroundColor:
      'rgba(245,158,11,0.13)',

    borderColor:
      'rgba(253,230,138,0.2)',
  },


  statusDot: {
    width: 7,

    height: 7,

    borderRadius: 4,
  },


  statusBadgeText: {
    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 0.7,
  },


  heroLabel: {
    marginTop: 22,

    color: '#C4B5FD',

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1.1,
  },


  heroTitle: {
    marginTop: 5,

    color: '#FFFFFF',

    fontSize: 21,

    lineHeight: 28,

    fontWeight: '900',

    letterSpacing: -0.5,
  },


  heroAmountContainer: {
    marginTop: 19,
  },


  heroAmountLabel: {
    color: '#C4B5FD',

    fontSize: 10,

    fontWeight: '600',
  },


  heroAmount: {
    marginTop: 2,

    color: '#FFFFFF',

    fontSize: 31,

    fontWeight: '900',

    letterSpacing: -0.8,
  },


  heroDivider: {
    height: 1,

    marginTop: 17,

    marginBottom: 14,

    backgroundColor:
      'rgba(255,255,255,0.13)',
  },


  heroFooter: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 10,
  },


  heroFooterItem: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,
  },


  heroFooterText: {
    flex: 1,

    color: '#DDD6FE',

    fontSize: 9,

    fontWeight: '600',
  },


  methodBadge: {
    minHeight: 29,

    paddingHorizontal: 10,

    borderRadius: 10,

    backgroundColor:
      'rgba(255,255,255,0.12)',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },


  methodBadgeText: {
    color: '#FFFFFF',

    fontSize: 9,

    fontWeight: '800',
  },


  /* =========================================================
     SECTION CARD
  ========================================================= */

  sectionCard: {
    marginTop: 17,

    backgroundColor: '#FFFFFF',

    borderRadius: 24,

    padding: 17,

    borderWidth: 1,

    borderColor: COLORS.border,

    shadowColor: '#312E81',

    shadowOffset: {
      width: 0,

      height: 7,
    },

    shadowOpacity: 0.05,

    shadowRadius: 14,

    elevation: 3,
  },


  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 10,
  },


  sectionIconContainer: {
    width: 45,

    height: 45,

    borderRadius: 15,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,
  },


  sectionHeading: {
    flex: 1,
  },


  sectionTitle: {
    color: COLORS.text,

    fontSize: 16,

    fontWeight: '900',

    letterSpacing: -0.3,
  },


  sectionSubtitle: {
    marginTop: 2,

    color: COLORS.muted,

    fontSize: 10,

    fontWeight: '500',
  },


  sectionContent: {
    marginTop: 2,
  },


  /* =========================================================
     INFORMATION ROW
  ========================================================= */

  informationRow: {
    minHeight: 72,

    paddingVertical: 11,

    flexDirection: 'row',

    alignItems: 'center',
  },


  informationRowBorder: {
    borderBottomWidth: 1,

    borderBottomColor: '#F1F0F6',
  },


  rowIconContainer: {
    width: 40,

    height: 40,

    borderRadius: 13,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,
  },


  rowContent: {
    flex: 1,
  },


  rowLabel: {
    color: COLORS.muted,

    fontSize: 10,

    fontWeight: '600',
  },


  rowValue: {
    marginTop: 4,

    fontSize: 13,

    lineHeight: 19,

    fontWeight: '800',
  },


  /* =========================================================
     SECURE CARD
  ========================================================= */

  secureCard: {
    marginTop: 17,

    minHeight: 92,

    borderRadius: 21,

    backgroundColor:
      COLORS.successLight,

    borderWidth: 1,

    borderColor: '#A7F3D0',

    padding: 15,

    flexDirection: 'row',

    alignItems: 'center',
  },


  secureIconContainer: {
    width: 50,

    height: 50,

    borderRadius: 17,

    backgroundColor: '#D1FAE5',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 13,
  },


  secureContent: {
    flex: 1,
  },


  secureTitle: {
    color: COLORS.success,

    fontSize: 14,

    fontWeight: '900',
  },


  secureText: {
    marginTop: 4,

    color: '#047857',

    fontSize: 10,

    lineHeight: 16,

    fontWeight: '500',
  },


  /* =========================================================
     FOOTER
  ========================================================= */

  footer: {
    marginTop: 25,

    marginBottom: 8,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 5,
  },


  footerText: {
    color: COLORS.muted,

    fontSize: 10,

    fontWeight: '600',
  },
});