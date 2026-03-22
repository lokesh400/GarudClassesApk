import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, StatusBar, Image, Pressable, Text, TouchableOpacity, useWindowDimensions, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import apiClient from '../../api/client';

export default function OttVideoPlayerScreen({ route, navigation }) {
  const { courseId, videoId, videoname, videoUrl: directVideoUrl } = route.params || {};
  const isMountedRef = useRef(true);
  const hideControlsTimerRef = useRef(null);
  const progressTrackWidthRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscapeUi = isLandscape || screenWidth > screenHeight;

  const player = useVideoPlayer(null, (videoPlayer) => {
    videoPlayer.volume = 1;
    videoPlayer.muted = false;
    videoPlayer.timeUpdateEventInterval = 0.25;
  });

  const formatTime = (seconds) => {
    const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const clearHideControlsTimer = () => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  };

  const scheduleHideControls = (playingOverride = isPlaying) => {
    clearHideControlsTimer();
    if (!playingOverride || isLandscapeUi) return;
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  const handleToggleControls = () => {
    if (loading) return;

    if (isLandscapeUi) {
      setShowControls(true);
      return;
    }

    setShowControls((prev) => {
      const next = !prev;
      if (next) scheduleHideControls();
      else clearHideControlsTimer();
      return next;
    });
  };

  const togglePlayPause = () => {
    if (loading) return;

    const currentlyPlaying = !!player.playing;

    if (currentlyPlaying) {
      player.pause();
      setIsPlaying(false);
      clearHideControlsTimer();
      return;
    }

    player.play();
    setIsPlaying(true);
    scheduleHideControls(true);
  };

  const seekBy = (seconds) => {
    if (loading) return;

    const total = Number.isFinite(duration) && duration > 0 ? duration : player.duration || 0;
    const base = Number.isFinite(currentTime) ? currentTime : player.currentTime || 0;
    const nextTime = Math.max(0, Math.min(total, base + seconds));
    player.currentTime = nextTime;
    setCurrentTime(nextTime);
    setShowControls(true);
    scheduleHideControls();
  };

  const handleSeekFromPress = (event) => {
    if (loading) return;

    const trackWidth = progressTrackWidthRef.current;
    if (!trackWidth || !duration) return;
    const x = event.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    const nextTime = ratio * duration;
    player.currentTime = nextTime;
    setCurrentTime(nextTime);
    setShowControls(true);
    scheduleHideControls();
  };

  const toggleFullscreenOrientation = async () => {
    if (loading) return;

    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      return;
    }
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  };

  useEffect(() => {
    isMountedRef.current = true;

    const syncOrientation = async () => {
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      if (!isMountedRef.current) return;

      const landscapeNow =
        currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(landscapeNow);
    };

    syncOrientation();

    const listener = ScreenOrientation.addOrientationChangeListener((event) => {
      const currentOrientation = event.orientationInfo.orientation;
      const landscapeNow =
        currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(landscapeNow);
    });

    ScreenOrientation.unlockAsync();

    return () => {
      isMountedRef.current = false;
      clearHideControlsTimer();
      ScreenOrientation.removeOrientationChangeListener(listener);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    const resolveVideoUrl = async () => {
      setLoading(true);
      setHasStartedPlayback(false);

      if (directVideoUrl) {
        setVideoUrl(directVideoUrl);
        setShowControls(true);
        return;
      }

      if (!courseId || !videoId) {
        Alert.alert('Error', 'Video source not found.');
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(`/ott/courses/${courseId}/videos/${videoId}/url`);
        setVideoUrl(res.data.videourl);
        setShowControls(true);
      } catch (err) {
        Alert.alert('Error', 'Failed to load video URL.');
      } finally {
        // Keep loader visible until player source is actually replaced.
      }
    };
    resolveVideoUrl();
  }, [courseId, videoId, directVideoUrl]);

  useEffect(() => {
    let active = true;

    const loadIntoPlayer = async () => {
      if (!videoUrl) return;

      try {
        setLoading(true);
        setHasStartedPlayback(false);
        await player.replaceAsync({ uri: videoUrl, useCaching: true });
        player.play();
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(Number.isFinite(player.duration) ? player.duration : 0);
        setShowControls(true);
      } catch (err) {
        Alert.alert('Error', 'Failed to initialize video playback.');
        if (active) setLoading(false);
      } finally {
        // Keep loading until first confirmed playback frame.
      }
    };

    loadIntoPlayer();

    return () => {
      active = false;
    };
  }, [videoUrl, player]);

  useEffect(() => {
    if (hasStartedPlayback) {
      setLoading(false);
    }
  }, [hasStartedPlayback]);

  useEffect(() => {
    const pollPlaybackState = setInterval(() => {
      const nowTime = Number.isFinite(player.currentTime) ? player.currentTime : 0;
      const nowDuration = Number.isFinite(player.duration) ? player.duration : 0;
      const nowPlaying = !!player.playing;

      setCurrentTime(nowTime);
      setDuration(nowDuration);
      setIsPlaying(nowPlaying);

      // Consider the player ready once it starts producing playback.
      if (!hasStartedPlayback && (nowPlaying || nowTime > 0)) {
        setHasStartedPlayback(true);
      }
    }, 300);

    return () => clearInterval(pollPlaybackState);
  }, [player, hasStartedPlayback]);

  useEffect(() => {
    if (!showControls) {
      clearHideControlsTimer();
      return;
    }
    scheduleHideControls();
  }, [showControls, isPlaying]);

  useEffect(() => {
    const onBackPress = () => {
      if (isLandscapeUi) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        return true;
      }
      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [isLandscapeUi]);

  useEffect(() => {
    if (isLandscapeUi) {
      setShowControls(true);
      clearHideControlsTimer();
    }
  }, [isLandscapeUi]);

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const portraitPlayerHeight = Math.round(screenWidth * 9 / 16);
  const playerFrameStyle = isLandscapeUi
    ? styles.landscapeFrame
    : { ...styles.portraitFrame, height: portraitPlayerHeight };

  return (
    <SafeAreaView style={styles.safeArea} edges={isLandscapeUi ? [] : ["top"]}>
      <StatusBar hidden={isLandscapeUi} barStyle="dark-content" backgroundColor="#F8FAFC" />
      {!isLandscapeUi && (
        <AppHeader
          title={videoname || 'Video Player'}
          navigation={navigation}
          showBack={true}
          right={<Image source={require('../../../assets/icon.png')} style={{ width: 32, height: 32, borderRadius: 8 }} />}
        />
      )}

      <View style={[styles.playerContainer, playerFrameStyle]}>
        {videoUrl ? (
          <Pressable style={styles.videoPressArea} onPress={handleToggleControls}>
            <VideoView
              player={player}
              contentFit="contain"
              nativeControls={false}
              fullscreenOptions={{ enable: false }}
              style={{ width: '100%', height: '100%' }}
            />

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading video...</Text>
              </View>
            )}

            {showControls && !loading && (
              <View style={styles.controlsOverlay}>
                <View style={styles.topRow}>
                  <Text style={styles.videoTitle} numberOfLines={1}>{videoname || 'Video Player'}</Text>
                </View>

                <View style={styles.centerRow}>
                  <TouchableOpacity
                    style={styles.circleControl}
                    onPress={(e) => {
                      e.stopPropagation();
                      seekBy(-10);
                    }}
                  >
                    <MaterialCommunityIcons name="rewind-10" size={28} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playControl}
                    onPress={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isPlaying ? 'pause' : 'play'}
                      size={34}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.circleControl}
                    onPress={(e) => {
                      e.stopPropagation();
                      seekBy(10);
                    }}
                  >
                    <MaterialCommunityIcons name="fast-forward-10" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.bottomRow}>
                  <Text style={styles.timeText}>{formatTime(currentTime)} / {formatTime(duration)}</Text>

                  <Pressable
                    style={styles.progressTrack}
                    onLayout={(e) => {
                      progressTrackWidthRef.current = e.nativeEvent.layout.width;
                    }}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSeekFromPress(e);
                    }}
                  >
                    <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
                  </Pressable>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFullscreenOrientation();
                    }}
                    style={styles.fullscreenBtn}
                  >
                    <MaterialCommunityIcons
                      name={isLandscapeUi ? 'fullscreen-exit' : 'fullscreen'}
                      size={22}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Pressable>
        ) : (
          <ActivityIndicator size="large" color="#1D4ED8" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  portraitFrame: {
    alignSelf: 'center',
    marginTop: 10,
  },
  landscapeFrame: {
    flex: 1,
  },
  videoPressArea: {
    flex: 1,
    width: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleControl: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  playControl: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
    minWidth: 84,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  fullscreenBtn: {
    marginLeft: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
