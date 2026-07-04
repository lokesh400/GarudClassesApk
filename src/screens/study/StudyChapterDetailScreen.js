import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COURSE_IMAGE = require('../../../assets/icon.png');

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

  red: '#DC2626',
  redLight: '#FEE2E2',

  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

function formatLectureDate(value) {
  if (!value) {
    return 'Available Now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Available Now';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getLectureStatus(lesson) {
  const status = String(
    lesson?.status || ''
  ).toLowerCase();

  if (
    status === 'live' ||
    status === 'started'
  ) {
    return {
      label: 'LIVE',
      icon: 'access-point',
      background: '#FEE2E2',
      color: '#DC2626',
    };
  }

  if (
    status === 'scheduled' ||
    status === 'upcoming'
  ) {
    return {
      label: 'UPCOMING',
      icon: 'clock-outline',
      background: '#FFEDD5',
      color: '#EA580C',
    };
  }

  if (
    status === 'cancelled'
  ) {
    return {
      label: 'CANCELLED',
      icon: 'close-circle-outline',
      background: '#F1F5F9',
      color: '#64748B',
    };
  }

  return {
    label: 'AVAILABLE',
    icon: 'check-circle-outline',
    background: '#DCFCE7',
    color: '#16A34A',
  };
}

export default function StudyChapterDetailScreen({
  route,
  navigation,
}) {
  const {
    courseId,
    purchased,
    subjectName,
    chapter,
    chapterIndex,
  } = route.params || {};

  const [activeTab, setActiveTab] =
    useState('Lectures');

  const [
    expandedNotesId,
    setExpandedNotesId,
  ] = useState(null);

  const lectures = useMemo(() => {
    return Array.isArray(chapter?.lectures)
      ? chapter.lectures
      : [];
  }, [chapter]);

  const allPdfs = useMemo(() => {
    const resources = [];

    lectures.forEach((lesson) => {
      const pdfs = Array.isArray(lesson?.pdfs)
        ? lesson.pdfs
        : [];

      pdfs.forEach((pdf) => {
        resources.push({
          ...pdf,
          lessonTitle:
            lesson?.title || 'Lecture',
        });
      });
    });

    return resources;
  }, [lectures]);

  if (!chapter) {
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
              Chapter Not Found
            </Text>

            <Text style={styles.errorDescription}>
              Chapter information is missing or
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

              <Text
                style={styles.goBackButtonText}
              >
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const chapterNumber = String(
    Number.isInteger(chapterIndex)
      ? chapterIndex + 1
      : 1
  ).padStart(2, '0');

  const handlePlay = (lesson) => {
    if (!purchased) {
      Alert.alert(
        'Locked',
        'Please purchase this course to watch videos.'
      );

      return;
    }

    if (lesson?.status === 'upcoming') {
      Alert.alert(
        'Scheduled Class',
        'This class has not started yet. Please wait for the scheduled time.'
      );
      return;
    }

    if (lesson?.status === 'cancelled') {
      Alert.alert(
        'Class Cancelled',
        'This class has been cancelled by the instructor.'
      );
      return;
    }

    if (lesson?._id) {
      navigation.navigate(
        'StudyYoutubeVideoPlayer',
        {
          courseId,
          lectureId: lesson._id,
          lectureTitle:
            lesson?.title || 'Lecture',
          status: lesson?.status || 'ended',
        }
      );

      return;
    }

    Alert.alert(
      'Unavailable',
      'Video link is not available for this lesson.'
    );
  };

  const handleNotes = (lesson) => {
    if (!purchased) {
      Alert.alert(
        'Locked',
        'Please purchase this course to view attachments.'
      );

      return;
    }

    const pdfs = Array.isArray(lesson?.pdfs)
      ? lesson.pdfs
      : [];

    if (pdfs.length === 0) {
      Alert.alert(
        'No Notes',
        'There are no notes available for this lesson.'
      );

      return;
    }

    const lessonKey =
      lesson?._id || lesson?.title;

    setExpandedNotesId((current) =>
      current === lessonKey
        ? null
        : lessonKey
    );
  };

  const openAttachment = (
    pdf,
    lessonTitle
  ) => {
    if (!purchased) {
      Alert.alert(
        'Locked',
        'Please purchase this course to view attachments.'
      );

      return;
    }

    navigation.navigate('AttachmentViewer', {
      attachment: pdf,
      title: pdf?.title || 'Notes',
      lessonTitle,
      courseTitle: subjectName,
    });
  };

  const renderLectures = () => {
    if (lectures.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="video-off-outline"
              size={45}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Lectures Yet
          </Text>

          <Text style={styles.emptyDescription}>
            Lectures added to this chapter will
            appear here.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.lectureList}>
        {lectures.map(
          (lesson, lessonIndex) => {
            const lessonKey =
              lesson?._id ||
              lesson?.title ||
              `lesson-${lessonIndex}`;

            const isExpanded =
              expandedNotesId === lessonKey;

            const dateStr = formatLectureDate(
              lesson?.scheduledAt
            );

            const lectureStatus =
              getLectureStatus(lesson);

            const pdfs = Array.isArray(
              lesson?.pdfs
            )
              ? lesson.pdfs
              : [];

            const lectureNumber = String(
              lessonIndex + 1
            ).padStart(2, '0');

            return (
              <View
                key={lessonKey}
                style={[
                  styles.lectureCard,
                  lectureStatus.label === 'LIVE' && {
                    borderColor: '#EF4444',
                    borderWidth: 1.5,
                    backgroundColor: '#FEF2F2',
                  },
                  lectureStatus.label === 'CANCELLED' && {
                    borderColor: '#CBD5E1',
                    borderWidth: 1.5,
                    backgroundColor: '#F8FAFC',
                    opacity: 0.8,
                  }
                ]}
              >
                <View
                  style={styles.cardProgressWrap}
                >
                  <View
                    style={[
                      styles.cardProgressFill,
                      {
                        width: '0%',
                      },
                    ]}
                  />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={styles.thumbnailWrap}
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
                        style={styles.thumbnailGradient}
                      >
                        <Image
                          source={COURSE_IMAGE}
                          style={styles.thumbnail}
                          resizeMode="contain"
                        />

                        <View
                          style={
                            styles.thumbnailOverlay
                          }
                        />

                        <TouchableOpacity
                          style={styles.playIconBadge}
                          activeOpacity={(lectureStatus.label === 'UPCOMING' || lectureStatus.label === 'CANCELLED') ? 1 : 0.85}
                          onPress={() =>
                            handlePlay(lesson)
                          }
                        >
                          <MaterialCommunityIcons
                            name="play"
                            size={19}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </LinearGradient>

                      <View
                        style={styles.lectureNumberBadge}
                      >
                        <Text
                          style={
                            styles.lectureNumberText
                          }
                        >
                          {lectureNumber}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoWrap}>
                      <View
                        style={styles.lectureBadgeRow}
                      >
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                lectureStatus.background,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              lectureStatus.icon
                            }
                            size={11}
                            color={
                              lectureStatus.color
                            }
                          />

                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  lectureStatus.color,
                              },
                            ]}
                          >
                            {lectureStatus.label}
                          </Text>
                        </View>

                        {pdfs.length > 0 && (
                          <View
                            style={
                              styles.notesCountBadge
                            }
                          >
                            <MaterialCommunityIcons
                              name="file-document-outline"
                              size={11}
                              color={COLORS.primary}
                            />

                            <Text
                              style={
                                styles.notesCountText
                              }
                            >
                              {pdfs.length}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={styles.lectureTitle}
                        numberOfLines={3}
                      >
                        {lesson?.title ||
                          `Lecture ${
                            lessonIndex + 1
                          }`}
                      </Text>

                      <View
                        style={styles.lectureMetaRow}
                      >
                        <MaterialCommunityIcons
                          name="calendar-blank-outline"
                          size={13}
                          color={COLORS.textMuted}
                        />

                        <Text
                          style={styles.metaText}
                          numberOfLines={1}
                        >
                          {dateStr}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.watchButton,
                        (lectureStatus.label === 'UPCOMING' || lectureStatus.label === 'CANCELLED') && { opacity: 0.5 }
                      ]}
                      activeOpacity={(lectureStatus.label === 'UPCOMING' || lectureStatus.label === 'CANCELLED') ? 1 : 0.84}
                      onPress={() =>
                        handlePlay(lesson)
                      }
                    >
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
                        style={
                          styles.watchButtonGradient
                        }
                      >
                        <MaterialCommunityIcons
                          name="play-circle-outline"
                          size={18}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.watchButtonText
                          }
                        >
                          Watch Lecture
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.notesButton,
                        isExpanded &&
                          styles.notesButtonActive,
                      ]}
                      activeOpacity={0.84}
                      onPress={() =>
                        handleNotes(lesson)
                      }
                    >
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={18}
                        color={
                          isExpanded
                            ? COLORS.primary
                            : COLORS.textSecondary
                        }
                      />

                      <Text
                        style={[
                          styles.notesButtonText,
                          isExpanded &&
                            styles.notesButtonTextActive,
                        ]}
                      >
                        Notes
                      </Text>

                      <MaterialCommunityIcons
                        name={
                          isExpanded
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={17}
                        color={
                          isExpanded
                            ? COLORS.primary
                            : COLORS.textMuted
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  {isExpanded &&
                    pdfs.length > 0 && (
                      <View
                        style={
                          styles.expandedNotesWrap
                        }
                      >
                        <View
                          style={
                            styles.notesSectionHeader
                          }
                        >
                          <View
                            style={
                              styles.notesSectionIcon
                            }
                          >
                            <MaterialCommunityIcons
                              name="folder-open-outline"
                              size={17}
                              color={COLORS.primary}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text
                              style={
                                styles.notesSectionTitle
                              }
                            >
                              Lecture Resources
                            </Text>

                            <Text
                              style={
                                styles.notesSectionSubtitle
                              }
                            >
                              {pdfs.length}{' '}
                              {pdfs.length === 1
                                ? 'document'
                                : 'documents'}{' '}
                              available
                            </Text>
                          </View>
                        </View>

                        {pdfs.map((pdf, idx) => (
                          <TouchableOpacity
                            key={`pdf-${idx}`}
                            style={styles.pdfItem}
                            activeOpacity={0.82}
                            onPress={() =>
                              openAttachment(
                                pdf,
                                lesson?.title
                              )
                            }
                          >
                            <View
                              style={styles.pdfIconWrap}
                            >
                              <MaterialCommunityIcons
                                name="file-pdf-box"
                                size={25}
                                color={COLORS.red}
                              />
                            </View>

                            <View
                              style={styles.pdfContent}
                            >
                              <Text
                                style={
                                  styles.pdfItemText
                                }
                                numberOfLines={2}
                              >
                                {pdf?.title ||
                                  `Document ${
                                    idx + 1
                                  }`}
                              </Text>

                              <Text
                                style={
                                  styles.pdfItemMeta
                                }
                              >
                                PDF Resource
                              </Text>
                            </View>

                            <View
                              style={
                                styles.pdfArrowWrap
                              }
                            >
                              <MaterialCommunityIcons
                                name="chevron-right"
                                size={19}
                                color={COLORS.primary}
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                </View>
              </View>
            );
          }
        )}
      </View>
    );
  };

  const renderResources = () => {
    if (allPdfs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="folder-open-outline"
              size={46}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Resources
          </Text>

          <Text style={styles.emptyDescription}>
            No documents are currently available
            for this chapter.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resourcesWrap}>
        {allPdfs.map((pdf, idx) => (
          <TouchableOpacity
            key={`resource-${idx}`}
            style={styles.resourceCard}
            activeOpacity={0.84}
            onPress={() =>
              openAttachment(
                pdf,
                pdf?.lessonTitle
              )
            }
          >
            <View style={styles.resourceAccent} />

            <View style={styles.resourceIconBox}>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={29}
                color={COLORS.red}
              />
            </View>

            <View style={styles.resourceInfo}>
              <View
                style={styles.resourceTypeRow}
              >
                <View
                  style={styles.resourceTypeBadge}
                >
                  <Text
                    style={
                      styles.resourceTypeBadgeText
                    }
                  >
                    PDF
                  </Text>
                </View>
              </View>

              <Text
                style={styles.resourceTitle}
                numberOfLines={2}
              >
                {pdf?.title ||
                  `Document ${idx + 1}`}
              </Text>

              <View
                style={styles.resourceMetaRow}
              >
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={13}
                  color={COLORS.textMuted}
                />

                <Text
                  style={styles.resourceMeta}
                  numberOfLines={1}
                >
                  {pdf?.lessonTitle ||
                    'Lecture Resource'}
                </Text>
              </View>
            </View>

            <View style={styles.resourceArrow}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={COLORS.primary}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
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
                  {subjectName || 'SUBJECT'}
                </Text>

                <Text
                  style={styles.headerTitle}
                  numberOfLines={1}
                >
                  {chapter?.name || 'Chapter'}
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

            <View style={styles.heroContent}>
              <View style={styles.chapterHeroIcon}>
                <Text
                  style={styles.chapterHeroLabel}
                >
                  CH
                </Text>

                <Text
                  style={styles.chapterHeroNumber}
                >
                  {chapterNumber}
                </Text>
              </View>

              <View style={styles.heroTextContent}>
                <Text style={styles.heroLabel}>
                  CURRENT CHAPTER
                </Text>

                <Text
                  style={styles.heroTitle}
                  numberOfLines={3}
                >
                  {chapter?.name || 'Chapter'}
                </Text>

                <Text style={styles.heroSubtitle}>
                  Watch lectures and access study
                  resources
                </Text>
              </View>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  {lectures.length}
                </Text>

                <Text style={styles.statLabel}>
                  Lectures
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  {allPdfs.length}
                </Text>

                <Text style={styles.statLabel}>
                  Resources
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name={
                    purchased
                      ? 'lock-open-check-outline'
                      : 'lock-outline'
                  }
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.statValue}>
                  {purchased ? 'Full' : 'Locked'}
                </Text>

                <Text style={styles.statLabel}>
                  Access
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.stickyTabContainer}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === 'Lectures' &&
                    styles.tabItemActive,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  setActiveTab('Lectures')
                }
              >
                <MaterialCommunityIcons
                  name={
                    activeTab === 'Lectures'
                      ? 'play-circle'
                      : 'play-circle-outline'
                  }
                  size={18}
                  color={
                    activeTab === 'Lectures'
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Lectures' &&
                      styles.tabTextActive,
                  ]}
                >
                  Lectures
                </Text>

                <View
                  style={[
                    styles.tabCount,
                    activeTab === 'Lectures' &&
                      styles.tabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      activeTab === 'Lectures' &&
                        styles.tabCountTextActive,
                    ]}
                  >
                    {lectures.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === 'Resources' &&
                    styles.tabItemActive,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  setActiveTab('Resources')
                }
              >
                <MaterialCommunityIcons
                  name={
                    activeTab === 'Resources'
                      ? 'folder-open'
                      : 'folder-open-outline'
                  }
                  size={18}
                  color={
                    activeTab === 'Resources'
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Resources' &&
                      styles.tabTextActive,
                  ]}
                >
                  Resources
                </Text>

                <View
                  style={[
                    styles.tabCount,
                    activeTab === 'Resources' &&
                      styles.tabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      activeTab === 'Resources' &&
                        styles.tabCountTextActive,
                    ]}
                  >
                    {allPdfs.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === 'Lectures'
                  ? 'Chapter Lectures'
                  : 'Study Resources'}
              </Text>

              <Text style={styles.sectionSubtitle}>
                {activeTab === 'Lectures'
                  ? 'Watch lectures and access lesson notes'
                  : 'All chapter documents in one place'}
              </Text>
            </View>

            {activeTab === 'Lectures'
              ? renderLectures()
              : renderResources()}
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
    paddingBottom: 115,
  },

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
    backgroundColor: 'rgba(255,255,255,0.14)',
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
    textTransform: 'uppercase',
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

  chapterHeroIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  chapterHeroLabel: {
    color: '#DDD6FE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  chapterHeroNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 1,
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
    fontSize: 21,
    lineHeight: 27,
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
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  stickyTabContainer: {
    backgroundColor: COLORS.background,
    paddingTop: 10,
    paddingBottom: 5,
  },

  tabBar: {
    marginHorizontal: 15,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 5,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  tabItem: {
    flex: 1,
    minHeight: 45,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  tabItemActive: {
    backgroundColor: COLORS.primarySoft,
  },

  tabText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },

  tabTextActive: {
    color: COLORS.primary,
  },

  tabCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 7,
    paddingHorizontal: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabCountActive: {
    backgroundColor: COLORS.primaryLight,
  },

  tabCountText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '900',
  },

  tabCountTextActive: {
    color: COLORS.primary,
  },

  content: {
    paddingHorizontal: 15,
    paddingTop: 18,
  },

  sectionHeader: {
    marginBottom: 15,
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

  lectureList: {
    gap: 13,
  },

  lectureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardProgressWrap: {
    height: 4,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },

  cardProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },

  cardContent: {
    padding: 14,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  thumbnailWrap: {
    width: 82,
    height: 82,
    marginRight: 13,
    position: 'relative',
  },

  thumbnailGradient: {
    width: 82,
    height: 82,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  thumbnail: {
    width: 52,
    height: 52,
  },

  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76,29,149,0.08)',
  },

  playIconBadge: {
    position: 'absolute',
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },

  lectureNumberBadge: {
    position: 'absolute',
    left: -4,
    bottom: -5,
    minWidth: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: COLORS.primaryDark,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  lectureNumberText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  infoWrap: {
    flex: 1,
    minHeight: 82,
  },

  lectureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  notesCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  notesCountText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
  },

  lectureTitle: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },

  lectureMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  metaText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },

  watchButton: {
    flex: 1.25,
    borderRadius: 12,
    overflow: 'hidden',
  },

  watchButtonGradient: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },

  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  notesButton: {
    flex: 0.8,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },

  notesButtonActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: '#DDD6FE',
  },

  notesButtonText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },

  notesButtonTextActive: {
    color: COLORS.primary,
  },

  expandedNotesWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },

  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  notesSectionIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  notesSectionTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
  },

  notesSectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },

  pdfItem: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    backgroundColor: '#FAFAFC',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pdfIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  pdfContent: {
    flex: 1,
  },

  pdfItemText: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },

  pdfItemMeta: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 3,
  },

  pdfArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  resourcesWrap: {
    gap: 11,
  },

  resourceCard: {
    minHeight: 88,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 9,
    elevation: 2,
  },

  resourceAccent: {
    width: 5,
    alignSelf: 'stretch',
    backgroundColor: COLORS.red,
    marginRight: 12,
  },

  resourceIconBox: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  resourceInfo: {
    flex: 1,
    paddingVertical: 13,
  },

  resourceTypeRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },

  resourceTypeBadge: {
    backgroundColor: COLORS.redLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },

  resourceTypeBadgeText: {
    color: COLORS.red,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  resourceTitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },

  resourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },

  resourceMeta: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },

  resourceArrow: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

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