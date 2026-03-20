import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AppHeader from '../../components/AppHeader';
import apiClient from '../../api/client';

const COURSE_IMAGE = require('../../../assets/icon.png');

export default function OttCourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  console.log('Course ID:', courseId); // Debug log to check courseId
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  // Remove inline video state

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        // Replace with your actual endpoint
        const res = await apiClient.get(`/ott/courses/${courseId}`);
        console.log('Course Data:', res.data); // Debug log to check course data
        setCourse({
          ...res.data,
          image: COURSE_IMAGE, // Use backend image if available
        });
      } catch (err) {
        Alert.alert('Error', 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handlePlay = (videoId, videoname) => {
    navigation.navigate('OttVideoPlayer', { courseId, videoId, videoname });
  };

  return (
    <View style={styles.safeArea}>
      <AppHeader title="Course Detail" navigation={navigation} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      ) : course ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Image source={course.image} style={styles.image} resizeMode="cover" />
          <Text style={styles.title}>{course.name}</Text>
          {/* Video List */}
          <View style={styles.videoListSection}>
            <Text style={styles.videoListTitle}>Videos</Text>
            {course.videolist && course.videolist.length > 0 ? (
              course.videolist.map((video) => (
                <View key={video._id} style={styles.videoItem}>
                  <Text style={styles.videoName}>{video.videoname}</Text>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => handlePlay(video._id, video.videoname)}
                  >
                    <Text style={styles.playButtonText}>Play</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No videos found.</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Course not found.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', padding: 24 },
  image: { width: '100%', height: 180, borderRadius: 16, marginBottom: 18 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 16, color: '#334155', textAlign: 'center', marginBottom: 16 },
  errorText: { fontSize: 16, color: '#EF4444' },
  videoListSection: { width: '100%', marginTop: 24 },
  videoListTitle: { fontSize: 18, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 12 },
  videoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 10 },
  videoName: { flex: 1, fontSize: 16, color: '#0F172A' },
  playButton: { backgroundColor: '#1D4ED8', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6 },
  playButtonText: { color: '#fff', fontWeight: 'bold' },
  playerContainer: { width: '100%', marginTop: 10 },
  videoPlayer: { width: 320, height: 180, borderRadius: 8, backgroundColor: '#000' },
});
