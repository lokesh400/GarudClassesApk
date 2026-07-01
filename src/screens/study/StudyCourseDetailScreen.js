import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from "../../components/AppHeader";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const SCREEN_PADDING = 16;
const CARD_WIDTH = (width - SCREEN_PADDING * 2 - GRID_GAP) / 2;

function normalizeCoursePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.course && typeof payload.course === 'object') return payload.course;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload;
}

async function fetchBestCoursePayload(courseId) {
  const candidates = [];

  const detailEndpoints = [
    `/study/published/${courseId}`,
    `/study/courses/published/${courseId}`,
    `/study/courses/${courseId}`,
  ];

  for (const endpoint of detailEndpoints) {
    try {
      const res = await apiClient.get(endpoint);
      candidates.push(res?.data);
    } catch {
      // Keep trying the next endpoint.
    }
  }

  if (candidates.length === 0) return null;
  return normalizeCoursePayload(candidates[0]);
}

export default function StudyCourseDetailScreen({ route, navigation }) {
  const { courseId, purchased: initialPurchasedStatus } = route.params || {};

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(initialPurchasedStatus);
  const [activeTab, setActiveTab] = useState('Subjects');
  
  const { logout } = useAuth();
  const [busyTestId, setBusyTestId] = useState('');

  const startTest = async (test) => {
    console.log("Attempting to start test:", test?._id, "busy:", busyTestId);
    if (!test?._id) {
      Alert.alert("Error", "Test ID is missing!");
      return;
    }
    if (busyTestId) return;

    setBusyTestId(test._id);
    try {
      console.log("Calling API POST /tests/", test._id, "/start with courseId:", courseId);
      const res = await apiClient.post(`/tests/${test._id}/start`, {
        batchId: courseId,
      });

      navigation.navigate('TestAttempt', {
        test: res.data.test,
        attempt: res.data.attempt,
        batchId: courseId,
      });
    } catch (e) {
      console.log("Error starting test:", e?.message, e?.response?.data);
      if (e.response?.status === 401) {
        logout();
        return;
      }

      const message = e.response?.data?.message || 'Could not start test.';
      if (e.response?.status === 400 && message.toLowerCase().includes('already submitted')) {
        navigation.navigate('TestResult', { testId: test._id });
        return;
      }

      Alert.alert('Unable to start', message);
    } finally {
      setBusyTestId('');
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      if (typeof purchased !== 'boolean') {
        try {
          const checkRes = await apiClient.get('/study/my-courses');
          const myCourses = checkRes.data;
          const isPurchased = myCourses.some(
            (p) => String(p.course?._id || p.course?.id) === String(courseId)
          );
          setPurchased(isPurchased);

          if (!isPurchased) {
            Alert.alert('Purchase Required', 'Please purchase this course to access it.', [
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
        const [normalizedCourse, pubTestsRes] = await Promise.all([
          fetchBestCoursePayload(courseId),
          apiClient.get('/tests/published')
        ]);
        if (!normalizedCourse) {
          throw new Error('Course payload missing');
        }

        const pubMap = {};
        (pubTestsRes.data || []).forEach(t => {
          if (t && t._id) pubMap[String(t._id)] = t;
        });

        if (Array.isArray(normalizedCourse.tests)) {
          normalizedCourse.tests = normalizedCourse.tests.map(t => {
            const pubData = pubMap[String(t._id)] || {};
            return {
              ...t,
              attempted: !!pubData.attempted,
            };
          });
        }

        setCourse(normalizedCourse);
      } catch (err) {
        Alert.alert("Error", "Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, purchased, navigation]);

  const handleOpenSubject = (subject) => {
    navigation.navigate('StudySubjectDetail', { courseId, purchased, subject });
  };

  const renderSubjectsTab = () => {
    const subjects = course?.subjects || [];
    
    if (subjects.length === 0) {
      return <Text style={styles.emptyText}>No subjects available for this course.</Text>;
    }

    return (
      <View style={styles.gridWrap}>
        {subjects.map((subject, index) => {
          const acronym = subject.name ? subject.name.substring(0, 2).toUpperCase() : 'SU';
          // Stubbing progress to 0% as per requirements
          const progressPct = 0; 

          return (
            <TouchableOpacity 
              key={subject._id || `subject-${index}`} 
              style={styles.subjectCard}
              activeOpacity={0.7}
              onPress={() => handleOpenSubject(subject)}
            >
              <View style={styles.subjectCardRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{acronym}</Text>
                  </View>
                  <Text style={styles.subjectName} numberOfLines={2}>{subject.name}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTestsTab = () => {
    const tests = course?.tests || [];
    
    if (tests.length === 0) {
      return (
        <View style={styles.placeholderBox}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#CBD5E1" />
          <Text style={styles.placeholderTitle}>No Tests Found</Text>
          <Text style={styles.placeholderDesc}>There are no tests available for this course yet.</Text>
        </View>
      );
    }

    return (
      <View style={{ gap: 12 }}>
        {tests.map((test, index) => {
          const scheduledDate = test.scheduledAt ? new Date(test.scheduledAt).toLocaleDateString() : 'Available Now';

          return (
            <View key={test._id || `test-${index}`} style={styles.testCard}>
              <View style={styles.testHeader}>
                 <View style={styles.testTypeWrap}>
                   <Text style={styles.testType}>{test.testType || 'TEST'}</Text>
                 </View>
                 <View style={styles.testDurationWrap}>
                   <MaterialCommunityIcons name="clock-outline" size={12} color="#64748B" />
                   <Text style={styles.testDuration}>{test.duration} mins</Text>
                 </View>
              </View>
              
              <Text style={styles.testName} numberOfLines={2}>{test.name}</Text>
              {test.syllabus ? <Text style={styles.testSyllabus} numberOfLines={1}>{test.syllabus}</Text> : null}
              
              <View style={styles.testDateWrap}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={14} color="#94A3B8" />
                <Text style={styles.testDate}>{scheduledDate}</Text>
              </View>
              
              <View style={styles.testActions}>
                {(!test.attempted || test.mode !== 'real') && (
                  <TouchableOpacity 
                    style={[styles.attemptBtn, busyTestId === test._id && styles.startBtnDisabled]}
                    onPress={() => startTest(test)}
                    disabled={busyTestId === test._id}
                  >
                    {busyTestId === test._id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.attemptBtnText}>{test.attempted ? 'Retry' : 'Attempt Test'}</Text>
                    )}
                  </TouchableOpacity>
                )}
                
                {test.attempted && (
                  <TouchableOpacity
                    style={styles.resultBtn}
                    onPress={() => navigation.navigate('TestResult', { testId: test._id })}
                  >
                    <Text style={styles.resultBtnText}>Result</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader
        title={course?.name || "Study Room"}
        navigation={navigation}
        showBack={true}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      ) : course ? (
        <View style={styles.container}>
          {/* Custom Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'Subjects' && styles.tabItemActive]}
              onPress={() => setActiveTab('Subjects')}
            >
              <Text style={[styles.tabText, activeTab === 'Subjects' && styles.tabTextActive]}>Subjects</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'Tests' && styles.tabItemActive]}
              onPress={() => setActiveTab('Tests')}
            >
              <Text style={[styles.tabText, activeTab === 'Tests' && styles.tabTextActive]}>Tests</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {activeTab === 'Subjects' ? renderSubjectsTab() : renderTestsTab()}
          </ScrollView>
        </View>
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#EF4444" },
  
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#1D4ED8',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },

  content: { 
    padding: SCREEN_PADDING, 
    paddingBottom: 40 
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },

  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subjectCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: GRID_GAP,
    justifyContent: 'space-between',
    minHeight: 110,
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
  },
  subjectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  progressBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  placeholderBox: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  placeholderDesc: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  testCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  testTypeWrap: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testType: {
    color: '#EA580C',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testDurationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testDuration: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  testName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 4,
  },
  testSyllabus: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  testDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  testDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  testActions: {
    flexDirection: 'row',
    gap: 12,
  },
  attemptBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attemptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resultBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resultBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  startBtnDisabled: {
    opacity: 0.7,
  },
});
