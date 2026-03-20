import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Dimensions, Platform, StatusBar } from 'react-native';
import { useEffect as useOrientationEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Video } from 'expo-av';
import AppHeader from '../../components/AppHeader';
import apiClient from '../../api/client';

export default function OttVideoPlayerScreen({ route, navigation }) {
  const { courseId, videoId, videoname } = route.params;
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  // Allow landscape orientation
  useOrientationEffect(() => {
    ScreenOrientation.unlockAsync();
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    };
    Dimensions.addEventListener('change', onChange);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      Dimensions.removeEventListener('change', onChange);
    };
  }, []);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/ott/courses/${courseId}/videos/${videoId}/url`);
        setVideoUrl(res.data.videourl);
      } catch (err) {
        Alert.alert('Error', 'Failed to load video URL.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideoUrl();
  }, [courseId, videoId]);

  // Calculate player height for 16:9 aspect ratio
  const playerHeight = Math.round(screenWidth * 9 / 16);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.headerOverlay}>
        <AppHeader title={videoname || 'Video Player'} navigation={navigation} style={styles.headerTransparent} />
      </View>
      <View style={[styles.playerContainer, { width: screenWidth, height: playerHeight, backgroundColor: '#000' }]}> 
        {loading ? (
          <ActivityIndicator size="large" color="#38BDF8" />
        ) : videoUrl ? (
          <Video
            source={{ uri: videoUrl }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            shouldPlay
            useNativeControls
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  headerTransparent: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  playerContainer: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Removed infoSection, videoTitle, modernSubtitle, errorText
});
