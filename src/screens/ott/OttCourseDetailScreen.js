import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from "../../components/AppHeader";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from "../../api/client";

const COURSE_IMAGE = require("../../../assets/icon.png");

function normalizeAttachment(item, index) {
  if (typeof item === 'string') {
    const link = item.trim();
    if (!link) return null;
    return {
      _id: `pdf-${index}`,
      title: `Attachment ${index + 1}`,
      link,
    };
  }

  const source =
    item && typeof item === 'object'
      ? (item.file && typeof item.file === 'object' ? item.file : item)
      : {};
  const link = String(
    source.link ||
    source.url ||
    source.pdfLink ||
    source.pdfUrl ||
    source.fileUrl ||
    source.driveLink ||
    ''
  ).trim();

  if (!link) return null;

  return {
    _id: source._id || `pdf-${index}`,
    title: String(source.title || source.name || source.label || `Attachment ${index + 1}`),
    link,
  };
}

function normalizeLecturePdfs(lesson) {
  const raw =
    lesson?.pdfs ||
    lesson?.attachments ||
    lesson?.notes ||
    lesson?.lectureNotes ||
    lesson?.files ||
    lesson?.documents ||
    [];

  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => normalizeAttachment(item, index)).filter(Boolean);
}

function normalizeCoursePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.course && typeof payload.course === 'object') return payload.course;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload;
}

function scoreCoursePayload(courseLike) {
  const course = normalizeCoursePayload(courseLike);
  if (!course || typeof course !== 'object') return -1;

  const lectures = Array.isArray(course.lectures) ? course.lectures : [];
  const lectureCount = lectures.length;
  const attachmentCount = lectures.reduce((sum, lesson) => sum + normalizeLecturePdfs(lesson).length, 0);

  // Prefer payloads that actually contain lecture notes.
  return lectureCount * 10 + attachmentCount;
}

async function fetchBestCoursePayload(courseId) {
  const candidates = [];

  const detailEndpoints = [
    `/ott/published/${courseId}`,
    `/ott/courses/published/${courseId}`,
    `/ott/courses/${courseId}`,
  ];

  for (const endpoint of detailEndpoints) {
    try {
      const res = await apiClient.get(endpoint);
      candidates.push(res?.data);
    } catch {
      // Keep trying the next endpoint.
    }
  }

  // Fallback source: purchased list may already carry full course including lectures.
  try {
    const myRes = await apiClient.get('/ott/my-courses');
    const list = Array.isArray(myRes?.data) ? myRes.data : [];
    const matched = list.find(
      (item) => String(item?.course?._id || item?.course?.id || '') === String(courseId)
    );
    if (matched?.course) candidates.push(matched.course);
  } catch {
    // Ignore fallback failure.
  }

  if (!candidates.length) return null;

  let best = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = scoreCoursePayload(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return normalizeCoursePayload(best);
}

export default function OttCourseDetailScreen({ route, navigation }) {
  const { courseId, purchased } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [expandedLessonIds, setExpandedLessonIds] = useState({});

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);

      if (!purchased) {
        try {
          const myRes = await apiClient.get('/ott/my-courses');
          const purchasedIds = new Set(
            (Array.isArray(myRes.data) ? myRes.data : []).map((item) =>
              String(item?.course?._id || item?.course?.id || '')
            )
          );
          if (!purchasedIds.has(String(courseId))) {
            Alert.alert('Purchase Required', 'Please purchase this course to access lessons.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            setLoading(false);
            return;
          }
        } catch (err) {
          Alert.alert('Access Check Failed', 'Could not verify purchase status. Please try again.');
          setLoading(false);
          return;
        }
      }

      try {
        const normalizedCourse = await fetchBestCoursePayload(courseId);
        if (!normalizedCourse) {
          throw new Error('Course payload missing');
        }
        setCourse({
          ...(normalizedCourse || {}),
          image: COURSE_IMAGE,
        });
      } catch (err) {
        Alert.alert("Error", "Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, purchased, navigation]);

  const lessons = useMemo(() => {
    if (!course) return [];

    const lectureList =
      (Array.isArray(course.lectures) && course.lectures) ||
      (Array.isArray(course.lessons) && course.lessons) ||
      [];

    if (lectureList.length > 0) {
      return lectureList.map((lesson, index) => ({
        id: String(lesson?._id || `lesson-${index}`),
        title: lesson?.title || `Lesson ${index + 1}`,
        videoLink: lesson?.videoLink || '',
        pdfs: normalizeLecturePdfs(lesson),
        legacyVideoId: '',
      }));
    }

    // Backward compatibility for old API shape.
    if (Array.isArray(course.videolist) && course.videolist.length > 0) {
      return course.videolist.map((video, index) => ({
        id: String(video?._id || `lesson-${index}`),
        title: video?.videoname || `Lesson ${index + 1}`,
        videoLink: '',
        pdfs: [],
        legacyVideoId: String(video?._id || ''),
      }));
    }

    return [];
  }, [course]);

  const totalAttachments = useMemo(
    () => lessons.reduce((sum, lesson) => sum + lesson.pdfs.length, 0),
    [lessons]
  );

  const toggleLesson = (lessonId) => {
    setExpandedLessonIds((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const handlePlay = (lesson) => {
    if (lesson.videoLink) {
      navigation.navigate("OttVideoPlayer", {
        videoname: lesson.title,
        videoUrl: lesson.videoLink,
      });
      return;
    }

    if (lesson.legacyVideoId) {
      navigation.navigate("OttVideoPlayer", {
        courseId,
        videoId: lesson.legacyVideoId,
        videoname: lesson.title,
      });
      return;
    }

    Alert.alert('Unavailable', 'Video link is not available for this lesson.');
  };

  const handleOpenAttachment = (attachment, lesson) => {
    navigation.navigate('AttachmentViewer', {
      attachment,
      title: attachment?.title,
      lessonTitle: lesson?.title,
      courseTitle: course?.name,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader
        title="Course Detail"
        navigation={navigation}
        showBack={true}
        right={<Image source={COURSE_IMAGE} style={{ width: 32, height: 32, borderRadius: 8 }} />}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      ) : course ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <Image source={course.image} style={styles.image} resizeMode="cover" />

            <Text style={styles.title}>{course.name}</Text>

            {!!course.description && (
              <Text style={styles.desc}>{course.description}</Text>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaNumber}>{lessons.length}</Text>
                <Text style={styles.metaLabel}>Lessons</Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaNumber}>{totalAttachments}</Text>
                <Text style={styles.metaLabel}>Attachments</Text>
              </View>
              <View style={styles.metaPill}>
                <Text style={styles.metaNumber}>{String(course.madeFor || 'other').toUpperCase()}</Text>
                <Text style={styles.metaLabel}>Category</Text>
              </View>
            </View>
          </View>

          <View style={styles.lessonSection}>
            <Text style={styles.lessonTitle}>Lessons</Text>
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => {
                const isExpanded = !!expandedLessonIds[lesson.id];
                return (
                  <View key={lesson.id} style={styles.lessonCard}>
                    <TouchableOpacity style={styles.lessonHead} onPress={() => toggleLesson(lesson.id)}>
                      <View style={styles.lessonIndexWrap}>
                        <Text style={styles.lessonIndex}>{index + 1}</Text>
                      </View>

                      <View style={styles.lessonTitleWrap}>
                        <Text style={styles.lessonItemTitle}>{lesson.title}</Text>
                        <Text style={styles.lessonSubText}>
                          {lesson.videoLink || lesson.legacyVideoId ? 'Video available' : 'No video'}
                          {'  '}•{'  '}
                          {lesson.pdfs.length} attachments
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color="#1E40AF"
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.lessonBody}>
                        <TouchableOpacity style={styles.videoBtn} onPress={() => handlePlay(lesson)}>
                          <MaterialCommunityIcons name="play-circle" size={18} color="#FFFFFF" />
                          <Text style={styles.videoBtnText}>Video</Text>
                        </TouchableOpacity>

                        <Text style={styles.attachHeading}>Attachments</Text>
                        {lesson.pdfs.length > 0 ? (
                          lesson.pdfs.map((pdf, pdfIndex) => (
                            <TouchableOpacity
                              key={String(pdf._id || `${lesson.id}-pdf-${pdfIndex}`)}
                              style={styles.attachmentBtn}
                              onPress={() => handleOpenAttachment(pdf, lesson)}
                            >
                              <MaterialCommunityIcons name="file-document-outline" size={18} color="#1D4ED8" />
                              <Text style={styles.attachmentText} numberOfLines={1}>
                                {pdf.title || `Attachment ${pdfIndex + 1}`}
                              </Text>
                              <MaterialCommunityIcons name="open-in-new" size={16} color="#64748B" />
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.noAttachmentText}>No attachments for this lesson.</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No lessons found.</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Course not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 28 },
  heroCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  image: { width: "100%", height: 188, borderRadius: 14, marginBottom: 14 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  metaPill: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    alignItems: 'center',
  },
  metaNumber: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '800',
  },
  metaLabel: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  errorText: { fontSize: 16, color: "#EF4444" },
  lessonSection: { marginTop: 18 },
  lessonTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D4ED8",
    marginBottom: 12,
  },
  lessonCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    overflow: 'hidden',
  },
  lessonHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  lessonIndexWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lessonIndex: { color: '#1D4ED8', fontWeight: '800', fontSize: 13 },
  lessonTitleWrap: { flex: 1 },
  lessonItemTitle: { fontSize: 15, color: '#0F172A', fontWeight: '700' },
  lessonSubText: { marginTop: 2, color: '#64748B', fontSize: 12 },
  lessonBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 2,
  },
  videoBtn: {
    backgroundColor: "#1D4ED8",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  videoBtnText: { color: '#fff', marginLeft: 6, fontWeight: '800' },
  attachHeading: {
    marginTop: 12,
    marginBottom: 8,
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 13,
  },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 8,
  },
  attachmentText: { flex: 1, marginHorizontal: 8, color: '#0F172A', fontWeight: '600' },
  noAttachmentText: { color: '#64748B', fontSize: 13 },
  emptyText: { color: '#64748B', fontSize: 14, marginTop: 8, marginLeft: 4 },
});
