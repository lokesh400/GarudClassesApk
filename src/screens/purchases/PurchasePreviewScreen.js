import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import RazorpayCheckout from 'react-native-razorpay';

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
};


/* ============================================================
   FEATURE DATA
============================================================ */

const COURSE_FEATURES = [
  {
    icon: 'video-outline',
    title: 'HD Video Classes',
    subtitle: 'High-quality recorded lectures',
    color: COLORS.primary,
    background: COLORS.primaryLight,
  },
  {
    icon: 'broadcast',
    title: 'Live Classes',
    subtitle: 'Learn live with your teachers',
    color: COLORS.pink,
    background: COLORS.pinkLight,
  },
  {
    icon: 'file-document-outline',
    title: 'Study Material',
    subtitle: 'Notes and learning attachments',
    color: COLORS.blue,
    background: COLORS.blueLight,
  },
  {
    icon: 'clipboard-check-outline',
    title: 'Practice Tests',
    subtitle: 'Test your preparation regularly',
    color: COLORS.orange,
    background: COLORS.orangeLight,
  },
];

const TEST_FEATURES = [
  {
    icon: 'clipboard-text-outline',
    title: 'Quality Tests',
    subtitle: 'Exam-focused test series',
    color: COLORS.primary,
    background: COLORS.primaryLight,
  },
  {
    icon: 'timer-outline',
    title: 'Real Exam Mode',
    subtitle: 'Practice with timed attempts',
    color: COLORS.pink,
    background: COLORS.pinkLight,
  },
  {
    icon: 'chart-line',
    title: 'Result Analysis',
    subtitle: 'Track your test performance',
    color: COLORS.blue,
    background: COLORS.blueLight,
  },
  {
    icon: 'target',
    title: 'Focused Practice',
    subtitle: 'Improve exam preparation',
    color: COLORS.orange,
    background: COLORS.orangeLight,
  },
];


/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  icon,
  title,
  subtitle,
  color,
  background,
}) {
  return (
    <View style={styles.featureCard}>
      <View
        style={[
          styles.featureIconContainer,
          {
            backgroundColor: background,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={23}
          color={color}
        />
      </View>

      <Text
        style={styles.featureTitle}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        style={styles.featureSubtitle}
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </View>
  );
}


/* ============================================================
   BENEFIT ROW
============================================================ */

function BenefitRow({
  icon,
  title,
  subtitle,
  isLast = false,
}) {
  return (
    <View
      style={[
        styles.benefitRow,
        !isLast && styles.benefitRowBorder,
      ]}
    >
      <View style={styles.benefitIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.benefitContent}>
        <Text style={styles.benefitTitle}>
          {title}
        </Text>

        <Text style={styles.benefitSubtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.checkContainer}>
        <MaterialCommunityIcons
          name="check"
          size={14}
          color={COLORS.success}
        />
      </View>
    </View>
  );
}


/* ============================================================
   PURCHASE PREVIEW SCREEN
============================================================ */

export default function PurchasePreviewScreen({
  route,
  navigation,
}) {
  const { item, type } = route.params;

  const { logout, user } = useAuth();

  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  const isCourse = type === 'course';

  const isFree = Number(item?.price || 0) === 0;

  const features = isCourse
    ? COURSE_FEATURES
    : TEST_FEATURES;


  /* =========================================================
     NAVIGATE TO DETAIL
  ========================================================= */

  const navigateToDetail = () => {
    setLoading(false);

    if (isCourse) {
      navigation.navigate('Study', {
        screen: 'StudyCourseDetail',

        params: {
          courseId: item._id,
          purchased: true,
        },
      });
    } else {
      navigation.replace(
        'TestSeriesDetail',
        {
          item,
        }
      );
    }
  };


  /* =========================================================
     ENROLL / PURCHASE
  ========================================================= */

  const handleEnroll = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      /* =====================================================
         FREE ENROLLMENT
      ===================================================== */

      if (isFree) {
        const res = await apiClient.post(
          '/payments/free-access',
          {
            itemType: isCourse
              ? 'Course'
              : 'TestSeries',

            itemId: item._id,
          }
        );

        if (res.data?.alreadyPurchased) {
          Alert.alert(
            'Already Enrolled',
            'You already have access to this learning content.',
            [
              {
                text: 'Continue',
                onPress: navigateToDetail,
              },
            ]
          );

          return;
        }

        if (res.data?.success) {
          Alert.alert(
            'Enrollment Successful 🎉',
            'You now have access to this learning content.',
            [
              {
                text: 'Start Learning',
                onPress: navigateToDetail,
              },
            ]
          );

          return;
        }

        setLoading(false);

        return;
      }


      /* =====================================================
         CREATE RAZORPAY ORDER
      ===================================================== */

      const orderRes = await apiClient.post(
        '/payments/create-order',
        {
          itemType: isCourse
            ? 'Course'
            : 'TestSeries',

          itemId: item._id,
        }
      );


      if (orderRes.data?.alreadyPurchased) {
        Alert.alert(
          'Already Enrolled',
          'You have already purchased this learning content.',
          [
            {
              text: 'Continue',
              onPress: navigateToDetail,
            },
          ]
        );

        return;
      }


      const {
        orderId,
        amount,
        currency,
        razorpayKeyId,
      } = orderRes.data;


      /* =====================================================
         RAZORPAY OPTIONS
      ===================================================== */

      const options = {
        description: `Purchase ${item.name}`,

        image:
          'https://garudclasses.com/logo.png',

        currency,

        key: razorpayKeyId,

        amount,

        name: 'Garud Classes',

        order_id: orderId,

        prefill: {
          email: user?.email || '',

          contact: user?.mobile || '',

          name: user?.name || '',
        },

        theme: {
          color: COLORS.primary,
        },
      };


      /* =====================================================
         OPEN RAZORPAY
      ===================================================== */

      RazorpayCheckout.open(options)
        .then(async data => {
          try {
            const verifyRes =
              await apiClient.post(
                '/payments/verify',
                {
                  itemType: isCourse
                    ? 'Course'
                    : 'TestSeries',

                  itemId: item._id,

                  paymentId:
                    data.razorpay_payment_id,

                  orderId:
                    data.razorpay_order_id,

                  signature:
                    data.razorpay_signature,
                }
              );


            if (verifyRes.data?.success) {
              Alert.alert(
                'Payment Successful 🎉',
                'Your payment has been verified and access is now active.',
                [
                  {
                    text: 'Start Learning',
                    onPress: navigateToDetail,
                  },
                ]
              );

              return;
            }


            Alert.alert(
              'Verification Failed',
              'Payment verification could not be completed. Please contact support if the amount was deducted.'
            );

            setLoading(false);
          } catch (verifyError) {
            console.log(
              'PAYMENT VERIFY ERROR:',
              verifyError
            );

            Alert.alert(
              'Verification Failed',
              verifyError.response?.data?.message ||
                'Unable to verify your payment. Please contact support if the amount was deducted.'
            );

            setLoading(false);
          }
        })
        .catch(error => {
          console.log(
            'PAYMENT ERROR:',
            error
          );

          Alert.alert(
            'Payment Not Completed',
            error.description ||
              error.message ||
              'The payment was cancelled or could not be completed.'
          );

          setLoading(false);
        });
    } catch (error) {
      if (error.response?.status === 401) {
        logout();

        return;
      }

      console.error(
        'ENROLLMENT ERROR:',
        error.response?.data ||
          error.message
      );

      Alert.alert(
        'Unable to Continue',
        error.response?.data?.message ||
          'Failed to process enrollment. Please try again.'
      );

      setLoading(false);
    }
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />


      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <View style={styles.backgroundCircleOne} />

      <View style={styles.backgroundCircleTwo} />


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              150 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ===================================================
            HERO IMAGE
        =================================================== */}

        <View style={styles.heroContainer}>
          {item?.image ? (
            <Image
              source={{
                uri: item.image,
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
              style={[
                styles.heroImage,
                styles.placeholderImage,
              ]}
            >
              <View
                style={
                  styles.placeholderCircle
                }
              />

              <MaterialCommunityIcons
                name={
                  isCourse
                    ? 'school-outline'
                    : 'clipboard-text-outline'
                }
                size={64}
                color="#DDD6FE"
              />

              <Text
                style={styles.placeholderText}
              >
                Garud Classes
              </Text>
            </LinearGradient>
          )}


          <LinearGradient
            colors={[
              'rgba(17,24,39,0.12)',
              'rgba(33,16,93,0.22)',
              'rgba(33,16,93,0.94)',
            ]}
            locations={[0, 0.45, 1]}
            style={styles.heroOverlay}
          />


          {/* BACK BUTTON */}

          <SafeAreaView
            style={styles.heroHeader}
            edges={['top']}
          >
            <TouchableOpacity
              style={styles.glassButton}
              onPress={() =>
                navigation.goBack()
              }
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>


            <View style={styles.brandBadge}>
              <Image
                source={require(
                  '../../../assets/icon.png'
                )}
                style={styles.brandLogo}
                resizeMode="contain"
              />

              <Text
                style={styles.brandBadgeText}
              >
                GARUD
              </Text>
            </View>
          </SafeAreaView>


          {/* HERO INFORMATION */}

          <View style={styles.heroInformation}>
            <View style={styles.typeBadge}>
              <MaterialCommunityIcons
                name={
                  isCourse
                    ? 'crown-outline'
                    : 'clipboard-check-outline'
                }
                size={14}
                color="#FFFFFF"
              />

              <Text style={styles.typeBadgeText}>
                {isCourse
                  ? 'PREMIUM BATCH'
                  : 'TEST SERIES'}
              </Text>
            </View>

            <Text style={styles.heroSmallText}>
              GARUD CLASSES
            </Text>
          </View>
        </View>


        {/* ===================================================
            MAIN DETAILS
        =================================================== */}

        <View style={styles.detailsContainer}>
          {/* TITLE */}

          <Text style={styles.title}>
            {item?.name ||
              (isCourse
                ? 'Premium Batch'
                : 'Test Series')}
          </Text>


          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color={COLORS.success}
              />

              <Text style={styles.trustText}>
                Verified Content
              </Text>
            </View>

            <View style={styles.trustDot} />

            <View style={styles.trustItem}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={16}
                color={COLORS.orange}
              />

              <Text style={styles.trustText}>
                Instant Access
              </Text>
            </View>
          </View>


          {/* =================================================
              PRICE CARD
          ================================================= */}

          <View style={styles.priceCard}>
            <View style={styles.priceCircleOne} />

            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>
                {isFree
                  ? 'ENROLLMENT PRICE'
                  : 'SPECIAL ACCESS PRICE'}
              </Text>

              <Text
                style={[
                  styles.priceText,
                  isFree && styles.freePriceText,
                ]}
              >
                {isFree
                  ? 'FREE'
                  : `₹${Number(
                      item?.price || 0
                    ).toLocaleString('en-IN')}`}
              </Text>

              <Text style={styles.priceSubtitle}>
                {isFree
                  ? 'Start learning without any payment'
                  : 'One-time secure payment'}
              </Text>
            </View>


            <View style={styles.offerBadge}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={18}
                color={COLORS.success}
              />

              <Text style={styles.offerText}>
                Special Offer
              </Text>
            </View>
          </View>


          {/* =================================================
              WHAT YOU GET
          ================================================= */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                What's Included
              </Text>

              <Text style={styles.sectionSubtitle}>
                Everything you need to prepare
              </Text>
            </View>

            <View style={styles.premiumBadge}>
              <MaterialCommunityIcons
                name="crown-outline"
                size={14}
                color={COLORS.primary}
              />

              <Text
                style={styles.premiumBadgeText}
              >
                PREMIUM
              </Text>
            </View>
          </View>


          <View style={styles.featureGrid}>
            {features.map(feature => (
              <FeatureCard
                key={feature.title}
                {...feature}
              />
            ))}
          </View>


          {/* =================================================
              ACCESS BENEFITS
          ================================================= */}

          <View style={styles.benefitsCard}>
            <View
              style={styles.benefitsHeader}
            >
              <View
                style={
                  styles.benefitsHeaderIcon
                }
              >
                <MaterialCommunityIcons
                  name="rocket-launch-outline"
                  size={23}
                  color={COLORS.primary}
                />
              </View>

              <View>
                <Text
                  style={styles.benefitsTitle}
                >
                  Your Learning Access
                </Text>

                <Text
                  style={
                    styles.benefitsSubtitle
                  }
                >
                  Unlock your preparation
                </Text>
              </View>
            </View>


            {isCourse ? (
              <>
                <BenefitRow
                  icon="broadcast"
                  title="Live Classes"
                  subtitle="Join scheduled live learning sessions"
                />

                <BenefitRow
                  icon="play-circle-outline"
                  title="Class Recordings"
                  subtitle="Watch completed classes again"
                />

                <BenefitRow
                  icon="folder-text-outline"
                  title="Chapters & Lectures"
                  subtitle="Structured subject-wise learning"
                />

                <BenefitRow
                  icon="paperclip"
                  title="Lecture Attachments"
                  subtitle="Access notes and study files"
                />

                <BenefitRow
                  icon="clipboard-check-outline"
                  title="Tests & Results"
                  subtitle="Attempt tests and track results"
                  isLast
                />
              </>
            ) : (
              <>
                <BenefitRow
                  icon="clipboard-text-clock-outline"
                  title="Timed Tests"
                  subtitle="Attempt tests in exam conditions"
                />

                <BenefitRow
                  icon="chart-box-outline"
                  title="Detailed Results"
                  subtitle="View your test performance"
                />

                <BenefitRow
                  icon="target"
                  title="Focused Practice"
                  subtitle="Improve preparation with regular tests"
                  isLast
                />
              </>
            )}
          </View>


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          {!!item?.description && (
            <View style={styles.aboutCard}>
              <View style={styles.aboutHeader}>
                <View style={styles.aboutIcon}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={22}
                    color={COLORS.blue}
                  />
                </View>

                <View>
                  <Text style={styles.aboutTitle}>
                    About this{' '}
                    {isCourse
                      ? 'Batch'
                      : 'Test Series'}
                  </Text>

                  <Text
                    style={styles.aboutSubtitle}
                  >
                    Know more before you enroll
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>
                {item.description}
              </Text>
            </View>
          )}


          {/* =================================================
              SECURE CHECKOUT
          ================================================= */}

          <View style={styles.secureCard}>
            <View style={styles.secureIcon}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={28}
                color={COLORS.success}
              />
            </View>

            <View style={styles.secureContent}>
              <Text style={styles.secureTitle}>
                100% Secure Checkout
              </Text>

              <Text style={styles.secureDescription}>
                {isFree
                  ? 'Your enrollment will be activated instantly.'
                  : 'Secure payment and instant access after successful verification.'}
              </Text>

              {!isFree && (
                <View
                  style={styles.paymentMethods}
                >
                  <View
                    style={
                      styles.paymentMethodBadge
                    }
                  >
                    <Text
                      style={
                        styles.paymentMethodText
                      }
                    >
                      UPI
                    </Text>
                  </View>

                  <View
                    style={
                      styles.paymentMethodBadge
                    }
                  >
                    <Text
                      style={
                        styles.paymentMethodText
                      }
                    >
                      CARDS
                    </Text>
                  </View>

                  <View
                    style={
                      styles.paymentMethodBadge
                    }
                  >
                    <Text
                      style={
                        styles.paymentMethodText
                      }
                    >
                      NETBANKING
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>


          <View style={styles.bottomTrust}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={15}
              color={COLORS.primary}
            />

            <Text style={styles.bottomTrustText}>
              Garud Classes Secure Enrollment
            </Text>
          </View>
        </View>
      </ScrollView>


      {/* =====================================================
          FLOATING PURCHASE FOOTER
      ===================================================== */}

      <View
        style={[
          styles.footer,
          {
            paddingBottom:
              Math.max(insets.bottom, 14),
          },
        ]}
      >
        <View style={styles.footerContent}>
          <View style={styles.footerPrice}>
            <Text
              style={styles.footerPriceLabel}
            >
              {isFree
                ? 'ACCESS'
                : 'TOTAL PRICE'}
            </Text>

            <Text
              style={[
                styles.footerPriceValue,
                isFree &&
                  styles.footerFreePrice,
              ]}
            >
              {isFree
                ? 'FREE'
                : `₹${Number(
                    item?.price || 0
                  ).toLocaleString('en-IN')}`}
            </Text>
          </View>


          <TouchableOpacity
            style={[
              styles.enrollButton,
              isFree &&
                styles.freeEnrollButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={handleEnroll}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.enrollButtonText
                  }
                >
                  {isFree
                    ? 'Enrolling...'
                    : 'Preparing...'}
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={
                    styles.enrollButtonText
                  }
                >
                  {isFree
                    ? 'Enroll Free'
                    : 'Purchase Now'}
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </TouchableOpacity>
        </View>


        <View style={styles.footerSecureRow}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={12}
            color={COLORS.muted}
          />

          <Text style={styles.footerSecureText}>
            {isFree
              ? 'Instant enrollment'
              : 'Secure payment • Instant access'}
          </Text>
        </View>
      </View>
    </View>
  );
}


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },


  scrollView: {
    flex: 1,
  },


  scrollContent: {
    flexGrow: 1,
  },


  /* =========================================================
     BACKGROUND
  ========================================================= */

  backgroundCircleOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#EDE9FE',
    top: 250,
    right: -150,
    opacity: 0.45,
  },


  backgroundCircleTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DDD6FE',
    top: 800,
    left: -100,
    opacity: 0.25,
  },


  /* =========================================================
     HERO
  ========================================================= */

  heroContainer: {
    width: '100%',
    height: 330,
    position: 'relative',
    backgroundColor: COLORS.primaryDark,
    overflow: 'hidden',
  },


  heroImage: {
    width: '100%',
    height: '100%',
  },


  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },


  placeholderCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#8B5CF6',
    top: -80,
    right: -80,
    opacity: 0.35,
  },


  placeholderText: {
    marginTop: 13,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },


  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },


  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  glassButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(17,24,39,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },


  brandBadge: {
    minHeight: 45,
    paddingHorizontal: 8,
    paddingRight: 13,
    borderRadius: 15,
    backgroundColor: 'rgba(17,24,39,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },


  brandLogo: {
    width: 31,
    height: 31,
    borderRadius: 9,
  },


  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },


  heroInformation: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 54,
    alignItems: 'flex-start',
  },


  typeBadge: {
    minHeight: 31,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },


  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },


  heroSmallText: {
    marginTop: 10,
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },


  /* =========================================================
     DETAILS
  ========================================================= */

  detailsContainer: {
    marginTop: -32,
    paddingHorizontal: 20,
    paddingTop: 27,
    minHeight: 600,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },


  title: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.7,
  },


  trustRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },


  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  trustText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },


  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 10,
    backgroundColor: '#D1D5DB',
  },


  /* =========================================================
     PRICE
  ========================================================= */

  priceCard: {
    minHeight: 125,
    marginTop: 22,
    borderRadius: 24,
    backgroundColor: COLORS.primaryDark,
    padding: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },


  priceCircleOne: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: -45,
    top: -65,
    backgroundColor: COLORS.primary,
    opacity: 0.65,
  },


  priceContent: {
    flex: 1,
  },


  priceLabel: {
    color: '#C4B5FD',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },


  priceText: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.7,
  },


  freePriceText: {
    color: '#A7F3D0',
  },


  priceSubtitle: {
    marginTop: 3,
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '500',
  },


  offerBadge: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },


  offerText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '900',
  },


  /* =========================================================
     SECTION HEADER
  ========================================================= */

  sectionHeader: {
    marginTop: 29,
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


  premiumBadge: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },


  premiumBadgeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },


  /* =========================================================
     FEATURES
  ========================================================= */

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },


  featureCard: {
    width: '48.3%',
    minHeight: 145,
    marginBottom: 12,
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
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },


  featureIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },


  featureTitle: {
    marginTop: 13,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
  },


  featureSubtitle: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '500',
  },


  /* =========================================================
     BENEFITS
  ========================================================= */

  benefitsCard: {
    marginTop: 12,
    padding: 17,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
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


  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },


  benefitsHeaderIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },


  benefitsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },


  benefitsSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '500',
  },


  benefitRow: {
    minHeight: 70,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },


  benefitRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F6',
  },


  benefitIcon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },


  benefitContent: {
    flex: 1,
  },


  benefitTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },


  benefitSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '500',
  },


  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },


  /* =========================================================
     ABOUT
  ========================================================= */

  aboutCard: {
    marginTop: 17,
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
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },


  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  aboutIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },


  aboutTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },


  aboutSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '500',
  },


  description: {
    marginTop: 17,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '500',
  },


  /* =========================================================
     SECURE
  ========================================================= */

  secureCard: {
    marginTop: 17,
    padding: 17,
    minHeight: 110,
    borderRadius: 23,
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },


  secureIcon: {
    width: 52,
    height: 52,
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


  secureDescription: {
    marginTop: 4,
    color: '#047857',
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '500',
  },


  paymentMethods: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },


  paymentMethodBadge: {
    minHeight: 23,
    paddingHorizontal: 7,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },


  paymentMethodText: {
    color: COLORS.success,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },


  bottomTrust: {
    marginTop: 23,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },


  bottomTrustText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },


  /* =========================================================
     FOOTER
  ========================================================= */

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 13,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#21105D',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 20,
  },


  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  footerPrice: {
    minWidth: 93,
    marginRight: 13,
  },


  footerPriceLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },


  footerPriceValue: {
    marginTop: 2,
    color: COLORS.primaryDark,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },


  footerFreePrice: {
    color: COLORS.success,
  },


  enrollButton: {
    flex: 1,
    height: 57,
    borderRadius: 18,
    paddingHorizontal: 17,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },


  freeEnrollButton: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },


  disabledButton: {
    opacity: 0.65,
  },


  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },


  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },


  footerSecureRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },


  footerSecureText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '600',
  },
});