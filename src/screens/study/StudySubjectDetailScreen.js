import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from "../../components/AppHeader";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StudySubjectDetailScreen({ route, navigation }) {
  const { courseId, purchased, subject } = route.params || {};

  if (!subject) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Subject Details" navigation={navigation} showBack />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Subject data missing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleOpenChapter = (chapter, chapterIndex) => {
    navigation.navigate('StudyChapterDetail', {
      courseId,
      purchased,
      subjectName: subject.name,
      chapter,
      chapterIndex
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader title={subject.name || "Subject"} navigation={navigation} showBack />
      
      <ScrollView contentContainerStyle={styles.content}>
        {(!subject.chapters || subject.chapters.length === 0) ? (
          <Text style={styles.emptyText}>No chapters found for this subject.</Text>
        ) : (
          subject.chapters.map((chapter, chapterIndex) => {
            const lectureCount = chapter.lectures ? chapter.lectures.length : 0;
            // Completed lecture tracking is stubbed to 0 as per backend limitations
            const completedCount = 0; 
            const chapterId = chapter._id || `chapter-${chapterIndex}`;
            const chapterNumStr = String(chapterIndex + 1).padStart(2, '0');

            return (
              <TouchableOpacity
                key={chapterId}
                style={styles.chapterCard}
                activeOpacity={0.7}
                onPress={() => handleOpenChapter(chapter, chapterIndex)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.chapterBadgeText}>CH - {chapterNumStr}</Text>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.textStack}>
                    <Text style={styles.chapterTitle} numberOfLines={2}>
                      {chapter.name || `Chapter ${chapterIndex + 1}`}
                    </Text>
                    <Text style={styles.lectureCountText}>
                      Lecture: {completedCount}/{lectureCount}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#EF4444" },
  content: { padding: 16, paddingBottom: 28 },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  chapterBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textStack: {
    flex: 1,
    paddingRight: 16,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 22,
  },
  lectureCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  }
});
