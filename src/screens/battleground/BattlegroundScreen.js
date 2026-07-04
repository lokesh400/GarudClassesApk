import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import AppHeader from '../../components/AppHeader';
import apiClient from '../../api/client';


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

  red: '#DC2626',
  redLight: '#FEE2E2',
};


const streakBadges = [
  {
    days: 3,
    label: 'Starter',
  },
  {
    days: 7,
    label: 'Warrior',
  },
  {
    days: 30,
    label: 'Champion',
  },
];


export default function BattlegroundScreen({
  navigation,
}) {

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    battlegrounds,
    setBattlegrounds,
  ] = useState([]);

  const [streak, setStreak] =
    useState({
      currentStreak: 0,
      bestStreak: 0,
      totalAttempts: 0,
      totalCorrect: 0,
    });

  const [
    submittedSubjects,
    setSubmittedSubjects,
  ] = useState([]);

  const [
    submittedItemIds,
    setSubmittedItemIds,
  ] = useState([]);

  const [dateKey, setDateKey] =
    useState('');

  const [classLevel, setClassLevel] =
    useState('');


  // =========================================================
  // GROUP BATTLEGROUNDS
  // =========================================================

  const groupedByClass = useMemo(() => {

    const groups = {};


    battlegrounds.forEach((item) => {

      const key = String(
        item.classLevel ||
        'Uncategorized'
      );


      if (!groups[key]) {

        groups[key] = [];

      }


      groups[key].push(item);

    });


    const classOrder = (label) => {

      const txt = String(
        label || ''
      ).toLowerCase();


      const found =
        txt.match(/(\d+)/);


      if (found) {

        return Number(found[1]);

      }


      if (
        txt.includes('dropper')
      ) {

        return 99;

      }


      return 100;

    };


    return Object
      .entries(groups)
      .sort(
        (a, b) =>
          classOrder(a[0]) -
          classOrder(b[0])
      )
      .map(
        ([groupClass, items]) => ({
          groupClass,
          items,
        })
      );

  }, [battlegrounds]);


  // =========================================================
  // FETCH TODAY QUIZ
  // =========================================================

  const fetchTodayQuiz =
    useCallback(

      async (isRefresh = false) => {

        if (isRefresh) {

          setRefreshing(true);

        } else {

          setLoading(true);

        }


        try {

          const res =
            await apiClient.get(
              '/battlegrounds/today'
            );


          const list =

            res.data?.battlegrounds

            ||

            res.data?.quizzes

            ||

            (
              res.data?.quiz

                ? [res.data.quiz]

                : []
            );


          setBattlegrounds(
            Array.isArray(list)
              ? list
              : []
          );


          setStreak({

            currentStreak:
              Number(
                res.data?.streak
                  ?.currentStreak || 0
              ),

            bestStreak:
              Number(
                res.data?.streak
                  ?.bestStreak || 0
              ),

            totalAttempts:
              Number(
                res.data?.streak
                  ?.totalAttempts || 0
              ),

            totalCorrect:
              Number(
                res.data?.streak
                  ?.totalCorrect || 0
              ),

          });


          setSubmittedSubjects(

            Array.isArray(
              res.data
                ?.submittedSubjects
            )

              ? res.data
                .submittedSubjects

              : []

          );


          setSubmittedItemIds(

            Array.isArray(
              res.data
                ?.submittedItemIds
            )

              ? res.data
                .submittedItemIds
                .map(
                  (id) =>
                    String(id)
                )

              : []

          );


          setDateKey(
            res.data?.dateKey || ''
          );


          setClassLevel(
            res.data?.classLevel || ''
          );


        } catch (err) {

          console.log(
            'Battleground Error:',
            err?.response?.data ||
            err?.message
          );


          Alert.alert(

            'Unable to Load',

            err?.response?.data?.message

            ||

            'Failed to load battleground quiz.'

          );


        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },

      []

    );


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    fetchTodayQuiz();

  }, [fetchTodayQuiz]);


  // =========================================================
  // REFRESH ON SCREEN FOCUS
  // =========================================================

  useFocusEffect(

    useCallback(() => {

      fetchTodayQuiz();

    }, [fetchTodayQuiz])

  );


  // =========================================================
  // PULL TO REFRESH
  // =========================================================

  const onRefresh =
    useCallback(() => {

      fetchTodayQuiz(true);

    }, [fetchTodayQuiz]);


  // =========================================================
  // ACCURACY
  // =========================================================

  const accuracy =

    streak.totalAttempts > 0

      ? Math.round(

        (
          streak.totalCorrect /
          streak.totalAttempts
        ) * 100

      )

      : 0;


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >

        <StatusBar

          barStyle="light-content"

          backgroundColor={
            COLORS.primaryDark
          }

        />


        <AppHeader

          title="Battleground"

          navigation={navigation}

          showBack

        />


        <View style={styles.centerState}>


          <View
            style={styles.loadingIcon}
          >

            <ActivityIndicator

              size="large"

              color={COLORS.primary}

            />

          </View>


          <Text style={styles.loadingTitle}>

            Preparing Battleground

          </Text>


          <Text
            style={styles.loadingDescription}
          >

            Loading today's challenges...

          </Text>


        </View>


      </SafeAreaView>

    );

  }


  // =========================================================
  // UI
  // =========================================================

  return (

    <>

      <StatusBar

        barStyle="light-content"

        backgroundColor={
          COLORS.primaryDark
        }

      />


      <SafeAreaView

        style={styles.safeArea}

        edges={['top']}

      >


        <AppHeader

          title="Battleground"

          navigation={navigation}

          showBack

          right={

            <View
              style={styles.headerRightWrap}
            >


              <View
                style={
                  styles.streakHeaderPill
                }
              >


                <MaterialCommunityIcons

                  name="fire"

                  size={16}

                  color={COLORS.orange}

                />


                <Text
                  style={
                    styles.streakHeaderText
                  }
                >

                  {streak.currentStreak}

                </Text>


              </View>


              <TouchableOpacity

                style={styles.helpTopBtn}

                activeOpacity={0.82}

                onPress={() =>

                  navigation.navigate(

                    'BattlegroundPrizes',

                    {

                      currentStreak:
                        streak.currentStreak,

                    }

                  )

                }

              >


                <MaterialCommunityIcons

                  name="trophy-outline"

                  size={19}

                  color={COLORS.primary}

                />


              </TouchableOpacity>


              <Image

                source={require(
                  '../../../assets/icon.png'
                )}

                style={styles.headerLogo}

              />


            </View>

          }

        />


        <ScrollView

          style={styles.scrollView}

          contentContainerStyle={
            styles.scrollContent
          }

          showsVerticalScrollIndicator={
            false
          }

          refreshControl={

            <RefreshControl

              refreshing={refreshing}

              onRefresh={onRefresh}

              tintColor={COLORS.primary}

              colors={[COLORS.primary]}

            />

          }

        >


          {/* =================================================
              HERO
          ================================================= */}


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

            style={styles.heroCard}

          >


            <View style={styles.heroCircleOne} />

            <View style={styles.heroCircleTwo} />


            <View style={styles.heroTopRow}>


              <View style={styles.heroTag}>


                <MaterialCommunityIcons

                  name="sword-cross"

                  size={13}

                  color="#FFFFFF"

                />


                <Text style={styles.heroTagText}>

                  DAILY COMBAT ARENA

                </Text>


              </View>


              <View style={styles.heroFireWrap}>


                <MaterialCommunityIcons

                  name="fire"

                  size={27}

                  color="#FFFFFF"

                />


              </View>


            </View>


            <Text style={styles.heroTitle}>

              Ready for Today's Battle?

            </Text>


            <Text style={styles.heroSubtitle}>

              Attempt your subject challenges,
              test your preparation and protect
              your daily streak.

            </Text>


            <View style={styles.heroMetaRow}>


              <View style={styles.heroMetaItem}>


                <MaterialCommunityIcons

                  name="school-outline"

                  size={16}

                  color="#DDD6FE"

                />


                <View>


                  <Text
                    style={styles.heroMetaLabel}
                  >

                    CLASS

                  </Text>


                  <Text
                    style={styles.heroMetaValue}
                  >

                    {classLevel || '-'}

                  </Text>


                </View>


              </View>


              <View style={styles.heroDivider} />


              <View style={styles.heroMetaItem}>


                <MaterialCommunityIcons

                  name="calendar-outline"

                  size={16}

                  color="#DDD6FE"

                />


                <View>


                  <Text
                    style={styles.heroMetaLabel}
                  >

                    BATTLE DATE

                  </Text>


                  <Text
                    style={styles.heroMetaValue}
                  >

                    {dateKey || '-'}

                  </Text>


                </View>


              </View>


            </View>


          </LinearGradient>


          {/* =================================================
              STREAK SECTION
          ================================================= */}


          <View style={styles.sectionHeader}>


            <View>


              <Text style={styles.sectionTitle}>

                Battle Performance

              </Text>


              <Text style={styles.sectionSubtitle}>

                Track your daily combat progress

              </Text>


            </View>


            <View style={styles.fireBadge}>


              <MaterialCommunityIcons

                name="fire"

                size={16}

                color={COLORS.orange}

              />


              <Text style={styles.fireBadgeText}>

                {streak.currentStreak} day streak

              </Text>


            </View>


          </View>


          {/* =================================================
              MAIN STREAK CARD
          ================================================= */}


          <View style={styles.streakCard}>


            <LinearGradient

              colors={[

                COLORS.primarySoft,

                '#FFFFFF',

              ]}

              style={styles.streakTop}

            >


              <View style={styles.streakIcon}>


                <MaterialCommunityIcons

                  name="fire"

                  size={31}

                  color={COLORS.orange}

                />


              </View>


              <View style={styles.streakInfo}>


                <Text
                  style={styles.streakLabel}
                >

                  CURRENT STREAK

                </Text>


                <View
                  style={styles.streakValueRow}
                >


                  <Text
                    style={styles.streakValue}
                  >

                    {streak.currentStreak}

                  </Text>


                  <Text
                    style={styles.streakDays}
                  >

                    days

                  </Text>


                </View>


                <Text
                  style={
                    styles.streakDescription
                  }
                >

                  Keep battling every day to
                  maintain your streak.

                </Text>


              </View>


              <View style={styles.bestWrap}>


                <Text style={styles.bestLabel}>

                  BEST

                </Text>


                <Text style={styles.bestValue}>

                  {streak.bestStreak}

                </Text>


              </View>


            </LinearGradient>


            <View style={styles.badgesSection}>


              <Text style={styles.badgesTitle}>

                STREAK MILESTONES

              </Text>


              <View style={styles.streakBadgeRow}>


                {streakBadges.map((badge) => {

                  const unlocked =

                    streak.bestStreak >=
                    badge.days;


                  return (

                    <View

                      key={badge.days}

                      style={[

                        styles.milestoneCard,

                        unlocked &&
                        styles
                          .milestoneCardUnlocked,

                      ]}

                    >


                      <View

                        style={[

                          styles.milestoneIcon,

                          unlocked &&
                          styles
                            .milestoneIconUnlocked,

                        ]}

                      >


                        <MaterialCommunityIcons

                          name={
                            unlocked

                              ? 'fire'

                              : 'lock-outline'
                          }

                          size={18}

                          color={
                            unlocked

                              ? COLORS.orange

                              : COLORS.textMuted
                          }

                        />


                      </View>


                      <Text

                        style={[

                          styles.milestoneDays,

                          unlocked &&
                          styles
                            .milestoneDaysUnlocked,

                        ]}

                      >

                        {badge.days} Days

                      </Text>


                      <Text
                        style={
                          styles.milestoneLabel
                        }
                      >

                        {badge.label}

                      </Text>


                    </View>

                  );

                })}


              </View>


            </View>


          </View>


          {/* =================================================
              STATS
          ================================================= */}


          <View style={styles.statsGrid}>


            <View style={styles.statCard}>


              <View

                style={[

                  styles.statIcon,

                  {
                    backgroundColor:
                      COLORS.primaryLight,
                  },

                ]}

              >


                <MaterialCommunityIcons

                  name="sword-cross"

                  size={21}

                  color={COLORS.primary}

                />


              </View>


              <Text style={styles.statValue}>

                {streak.totalAttempts}

              </Text>


              <Text style={styles.statLabel}>

                Battles

              </Text>


            </View>


            <View style={styles.statCard}>


              <View

                style={[

                  styles.statIcon,

                  {
                    backgroundColor:
                      COLORS.successLight,
                  },

                ]}

              >


                <MaterialCommunityIcons

                  name="check-circle-outline"

                  size={21}

                  color={COLORS.success}

                />


              </View>


              <Text style={styles.statValue}>

                {streak.totalCorrect}

              </Text>


              <Text style={styles.statLabel}>

                Correct

              </Text>


            </View>


            <View style={styles.statCard}>


              <View

                style={[

                  styles.statIcon,

                  {
                    backgroundColor:
                      COLORS.orangeLight,
                  },

                ]}

              >


                <MaterialCommunityIcons

                  name="target"

                  size={21}

                  color={COLORS.orange}

                />


              </View>


              <Text style={styles.statValue}>

                {accuracy}%

              </Text>


              <Text style={styles.statLabel}>

                Accuracy

              </Text>


            </View>


          </View>


          {/* =================================================
              BATTLEGROUNDS
          ================================================= */}


          <View style={styles.sectionHeader}>


            <View>


              <Text style={styles.sectionTitle}>

                Today's Battlegrounds

              </Text>


              <Text style={styles.sectionSubtitle}>

                Choose a subject and enter battle

              </Text>


            </View>


            <View style={styles.quizCountBadge}>


              <Text
                style={styles.quizCountText}
              >

                {battlegrounds.length}

              </Text>


              <Text
                style={styles.quizCountLabel}
              >

                QUIZZES

              </Text>


            </View>


          </View>


          {groupedByClass.length ? (


            groupedByClass.map((group) => (


              <View

                key={group.groupClass}

                style={styles.classBlock}

              >


                <View style={styles.classHeader}>


                  <View
                    style={styles.classIcon}
                  >


                    <MaterialCommunityIcons

                      name="school-outline"

                      size={19}

                      color={COLORS.primary}

                    />


                  </View>


                  <View style={styles.classInfo}>


                    <Text
                      style={styles.classHeading}
                    >

                      {group.groupClass}

                    </Text>


                    <Text
                      style={styles.classSubtext}
                    >

                      {group.items.length}{' '}

                      {group.items.length === 1
                        ? 'subject challenge'
                        : 'subject challenges'}

                    </Text>


                  </View>


                </View>


                {group.items.map((item) => {


                  const itemId = String(
                    item._id || ''
                  );


                  const isSubmitted =

                    submittedSubjects.includes(
                      item.subjectKey
                    )

                    ||

                    submittedItemIds.includes(
                      itemId
                    );


                  return (

                    <TouchableOpacity

                      key={itemId}

                      style={styles.quizCard}

                      activeOpacity={
                        isSubmitted
                          ? 1
                          : 0.84
                      }

                      onPress={() => {

                        if (!isSubmitted) {

                          navigation.navigate(

                            'BattlegroundAttempt',

                            { item }

                          );

                        }

                      }}

                    >


                      <View

                        style={[

                          styles.quizIconWrap,

                          isSubmitted &&
                          styles
                            .quizIconCompleted,

                        ]}

                      >


                        <MaterialCommunityIcons

                          name={
                            isSubmitted

                              ? 'check'

                              : 'sword-cross'
                          }

                          size={22}

                          color={
                            isSubmitted

                              ? COLORS.success

                              : COLORS.primary
                          }

                        />


                      </View>


                      <View style={styles.quizContent}>


                        <View
                          style={styles.subjectRow}
                        >


                          <Text
                            style={
                              styles.subjectName
                            }
                          >

                            {String(

                              item.subjectKey ||
                              'Subject'

                            )
                              .replace(
                                /[-_]/g,
                                ' '
                              )
                              .toUpperCase()}

                          </Text>


                          {isSubmitted && (


                            <View
                              style={
                                styles.completedBadge
                              }
                            >


                              <MaterialCommunityIcons

                                name="check-circle"

                                size={12}

                                color={
                                  COLORS.success
                                }

                              />


                              <Text
                                style={
                                  styles.completedText
                                }
                              >

                                DONE

                              </Text>


                            </View>


                          )}


                        </View>


                        <Text
                          style={styles.quizHint}
                        >

                          {isSubmitted

                            ? 'Battle completed for today'

                            : "Today's challenge is ready"}

                        </Text>


                      </View>


                      <View

                        style={[

                          styles.actionButton,

                          isSubmitted &&
                          styles
                            .actionButtonCompleted,

                        ]}

                      >


                        <MaterialCommunityIcons

                          name={
                            isSubmitted

                              ? 'check'

                              : 'arrow-right'
                          }

                          size={19}

                          color={
                            isSubmitted

                              ? COLORS.success

                              : '#FFFFFF'
                          }

                        />


                      </View>


                    </TouchableOpacity>

                  );

                })}


              </View>


            ))


          ) : (


            <View style={styles.emptyCard}>


              <View style={styles.emptyIcon}>


                <MaterialCommunityIcons

                  name="sword-cross"

                  size={36}

                  color={COLORS.primary}

                />


              </View>


              <Text style={styles.emptyTitle}>

                No Battle Today

              </Text>


              <Text style={styles.emptyText}>

                Today's battleground has not
                opened yet. Pull down to refresh
                and check again.

              </Text>


              <TouchableOpacity

                style={styles.refreshButton}

                activeOpacity={0.85}

                onPress={() =>
                  fetchTodayQuiz()
                }

              >


                <MaterialCommunityIcons

                  name="refresh"

                  size={18}

                  color="#FFFFFF"

                />


                <Text
                  style={
                    styles.refreshButtonText
                  }
                >

                  Check Again

                </Text>


              </TouchableOpacity>


            </View>


          )}


        </ScrollView>


      </SafeAreaView>

    </>

  );

}


const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor:
      COLORS.background,

  },


  scrollView: {

    flex: 1,

    backgroundColor:
      COLORS.background,

  },


  scrollContent: {

    flexGrow: 1,

    paddingBottom: 125,

  },


  headerRightWrap: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 7,

  },


  streakHeaderPill: {

    minHeight: 31,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      COLORS.orangeLight,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: '#FED7AA',

    paddingHorizontal: 8,

    gap: 3,

  },


  streakHeaderText: {

    color: '#9A3412',

    fontSize: 11,

    fontWeight: '900',

  },


  helpTopBtn: {

    width: 31,

    height: 31,

    borderRadius: 10,

    backgroundColor:
      COLORS.primarySoft,

    borderWidth: 1,

    borderColor: '#DDD6FE',

    alignItems: 'center',

    justifyContent: 'center',

  },


  headerLogo: {

    width: 31,

    height: 31,

    borderRadius: 9,

  },


  centerState: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 25,

  },


  loadingIcon: {

    width: 76,

    height: 76,

    borderRadius: 25,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

  },


  loadingTitle: {

    color: COLORS.text,

    fontSize: 18,

    fontWeight: '900',

    marginTop: 17,

  },


  loadingDescription: {

    color: COLORS.textSecondary,

    fontSize: 11,

    fontWeight: '600',

    marginTop: 5,

  },


  heroCard: {

    marginHorizontal: 15,

    marginTop: 15,

    borderRadius: 23,

    padding: 19,

    overflow: 'hidden',

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 8,

    },

    shadowOpacity: 0.18,

    shadowRadius: 16,

    elevation: 7,

  },


  heroCircleOne: {

    position: 'absolute',

    width: 150,

    height: 150,

    borderRadius: 75,

    backgroundColor:
      'rgba(255,255,255,0.08)',

    right: -50,

    top: -60,

  },


  heroCircleTwo: {

    position: 'absolute',

    width: 100,

    height: 100,

    borderRadius: 50,

    backgroundColor:
      'rgba(255,255,255,0.06)',

    left: -35,

    bottom: -50,

  },


  heroTopRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },


  heroTag: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    backgroundColor:
      'rgba(255,255,255,0.15)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.16)',

    borderRadius: 8,

    paddingHorizontal: 9,

    paddingVertical: 6,

  },


  heroTagText: {

    color: '#FFFFFF',

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.8,

  },


  heroFireWrap: {

    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor:
      'rgba(255,255,255,0.14)',

    alignItems: 'center',

    justifyContent: 'center',

  },


  heroTitle: {

    color: '#FFFFFF',

    fontSize: 24,

    lineHeight: 30,

    fontWeight: '900',

    marginTop: 20,

    maxWidth: '85%',

  },


  heroSubtitle: {

    color: '#DDD6FE',

    fontSize: 10,

    lineHeight: 16,

    fontWeight: '600',

    marginTop: 8,

    maxWidth: '90%',

  },


  heroMetaRow: {

    minHeight: 58,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.11)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.12)',

    borderRadius: 15,

    marginTop: 17,

    paddingHorizontal: 13,

  },


  heroMetaItem: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

  },


  heroMetaLabel: {

    color: '#C4B5FD',

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.7,

  },


  heroMetaValue: {

    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '800',

    marginTop: 2,

  },


  heroDivider: {

    width: 1,

    height: 30,

    backgroundColor:
      'rgba(255,255,255,0.18)',

    marginHorizontal: 11,

  },


  sectionHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginHorizontal: 15,

    marginTop: 23,

    marginBottom: 13,

  },


  sectionTitle: {

    color: COLORS.text,

    fontSize: 19,

    fontWeight: '900',

  },


  sectionSubtitle: {

    color: COLORS.textSecondary,

    fontSize: 9,

    fontWeight: '600',

    marginTop: 4,

  },


  fireBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      COLORS.orangeLight,

    borderRadius: 9,

    paddingHorizontal: 8,

    paddingVertical: 6,

    gap: 4,

  },


  fireBadgeText: {

    color: '#9A3412',

    fontSize: 8,

    fontWeight: '900',

  },


  streakCard: {

    marginHorizontal: 15,

    backgroundColor: COLORS.white,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    overflow: 'hidden',

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 5,

    },

    shadowOpacity: 0.05,

    shadowRadius: 10,

    elevation: 3,

  },


  streakTop: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 15,

  },


  streakIcon: {

    width: 58,

    height: 58,

    borderRadius: 19,

    backgroundColor:
      COLORS.orangeLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,

  },


  streakInfo: {

    flex: 1,

  },


  streakLabel: {

    color: COLORS.primary,

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.8,

  },


  streakValueRow: {

    flexDirection: 'row',

    alignItems: 'baseline',

    gap: 4,

    marginTop: 1,

  },


  streakValue: {

    color: COLORS.text,

    fontSize: 28,

    fontWeight: '900',

  },


  streakDays: {

    color: COLORS.textSecondary,

    fontSize: 10,

    fontWeight: '700',

  },


  streakDescription: {

    color: COLORS.textMuted,

    fontSize: 8,

    lineHeight: 13,

    fontWeight: '600',

    marginTop: 2,

  },


  bestWrap: {

    minWidth: 52,

    backgroundColor:
      COLORS.primaryLight,

    borderRadius: 13,

    paddingHorizontal: 10,

    paddingVertical: 9,

    alignItems: 'center',

  },


  bestLabel: {

    color: COLORS.primary,

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.6,

  },


  bestValue: {

    color: COLORS.primaryDark,

    fontSize: 20,

    fontWeight: '900',

    marginTop: 2,

  },


  badgesSection: {

    borderTopWidth: 1,

    borderTopColor: '#F1F5F9',

    padding: 14,

  },


  badgesTitle: {

    color: COLORS.textMuted,

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.8,

    marginBottom: 10,

  },


  streakBadgeRow: {

    flexDirection: 'row',

    gap: 8,

  },


  milestoneCard: {

    flex: 1,

    minHeight: 80,

    backgroundColor: '#F8FAFC',

    borderRadius: 13,

    borderWidth: 1,

    borderColor: '#E2E8F0',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 5,

  },


  milestoneCardUnlocked: {

    backgroundColor:
      COLORS.orangeLight,

    borderColor: '#FED7AA',

  },


  milestoneIcon: {

    width: 29,

    height: 29,

    borderRadius: 10,

    backgroundColor: '#F1F5F9',

    alignItems: 'center',

    justifyContent: 'center',

  },


  milestoneIconUnlocked: {

    backgroundColor: '#FFFFFF',

  },


  milestoneDays: {

    color: COLORS.textMuted,

    fontSize: 9,

    fontWeight: '900',

    marginTop: 6,

  },


  milestoneDaysUnlocked: {

    color: '#9A3412',

  },


  milestoneLabel: {

    color: COLORS.textMuted,

    fontSize: 6,

    fontWeight: '700',

    marginTop: 2,

  },


  statsGrid: {

    flexDirection: 'row',

    gap: 8,

    marginHorizontal: 15,

    marginTop: 11,

  },


  statCard: {

    flex: 1,

    minHeight: 111,

    backgroundColor: COLORS.white,

    borderRadius: 17,

    borderWidth: 1,

    borderColor: COLORS.border,

    padding: 11,

    alignItems: 'center',

    justifyContent: 'center',

  },


  statIcon: {

    width: 37,

    height: 37,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

  },


  statValue: {

    color: COLORS.text,

    fontSize: 19,

    fontWeight: '900',

    marginTop: 7,

  },


  statLabel: {

    color: COLORS.textSecondary,

    fontSize: 8,

    fontWeight: '700',

    marginTop: 2,

  },


  quizCountBadge: {

    minWidth: 49,

    backgroundColor:
      COLORS.primaryLight,

    borderRadius: 11,

    paddingHorizontal: 8,

    paddingVertical: 6,

    alignItems: 'center',

  },


  quizCountText: {

    color: COLORS.primaryDark,

    fontSize: 15,

    fontWeight: '900',

  },


  quizCountLabel: {

    color: COLORS.primary,

    fontSize: 5,

    fontWeight: '900',

    letterSpacing: 0.6,

  },


  classBlock: {

    marginHorizontal: 15,

    backgroundColor: COLORS.white,

    borderRadius: 19,

    borderWidth: 1,

    borderColor: COLORS.border,

    padding: 13,

    marginBottom: 12,

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 4,

    },

    shadowOpacity: 0.04,

    shadowRadius: 8,

    elevation: 2,

  },


  classHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 12,

  },


  classIcon: {

    width: 42,

    height: 42,

    borderRadius: 14,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

  },


  classInfo: {

    flex: 1,

  },


  classHeading: {

    color: COLORS.text,

    fontSize: 14,

    fontWeight: '900',

  },


  classSubtext: {

    color: COLORS.textMuted,

    fontSize: 8,

    fontWeight: '600',

    marginTop: 3,

  },


  quizCard: {

    minHeight: 76,

    backgroundColor:
      COLORS.primarySoft,

    borderRadius: 15,

    borderWidth: 1,

    borderColor: '#EDE9FE',

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 11,

    paddingVertical: 10,

    marginBottom: 8,

  },


  quizIconWrap: {

    width: 45,

    height: 45,

    borderRadius: 14,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  quizIconCompleted: {

    backgroundColor:
      COLORS.successLight,

  },


  quizContent: {

    flex: 1,

  },


  subjectRow: {

    flexDirection: 'row',

    alignItems: 'center',

    flexWrap: 'wrap',

    gap: 6,

  },


  subjectName: {

    color: COLORS.text,

    fontSize: 12,

    fontWeight: '900',

    letterSpacing: 0.3,

  },


  completedBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      COLORS.successLight,

    borderRadius: 6,

    paddingHorizontal: 5,

    paddingVertical: 3,

    gap: 2,

  },


  completedText: {

    color: COLORS.success,

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.5,

  },


  quizHint: {

    color: COLORS.textSecondary,

    fontSize: 8,

    fontWeight: '600',

    marginTop: 5,

  },


  actionButton: {

    width: 39,

    height: 39,

    borderRadius: 13,

    backgroundColor:
      COLORS.primary,

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 8,

  },


  actionButtonCompleted: {

    backgroundColor:
      COLORS.successLight,

  },


  emptyCard: {

    marginHorizontal: 15,

    backgroundColor: COLORS.white,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    alignItems: 'center',

    paddingHorizontal: 25,

    paddingVertical: 30,

  },


  emptyIcon: {

    width: 73,

    height: 73,

    borderRadius: 24,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

  },


  emptyTitle: {

    color: COLORS.text,

    fontSize: 18,

    fontWeight: '900',

    marginTop: 15,

  },


  emptyText: {

    color: COLORS.textSecondary,

    fontSize: 10,

    lineHeight: 16,

    fontWeight: '600',

    textAlign: 'center',

    marginTop: 6,

  },


  refreshButton: {

    minHeight: 43,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

    backgroundColor:
      COLORS.primary,

    borderRadius: 12,

    paddingHorizontal: 17,

    marginTop: 17,

  },


  refreshButtonText: {

    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '900',

  },

});