import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from "../../components/AppHeader";
import { MaterialCommunityIcons } from '@expo/vector-icons';
const COURSE_IMAGE = require("../../../assets/icon.png");

export default function StudyChapterDetailScreen({ route, navigation }) {
  const { courseId, purchased, subjectName, chapter } = route.params || {};
  const [activeTab, setActiveTab] = useState('Lectures');
  const [expandedNotesId, setExpandedNotesId] = useState(null);

  if (!chapter) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Chapter Details" navigation={navigation} showBack />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Chapter data missing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePlay = (lesson) => {
    if (!purchased) {
      Alert.alert('Locked', 'Please purchase this course to watch videos.');
      return;
    }
    if (lesson._id) {
      navigation.navigate('StudyYoutubeVideoPlayer', {
        courseId,
        lectureId: lesson._id,
        lectureTitle: lesson.title,
        status: lesson.status || 'ended',
      });
      return;
    }
    Alert.alert('Unavailable', 'Video link is not available for this lesson.');
  };

  const handleNotes = (lesson) => {
    if (!purchased) {
      Alert.alert('Locked', 'Please purchase this course to view attachments.');
      return;
    }
    if (!lesson.pdfs || lesson.pdfs.length === 0) {
      Alert.alert('No Notes', 'There are no notes available for this lesson.');
      return;
    }
    
    if (expandedNotesId === lesson._id) {
      setExpandedNotesId(null);
    } else {
      setExpandedNotesId(lesson._id);
    }
  };

  const renderLectures = () => {
    if (!chapter.lectures || chapter.lectures.length === 0) {
      return <Text style={styles.emptyText}>No lectures found in this chapter.</Text>;
    }

    return chapter.lectures.map((lesson, lessonIndex) => {
      // Date formatting fallback
      let dateStr = 'Available';
      if (lesson.scheduledAt) {
        const d = new Date(lesson.scheduledAt);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }
      
      const isExpanded = expandedNotesId === lesson._id;
      
      return (
        <View key={lesson._id || `lesson-${lessonIndex}`} style={styles.lectureCard}>
          {/* Top Progress Bar Stub */}
          <View style={styles.cardProgressWrap}>
            <View style={[styles.cardProgressFill, { width: '0%' }]} />
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <View style={styles.thumbnailWrap}>
                <Image source={COURSE_IMAGE} style={styles.thumbnail} />
                <View style={styles.playIconBadge}>
                  <MaterialCommunityIcons name="play" size={14} color="#FFF" />
                </View>
              </View>

              <View style={styles.infoWrap}>
                <Text style={styles.metaText}>Lecture • {dateStr}</Text>
                <Text style={styles.lectureTitle}>{lesson.title}</Text>
                <Text style={styles.durationText}>2h:00m</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handlePlay(lesson)}>
                <MaterialCommunityIcons name="play-circle-outline" size={18} color="#0F172A" />
                <Text style={styles.actionBtnText}>Watch</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, isExpanded && styles.actionBtnActive]} onPress={() => handleNotes(lesson)}>
                <Text style={[styles.actionBtnText, isExpanded && styles.actionBtnTextActive]}>Notes & more</Text>
                {isExpanded && <MaterialCommunityIcons name="chevron-up" size={18} color="#1D4ED8" />}
              </TouchableOpacity>
            </View>
            
            {isExpanded && lesson.pdfs && lesson.pdfs.length > 0 && (
              <View style={styles.expandedNotesWrap}>
                {lesson.pdfs.map((pdf, idx) => (
                  <TouchableOpacity 
                    key={`pdf-${idx}`} 
                    style={styles.pdfItem}
                    onPress={() => {
                      navigation.navigate('AttachmentViewer', {
                        attachment: pdf,
                        title: pdf?.title || 'Notes',
                        lessonTitle: lesson?.title,
                        courseTitle: subjectName,
                      });
                    }}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={22} color="#EF4444" />
                    <Text style={styles.pdfItemText} numberOfLines={1}>{pdf.title || `Document ${idx + 1}`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    });
  };

  const renderResources = () => {
    const allPdfs = [];
    (chapter.lectures || []).forEach(lesson => {
      (lesson.pdfs || []).forEach(pdf => {
        allPdfs.push({
          ...pdf,
          lessonTitle: lesson.title
        });
      });
    });

    if (allPdfs.length === 0) {
      return (
        <View style={styles.placeholderBox}>
          <MaterialCommunityIcons name="folder-open-outline" size={48} color="#CBD5E1" />
          <Text style={styles.placeholderTitle}>No Resources</Text>
          <Text style={styles.placeholderDesc}>No documents are available for this chapter.</Text>
        </View>
      );
    }

    return (
      <View style={styles.resourcesWrap}>
        {allPdfs.map((pdf, idx) => (
          <TouchableOpacity 
            key={`res-${idx}`} 
            style={styles.resourceCard}
            onPress={() => {
              if (!purchased) {
                Alert.alert('Locked', 'Please purchase this course to view attachments.');
                return;
              }
              navigation.navigate('AttachmentViewer', {
                attachment: pdf,
                title: pdf?.title || 'Notes',
                lessonTitle: pdf.lessonTitle,
                courseTitle: subjectName,
              });
            }}
          >
            <View style={styles.resourceIconBox}>
              <MaterialCommunityIcons name="file-pdf-box" size={28} color="#EF4444" />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle} numberOfLines={1}>{pdf.title || `Document ${idx + 1}`}</Text>
              <Text style={styles.resourceMeta} numberOfLines={1}>{pdf.lessonTitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppHeader title={chapter.name || "Chapter"} navigation={navigation} showBack />
      
      {/* Scrollable Tab Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {['Lectures', 'Resources'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'Lectures' ? renderLectures() : renderResources()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#EF4444" },
  
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBarScroll: {
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

  content: { padding: 16, paddingBottom: 28 },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  
  lectureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardProgressWrap: {
    height: 4,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  cardContent: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  thumbnailWrap: {
    position: 'relative',
    marginRight: 16,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  playIconBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  lectureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
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
  actionBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  actionBtnTextActive: {
    color: '#1D4ED8',
  },
  expandedNotesWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  pdfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  pdfItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  resourcesWrap: {
    gap: 12,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resourceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  resourceMeta: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});
