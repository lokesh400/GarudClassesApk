import React, { useMemo } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import AppHeader from '../../components/AppHeader';


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
  successDark: '#166534',
  successLight: '#DCFCE7',

  orange: '#EA580C',
  orangeDark: '#9A3412',
  orangeLight: '#FFEDD5',

  yellow: '#CA8A04',
  yellowLight: '#FEF9C3',
};


const PRIZE_MILESTONES = [

  {
    days: 50,
    prize: 'Garud Classes Bottle',
    icon: 'bottle-soda-outline',
    note: 'Hydrate while you grind every day.',
    level: 'STARTER REWARD',
  },

  {
    days: 100,
    prize: 'Garud Classes T-Shirt',
    icon: 'tshirt-crew-outline',
    note: 'Wear your streak with pride.',
    level: 'WARRIOR REWARD',
  },

  {
    days: 200,
    prize: 'Mystery Box',
    icon: 'gift-outline',
    note: 'A surprise reward for elite consistency.',
    level: 'ELITE REWARD',
  },

  {
    days: 365,
    prize: 'Garud Classes Jacket',
    icon: 'hanger',
    note: 'Legendary yearly streak unlock.',
    level: 'LEGENDARY REWARD',
  },

];


export default function BattlegroundPrizesScreen({
  navigation,
  route,
}) {

  const currentStreak = Number(
    route.params?.currentStreak || 0
  );


  // =========================================================
  // NEXT MILESTONE
  // =========================================================

  const nextMilestone = useMemo(

    () =>

      PRIZE_MILESTONES.find(

        (milestone) =>
          currentStreak < milestone.days

      ) || null,

    [currentStreak]

  );


  // =========================================================
  // ROADMAP PROGRESS
  // =========================================================

  const roadmapProgress = useMemo(() => {

    const maxDays =

      PRIZE_MILESTONES[
        PRIZE_MILESTONES.length - 1
      ].days;


    return Math.min(

      100,

      Math.max(

        0,

        (currentStreak / maxDays) * 100

      )

    );

  }, [currentStreak]);


  // =========================================================
  // UNLOCKED REWARDS
  // =========================================================

  const unlockedRewards = useMemo(

    () =>

      PRIZE_MILESTONES.filter(

        (milestone) =>
          currentStreak >= milestone.days

      ).length,

    [currentStreak]

  );


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

          title="Prizes Roadmap"

          navigation={navigation}

          showBack

        />


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

                  name="trophy-outline"

                  size={13}

                  color="#FFFFFF"

                />


                <Text style={styles.heroTagText}>

                  BATTLEGROUND REWARDS

                </Text>


              </View>


              <View style={styles.heroGiftIcon}>


                <MaterialCommunityIcons

                  name="gift-outline"

                  size={29}

                  color="#FFFFFF"

                />


              </View>


            </View>


            <Text style={styles.heroTitle}>

              Your Streak.{'\n'}Your Rewards.

            </Text>


            <Text style={styles.heroSubtitle}>

              Maintain your daily battleground
              streak and unlock exclusive Garud
              Classes rewards.

            </Text>


            <View style={styles.heroStats}>


              <View style={styles.heroStatItem}>


                <Text style={styles.heroStatLabel}>

                  CURRENT STREAK

                </Text>


                <View style={styles.heroStatValueRow}>


                  <MaterialCommunityIcons

                    name="fire"

                    size={18}

                    color="#FDBA74"

                  />


                  <Text style={styles.heroStatValue}>

                    {currentStreak}

                  </Text>


                  <Text style={styles.heroStatUnit}>

                    days

                  </Text>


                </View>


              </View>


              <View style={styles.heroDivider} />


              <View style={styles.heroStatItem}>


                <Text style={styles.heroStatLabel}>

                  REWARDS UNLOCKED

                </Text>


                <View style={styles.heroStatValueRow}>


                  <MaterialCommunityIcons

                    name="gift-outline"

                    size={17}

                    color="#DDD6FE"

                  />


                  <Text style={styles.heroStatValue}>

                    {unlockedRewards}

                  </Text>


                  <Text style={styles.heroStatUnit}>

                    / {PRIZE_MILESTONES.length}

                  </Text>


                </View>


              </View>


            </View>


          </LinearGradient>


          {/* =================================================
              NEXT REWARD
          ================================================= */}


          {nextMilestone ? (

            <View style={styles.nextRewardCard}>


              <View style={styles.nextRewardTop}>


                <View style={styles.nextRewardIcon}>


                  <MaterialCommunityIcons

                    name={nextMilestone.icon}

                    size={27}

                    color={COLORS.primary}

                  />


                </View>


                <View style={styles.nextRewardInfo}>


                  <Text style={styles.nextRewardLabel}>

                    YOUR NEXT REWARD

                  </Text>


                  <Text style={styles.nextRewardTitle}>

                    {nextMilestone.prize}

                  </Text>


                  <Text style={styles.nextRewardDays}>

                    {nextMilestone.days -
                      currentStreak}{' '}

                    days remaining

                  </Text>


                </View>


                <View style={styles.daysBadge}>


                  <Text style={styles.daysBadgeValue}>

                    {nextMilestone.days}

                  </Text>


                  <Text style={styles.daysBadgeLabel}>

                    DAYS

                  </Text>


                </View>


              </View>


              <View style={styles.progressHeader}>


                <Text style={styles.progressLabel}>

                  Milestone Progress

                </Text>


                <Text style={styles.progressValue}>

                  {Math.min(

                    currentStreak,

                    nextMilestone.days

                  )}

                  {' / '}

                  {nextMilestone.days}

                </Text>


              </View>


              <View style={styles.progressTrack}>


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

                  style={[

                    styles.progressFill,

                    {

                      width:
                        `${Math.min(

                          100,

                          (
                            currentStreak /
                            nextMilestone.days
                          ) * 100

                        )}%`,

                    },

                  ]}

                />


              </View>


            </View>

          ) : (

            <LinearGradient

              colors={[

                '#166534',

                '#16A34A',

              ]}

              style={styles.legendCard}

            >


              <View style={styles.legendIcon}>


                <MaterialCommunityIcons

                  name="crown-outline"

                  size={30}

                  color="#FFFFFF"

                />


              </View>


              <View style={styles.legendContent}>


                <Text style={styles.legendTitle}>

                  Battleground Legend

                </Text>


                <Text style={styles.legendText}>

                  All prize milestones unlocked.
                  You completed the entire reward
                  roadmap.

                </Text>


              </View>


            </LinearGradient>

          )}


          {/* =================================================
              HOW STREAK WORKS
          ================================================= */}


          <View style={styles.sectionHeader}>


            <Text style={styles.sectionTitle}>

              How Streak Works

            </Text>


            <Text style={styles.sectionSubtitle}>

              Battle daily. Stay consistent. Unlock rewards.

            </Text>


          </View>


          <View style={styles.rulesCard}>


            <RuleItem

              number="01"

              icon="sword-cross"

              title="Enter Daily Battle"

              description="Attempt your daily battleground quiz to continue your streak."

            />


            <View style={styles.ruleDivider} />


            <RuleItem

              number="02"

              icon="calendar-check-outline"

              title="Stay Consistent"

              description="Missing a day may break your current battleground streak."

            />


            <View style={styles.ruleDivider} />


            <RuleItem

              number="03"

              icon="gift-outline"

              title="Unlock Rewards"

              description="Reach streak milestones to unlock exclusive Garud Classes prizes."

            />


          </View>


          {/* =================================================
              REWARD ROADMAP HEADER
          ================================================= */}


          <View style={styles.roadmapHeader}>


            <View>


              <Text style={styles.sectionTitle}>

                Reward Roadmap

              </Text>


              <Text style={styles.sectionSubtitle}>

                Your journey to legendary consistency

              </Text>


            </View>


            <View style={styles.roadmapPercent}>


              <Text style={styles.roadmapPercentValue}>

                {Math.round(roadmapProgress)}%

              </Text>


              <Text style={styles.roadmapPercentLabel}>

                COMPLETE

              </Text>


            </View>


          </View>


          {/* =================================================
              ROADMAP
          ================================================= */}


          <View style={styles.roadmapWrap}>


            <View style={styles.roadLine} />


            <LinearGradient

              colors={[

                COLORS.primary,

                '#8B5CF6',

              ]}

              style={[

                styles.completedRoadLine,

                {

                  height:
                    `${roadmapProgress}%`,

                },

              ]}

            />


            {PRIZE_MILESTONES.map(

              (milestone, index) => {


                const unlocked =

                  currentStreak >=
                  milestone.days;


                const remaining =

                  Math.max(

                    0,

                    milestone.days -
                    currentStreak

                  );


                const side =

                  index % 2 === 0

                    ? 'left'

                    : 'right';


                return (

                  <View

                    key={milestone.days}

                    style={styles.stepRow}

                  >


                    <View

                      style={[

                        styles.stepCard,

                        side === 'left'

                          ? styles.stepCardLeft

                          : styles.stepCardRight,

                        unlocked &&
                        styles
                          .stepCardUnlocked,

                      ]}

                    >


                      <View
                        style={styles.stepCardTop}
                      >


                        <View

                          style={[

                            styles.rewardIcon,

                            unlocked &&
                            styles
                              .rewardIconUnlocked,

                          ]}

                        >


                          <MaterialCommunityIcons

                            name={milestone.icon}

                            size={23}

                            color={

                              unlocked

                                ? COLORS.success

                                : COLORS.primary

                            }

                          />


                        </View>


                        {unlocked && (


                          <View
                            style={
                              styles.unlockedBadge
                            }
                          >


                            <MaterialCommunityIcons

                              name="check"

                              size={10}

                              color={
                                COLORS.success
                              }

                            />


                            <Text
                              style={
                                styles
                                  .unlockedBadgeText
                              }
                            >

                              UNLOCKED

                            </Text>


                          </View>


                        )}


                      </View>


                      <Text style={styles.rewardLevel}>

                        {milestone.level}

                      </Text>


                      <Text style={styles.stepPrize}>

                        {milestone.prize}

                      </Text>


                      <Text style={styles.stepNote}>

                        {milestone.note}

                      </Text>


                      <View

                        style={[

                          styles.stepStatus,

                          unlocked

                            ? styles
                              .statusUnlocked

                            : styles
                              .statusPending,

                        ]}

                      >


                        <MaterialCommunityIcons

                          name={

                            unlocked

                              ? 'check-circle-outline'

                              : 'lock-outline'

                          }

                          size={12}

                          color={

                            unlocked

                              ? COLORS.success

                              : COLORS.primary

                          }

                        />


                        <Text

                          style={[

                            styles.stepStatusText,

                            unlocked

                              ? styles
                                .stepStatusUnlockedText

                              : styles
                                .stepStatusPendingText,

                          ]}

                        >

                          {unlocked

                            ? 'Reward Unlocked'

                            : `${remaining} days to go`}

                        </Text>


                      </View>


                    </View>


                    <View

                      style={[

                        styles.node,

                        unlocked

                          ? styles.nodeUnlocked

                          : styles.nodePending,

                      ]}

                    >


                      {unlocked ? (


                        <MaterialCommunityIcons

                          name="check"

                          size={19}

                          color="#FFFFFF"

                        />


                      ) : (


                        <Text style={styles.nodeText}>

                          {milestone.days}

                        </Text>


                      )}


                    </View>


                  </View>

                );

              }

            )}


          </View>


          {/* =================================================
              FINAL MOTIVATION
          ================================================= */}


          <LinearGradient

            colors={[

              COLORS.primarySoft,

              '#FFFFFF',

            ]}

            style={styles.motivationCard}

          >


            <View style={styles.motivationIcon}>


              <MaterialCommunityIcons

                name="fire"

                size={25}

                color={COLORS.orange}

              />


            </View>


            <View style={styles.motivationContent}>


              <Text style={styles.motivationTitle}>

                Consistency Creates Champions

              </Text>


              <Text style={styles.motivationText}>

                One battle every day. One step
                closer to your goal and your next
                reward.

              </Text>


            </View>


          </LinearGradient>


        </ScrollView>


      </SafeAreaView>

    </>

  );

}


// =========================================================
// RULE COMPONENT
// =========================================================

function RuleItem({

  number,

  icon,

  title,

  description,

}) {

  return (

    <View style={styles.ruleRow}>


      <View style={styles.ruleNumber}>


        <Text style={styles.ruleNumberText}>

          {number}

        </Text>


      </View>


      <View style={styles.ruleIcon}>


        <MaterialCommunityIcons

          name={icon}

          size={20}

          color={COLORS.primary}

        />


      </View>


      <View style={styles.ruleContent}>


        <Text style={styles.ruleTitle}>

          {title}

        </Text>


        <Text style={styles.ruleText}>

          {description}

        </Text>


      </View>


    </View>

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


  content: {

    paddingBottom: 120,

  },


  heroCard: {

    marginHorizontal: 15,

    marginTop: 15,

    borderRadius: 24,

    padding: 20,

    overflow: 'hidden',

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 8,

    },

    shadowOpacity: 0.18,

    shadowRadius: 17,

    elevation: 8,

  },


  heroCircleOne: {

    position: 'absolute',

    width: 170,

    height: 170,

    borderRadius: 85,

    backgroundColor:
      'rgba(255,255,255,0.08)',

    right: -60,

    top: -70,

  },


  heroCircleTwo: {

    position: 'absolute',

    width: 110,

    height: 110,

    borderRadius: 55,

    backgroundColor:
      'rgba(255,255,255,0.06)',

    left: -40,

    bottom: -55,

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
      'rgba(255,255,255,0.15)',

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


  heroGiftIcon: {

    width: 47,

    height: 47,

    borderRadius: 15,

    backgroundColor:
      'rgba(255,255,255,0.14)',

    alignItems: 'center',

    justifyContent: 'center',

  },


  heroTitle: {

    color: '#FFFFFF',

    fontSize: 27,

    lineHeight: 34,

    fontWeight: '900',

    marginTop: 21,

  },


  heroSubtitle: {

    color: '#DDD6FE',

    fontSize: 10,

    lineHeight: 16,

    fontWeight: '600',

    marginTop: 8,

    maxWidth: '88%',

  },


  heroStats: {

    minHeight: 64,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.11)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.12)',

    borderRadius: 16,

    marginTop: 19,

    paddingHorizontal: 14,

  },


  heroStatItem: {

    flex: 1,

  },


  heroStatLabel: {

    color: '#C4B5FD',

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.7,

  },


  heroStatValueRow: {

    flexDirection: 'row',

    alignItems: 'baseline',

    gap: 4,

    marginTop: 4,

  },


  heroStatValue: {

    color: '#FFFFFF',

    fontSize: 20,

    fontWeight: '900',

  },


  heroStatUnit: {

    color: '#DDD6FE',

    fontSize: 8,

    fontWeight: '700',

  },


  heroDivider: {

    width: 1,

    height: 34,

    backgroundColor:
      'rgba(255,255,255,0.18)',

    marginHorizontal: 15,

  },


  nextRewardCard: {

    marginHorizontal: 15,

    marginTop: 14,

    backgroundColor: COLORS.white,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    padding: 15,

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


  nextRewardTop: {

    flexDirection: 'row',

    alignItems: 'center',

  },


  nextRewardIcon: {

    width: 56,

    height: 56,

    borderRadius: 18,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  nextRewardInfo: {

    flex: 1,

  },


  nextRewardLabel: {

    color: COLORS.primary,

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.7,

  },


  nextRewardTitle: {

    color: COLORS.text,

    fontSize: 14,

    fontWeight: '900',

    marginTop: 3,

  },


  nextRewardDays: {

    color: COLORS.textSecondary,

    fontSize: 8,

    fontWeight: '600',

    marginTop: 4,

  },


  daysBadge: {

    minWidth: 51,

    backgroundColor:
      COLORS.primarySoft,

    borderRadius: 13,

    paddingHorizontal: 8,

    paddingVertical: 8,

    alignItems: 'center',

  },


  daysBadgeValue: {

    color: COLORS.primaryDark,

    fontSize: 18,

    fontWeight: '900',

  },


  daysBadgeLabel: {

    color: COLORS.primary,

    fontSize: 5,

    fontWeight: '900',

    letterSpacing: 0.6,

  },


  progressHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: 14,

    marginBottom: 7,

  },


  progressLabel: {

    color: COLORS.textSecondary,

    fontSize: 8,

    fontWeight: '700',

  },


  progressValue: {

    color: COLORS.primary,

    fontSize: 8,

    fontWeight: '900',

  },


  progressTrack: {

    height: 7,

    backgroundColor:
      COLORS.primaryLight,

    borderRadius: 999,

    overflow: 'hidden',

  },


  progressFill: {

    height: '100%',

    borderRadius: 999,

  },


  legendCard: {

    marginHorizontal: 15,

    marginTop: 14,

    borderRadius: 19,

    padding: 16,

    flexDirection: 'row',

    alignItems: 'center',

  },


  legendIcon: {

    width: 55,

    height: 55,

    borderRadius: 18,

    backgroundColor:
      'rgba(255,255,255,0.16)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,

  },


  legendContent: {

    flex: 1,

  },


  legendTitle: {

    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '900',

  },


  legendText: {

    color: '#DCFCE7',

    fontSize: 9,

    lineHeight: 14,

    fontWeight: '600',

    marginTop: 4,

  },


  sectionHeader: {

    marginHorizontal: 15,

    marginTop: 23,

    marginBottom: 12,

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


  rulesCard: {

    marginHorizontal: 15,

    backgroundColor: COLORS.white,

    borderRadius: 19,

    borderWidth: 1,

    borderColor: COLORS.border,

    paddingHorizontal: 13,

    paddingVertical: 5,

  },


  ruleRow: {

    minHeight: 83,

    flexDirection: 'row',

    alignItems: 'center',

  },


  ruleNumber: {

    width: 28,

  },


  ruleNumberText: {

    color: '#DDD6FE',

    fontSize: 14,

    fontWeight: '900',

  },


  ruleIcon: {

    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  ruleContent: {

    flex: 1,

  },


  ruleTitle: {

    color: COLORS.text,

    fontSize: 12,

    fontWeight: '900',

  },


  ruleText: {

    color: COLORS.textSecondary,

    fontSize: 8,

    lineHeight: 13,

    fontWeight: '600',

    marginTop: 4,

  },


  ruleDivider: {

    height: 1,

    backgroundColor: '#F1F5F9',

    marginLeft: 28,

  },


  roadmapHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginHorizontal: 15,

    marginTop: 23,

    marginBottom: 8,

  },


  roadmapPercent: {

    minWidth: 54,

    backgroundColor:
      COLORS.primaryLight,

    borderRadius: 11,

    paddingHorizontal: 8,

    paddingVertical: 7,

    alignItems: 'center',

  },


  roadmapPercentValue: {

    color: COLORS.primaryDark,

    fontSize: 15,

    fontWeight: '900',

  },


  roadmapPercentLabel: {

    color: COLORS.primary,

    fontSize: 5,

    fontWeight: '900',

    letterSpacing: 0.5,

  },


  roadmapWrap: {

    marginHorizontal: 15,

    marginTop: 10,

    paddingBottom: 8,

    position: 'relative',

  },


  roadLine: {

    position: 'absolute',

    top: 22,

    bottom: 22,

    left: '50%',

    width: 3,

    marginLeft: -1.5,

    borderRadius: 999,

    backgroundColor: '#E2E8F0',

  },


  completedRoadLine: {

    position: 'absolute',

    top: 22,

    left: '50%',

    width: 3,

    marginLeft: -1.5,

    borderRadius: 999,

  },


  stepRow: {

    minHeight: 180,

    justifyContent: 'center',

  },


  stepCard: {

    width: '43%',

    minHeight: 148,

    borderRadius: 17,

    padding: 12,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 4,

    },

    shadowOpacity: 0.05,

    shadowRadius: 8,

    elevation: 2,

  },


  stepCardUnlocked: {

    borderColor: '#BBF7D0',

    backgroundColor: '#FAFFFC',

  },


  stepCardLeft: {

    alignSelf: 'flex-start',

  },


  stepCardRight: {

    alignSelf: 'flex-end',

  },


  stepCardTop: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },


  rewardIcon: {

    width: 40,

    height: 40,

    borderRadius: 13,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

  },


  rewardIconUnlocked: {

    backgroundColor:
      COLORS.successLight,

  },


  unlockedBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      COLORS.successLight,

    borderRadius: 5,

    paddingHorizontal: 4,

    paddingVertical: 3,

    gap: 2,

  },


  unlockedBadgeText: {

    color: COLORS.success,

    fontSize: 5,

    fontWeight: '900',

    letterSpacing: 0.3,

  },


  rewardLevel: {

    color: COLORS.primary,

    fontSize: 5,

    fontWeight: '900',

    letterSpacing: 0.6,

    marginTop: 9,

  },


  stepPrize: {

    color: COLORS.text,

    fontSize: 11,

    lineHeight: 15,

    fontWeight: '900',

    marginTop: 3,

  },


  stepNote: {

    color: COLORS.textSecondary,

    fontSize: 7,

    lineHeight: 11,

    fontWeight: '600',

    marginTop: 4,

  },


  stepStatus: {

    alignSelf: 'flex-start',

    flexDirection: 'row',

    alignItems: 'center',

    borderRadius: 7,

    paddingHorizontal: 6,

    paddingVertical: 5,

    gap: 3,

    marginTop: 8,

  },


  statusUnlocked: {

    backgroundColor:
      COLORS.successLight,

  },


  statusPending: {

    backgroundColor:
      COLORS.primaryLight,

  },


  stepStatusText: {

    fontSize: 6,

    fontWeight: '900',

  },


  stepStatusUnlockedText: {

    color: COLORS.success,

  },


  stepStatusPendingText: {

    color: COLORS.primary,

  },


  node: {

    position: 'absolute',

    left: '50%',

    marginLeft: -22,

    width: 44,

    height: 44,

    borderRadius: 22,

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 4,

    shadowColor: COLORS.primary,

    shadowOffset: {

      width: 0,

      height: 3,

    },

    shadowOpacity: 0.16,

    shadowRadius: 6,

    elevation: 4,

  },


  nodeUnlocked: {

    backgroundColor:
      COLORS.success,

    borderColor:
      COLORS.successLight,

  },


  nodePending: {

    backgroundColor:
      COLORS.primary,

    borderColor:
      COLORS.primaryLight,

  },


  nodeText: {

    color: '#FFFFFF',

    fontSize: 9,

    fontWeight: '900',

  },


  motivationCard: {

    marginHorizontal: 15,

    marginTop: 16,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: '#DDD6FE',

    padding: 14,

    flexDirection: 'row',

    alignItems: 'center',

  },


  motivationIcon: {

    width: 48,

    height: 48,

    borderRadius: 16,

    backgroundColor:
      COLORS.orangeLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  motivationContent: {

    flex: 1,

  },


  motivationTitle: {

    color: COLORS.text,

    fontSize: 13,

    fontWeight: '900',

  },


  motivationText: {

    color: COLORS.textSecondary,

    fontSize: 8,

    lineHeight: 13,

    fontWeight: '600',

    marginTop: 4,

  },

});