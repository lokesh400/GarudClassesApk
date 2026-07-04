import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

  blue: '#2563EB',
  blueLight: '#DBEAFE',

  pink: '#DB2777',
  pinkLight: '#FCE7F3',

  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

const CHAPTER_PALETTES = [
  {
    background: '#F5F3FF',
    iconBackground: '#EDE9FE',
    accent: '#6D28D9',
  },

  {
    background: '#EFF6FF',
    iconBackground: '#DBEAFE',
    accent: '#2563EB',
  },

  {
    background: '#FFF7ED',
    iconBackground: '#FFEDD5',
    accent: '#EA580C',
  },

  {
    background: '#FDF2F8',
    iconBackground: '#FCE7F3',
    accent: '#DB2777',
  },

  {
    background: '#F0FDF4',
    iconBackground: '#DCFCE7',
    accent: '#16A34A',
  },
];

export default function StudySubjectDetailScreen({
  route,
  navigation,
}) {
  const {
    courseId,
    purchased,
    subject,
  } = route.params || {};

  if (!subject) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <SafeAreaView
          style={styles.errorSafeArea}
          edges={['top']}
        >
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <MaterialCommunityIcons
                name="book-alert-outline"
                size={48}
                color={COLORS.danger}
              />
            </View>

            <Text style={styles.errorTitle}>
              Subject Not Found
            </Text>

            <Text style={styles.errorDescription}>
              Subject information is missing or
              unavailable.
            </Text>

            <TouchableOpacity
              style={styles.goBackButton}
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.goBackButtonText}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const chapters = Array.isArray(
    subject?.chapters
  )
    ? subject.chapters
    : [];

  const totalLectures = chapters.reduce(
    (total, chapter) => {
      const lectures = Array.isArray(
        chapter?.lectures
      )
        ? chapter.lectures
        : [];

      return total + lectures.length;
    },
    0
  );

  const subjectAcronym = subject?.name
    ? subject.name
        .substring(0, 2)
        .toUpperCase()
    : 'SU';

  const handleOpenChapter = (
    chapter,
    chapterIndex
  ) => {
    navigation.navigate('StudyChapterDetail', {
      courseId,
      purchased,
      subjectName: subject.name,
      chapter,
      chapterIndex,
    });
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* ================= HERO ================= */}

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
            {/* HEADER */}

            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerButton}
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={23}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <Text style={styles.headerLabel}>
                  SUBJECT
                </Text>

                <Text
                  style={styles.headerTitle}
                  numberOfLines={1}
                >
                  {subject?.name || 'Subject'}
                </Text>
              </View>

              <View style={styles.headerButton}>
                <MaterialCommunityIcons
                  name="book-open-page-variant-outline"
                  size={23}
                  color="#FFFFFF"
                />
              </View>
            </View>

            {/* SUBJECT HERO */}

            <View style={styles.heroContent}>
              <View style={styles.subjectHeroIcon}>
                <Text
                  style={styles.subjectHeroAcronym}
                >
                  {subjectAcronym}
                </Text>
              </View>

              <View style={styles.heroTextContent}>
                <Text style={styles.heroLabel}>
                  YOUR SUBJECT
                </Text>

                <Text
                  style={styles.heroTitle}
                  numberOfLines={3}
                >
                  {subject?.name || 'Subject'}
                </Text>

                <Text style={styles.heroSubtitle}>
                  Learn chapter by chapter and master
                  every concept
                </Text>
              </View>
            </View>

            {/* STATISTICS */}

            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="book-multiple-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  {chapters.length}
                </Text>

                <Text style={styles.statLabel}>
                  Chapters
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  {totalLectures}
                </Text>

                <Text style={styles.statLabel}>
                  Lectures
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="school-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  Study
                </Text>

                <Text style={styles.statLabel}>
                  Mode
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ================= CONTENT ================= */}

          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  Course Chapters
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Select a chapter to start learning
                </Text>
              </View>

              <View style={styles.chapterCountBadge}>
                <Text
                  style={styles.chapterCountBadgeText}
                >
                  {chapters.length}
                </Text>
              </View>
            </View>

            {chapters.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons
                    name="book-open-blank-variant-outline"
                    size={46}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No Chapters Yet
                </Text>

                <Text
                  style={styles.emptyDescription}
                >
                  Chapters added to this subject will
                  appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.chapterList}>
                {chapters.map(
                  (chapter, chapterIndex) => {
                    const palette =
                      CHAPTER_PALETTES[
                        chapterIndex %
                          CHAPTER_PALETTES.length
                      ];

                    const lectures = Array.isArray(
                      chapter?.lectures
                    )
                      ? chapter.lectures
                      : [];

                    const lectureCount =
                      lectures.length;

                    const completedCount = 0;

                    const chapterId =
                      chapter?._id ||
                      `chapter-${chapterIndex}`;

                    const chapterNumber =
                      String(
                        chapterIndex + 1
                      ).padStart(2, '0');

                    return (
                      <TouchableOpacity
                        key={chapterId}
                        style={styles.chapterCard}
                        activeOpacity={0.84}
                        onPress={() =>
                          handleOpenChapter(
                            chapter,
                            chapterIndex
                          )
                        }
                      >
                        {/* ACCENT */}

                        <View
                          style={[
                            styles.chapterAccent,
                            {
                              backgroundColor:
                                palette.accent,
                            },
                          ]}
                        />

                        {/* NUMBER */}

                        <View
                          style={[
                            styles.chapterNumberBox,
                            {
                              backgroundColor:
                                palette.iconBackground,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chapterNumberLabel,
                              {
                                color:
                                  palette.accent,
                              },
                            ]}
                          >
                            CH
                          </Text>

                          <Text
                            style={[
                              styles.chapterNumber,
                              {
                                color:
                                  palette.accent,
                              },
                            ]}
                          >
                            {chapterNumber}
                          </Text>
                        </View>

                        {/* BODY */}

                        <View
                          style={styles.chapterBody}
                        >
                          <Text
                            style={
                              styles.chapterTitle
                            }
                            numberOfLines={3}
                          >
                            {chapter?.name ||
                              `Chapter ${
                                chapterIndex + 1
                              }`}
                          </Text>

                          <View
                            style={
                              styles.chapterMetaRow
                            }
                          >
                            <View
                              style={
                                styles.chapterMetaItem
                              }
                            >
                              <MaterialCommunityIcons
                                name="play-circle-outline"
                                size={14}
                                color={
                                  COLORS.textMuted
                                }
                              />

                              <Text
                                style={
                                  styles.chapterMetaText
                                }
                              >
                                {lectureCount}{' '}
                                {lectureCount === 1
                                  ? 'Lecture'
                                  : 'Lectures'}
                              </Text>
                            </View>

                            <View
                              style={styles.metaDot}
                            />

                            <View
                              style={
                                styles.chapterMetaItem
                              }
                            >
                              <MaterialCommunityIcons
                                name="progress-check"
                                size={14}
                                color={
                                  COLORS.textMuted
                                }
                              />

                              <Text
                                style={
                                  styles.chapterMetaText
                                }
                              >
                                {completedCount}/
                                {lectureCount}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* ARROW */}

                        <View
                          style={[
                            styles.chapterArrow,
                            {
                              backgroundColor:
                                palette.background,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={21}
                            color={palette.accent}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  errorSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,

    // prevents last chapter hiding
    // behind bottom navigation
    paddingBottom: 115,
  },

  /* ================= HERO ================= */

  hero: {
    paddingBottom: 23,
  },

  header: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    flex: 1,
  },

  headerLabel: {
    color: '#DDD6FE',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  subjectHeroIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor:
      'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  subjectHeroAcronym: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },

  heroTextContent: {
    flex: 1,
  },

  heroLabel: {
    color: '#DDD6FE',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 4,
  },

  heroSubtitle: {
    color: '#DDD6FE',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
    marginTop: 5,
  },

  statsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    minHeight: 77,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.17)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },

  statLabel: {
    color: '#DDD6FE',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 39,
    backgroundColor:
      'rgba(255,255,255,0.18)',
  },

  /* ================= CONTENT ================= */

  content: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  sectionHeaderText: {
    flex: 1,
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
    marginTop: 4,
  },

  chapterCountBadge: {
    minWidth: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  chapterCountBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '900',
  },

  /* ================= CHAPTER CARD ================= */

  chapterList: {
    gap: 11,
  },

  chapterCard: {
    minHeight: 94,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 13,
    overflow: 'hidden',

    shadowColor: '#4C1D95',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.045,

    shadowRadius: 9,

    elevation: 2,
  },

  chapterAccent: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 12,
  },

  chapterNumberBox: {
    width: 53,
    height: 58,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  chapterNumberLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  chapterNumber: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },

  chapterBody: {
    flex: 1,
    paddingVertical: 14,
  },

  chapterTitle: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },

  chapterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 7,
  },

  chapterMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  chapterMetaText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  chapterArrow: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  /* ================= EMPTY ================= */

  emptyState: {
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
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

  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },

  /* ================= ERROR ================= */

  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  errorIcon: {
    width: 95,
    height: 95,
    borderRadius: 32,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 18,
  },

  errorDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },

  goBackButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 20,
  },

  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});