/**
 * YoutubeVideoPlayerScreen
 *
 * Mirrors the website's course-player.js logic exactly:
 *  1. Fetches a base64-encoded YouTube video ID token from the backend
 *     endpoint:  GET /api/courses/published/:courseId/lectures/:lectureId/playback
 *  2. Decodes the token → raw YouTube video ID
 *  3. Embeds the video using the YouTube IFrame API inside a WebView
 *  4. Overlays floating watermarks (user email) just like the website
 *  5. Custom controls: play/pause, seek ±10s, progress bar, time display, fullscreen
 *
 * Route params expected:  { courseId, lectureId, lectureTitle, status }
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  TouchableOpacity,
  BackHandler,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Build the full HTML page injected into the WebView ──────────────────────
function buildPlayerHtml(youtubeId, status, userEmail) {
  const isLive = status === 'live';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#000; overflow:hidden; }

    #player-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }

    #ytplayer {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
      pointer-events: none;
    }

    /* Click-through overlay so we handle taps, not YouTube */
    #tap-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 10;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      font-family: monospace;
      pointer-events: none;
      z-index: 20;
      white-space: nowrap;
      transition: all 5s ease-in-out;
    }

    /* Progress bar & Controls */
    #controls {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 60px;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 16px;
      z-index: 30;
      opacity: 1;
      transition: opacity 0.3s ease;
      pointer-events: auto;
    }
    #controls.hidden {
      opacity: 0;
      pointer-events: none;
    }
    #controls button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #controls button svg {
      width: 24px;
      height: 24px;
      fill: #fff;
      filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));
    }
    #progress-wrap {
      flex: 1;
      height: 12px;
      display: flex;
      align-items: center;
      cursor: pointer;
      position: relative;
    }
    #progress-bg {
      width: 100%;
      height: 4px;
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
      position: relative;
    }
    #progress-fill {
      height: 100%;
      background: #f97316;
      border-radius: 2px;
      width: 0%;
      position: relative;
    }
    #progress-handle {
      position: absolute;
      right: -6px;
      top: -4px;
      width: 12px;
      height: 12px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    #time-display {
      font-size: 12px;
      color: #fff;
      min-width: 70px;
      text-align: right;
      font-weight: 500;
      text-shadow: 0px 1px 2px rgba(0,0,0,0.8);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
<div id="player-wrapper">
  <div id="ytplayer"></div>
  <div id="tap-overlay"></div>

  <div class="watermark" id="wm1" style="top:15%;left:10%;">${userEmail}</div>
  <div class="watermark" id="wm2" style="top:55%;left:50%;">${userEmail}</div>
  <div class="watermark" id="wm3" style="top:30%;left:70%;">${userEmail}</div>

  <div id="controls">
    <button id="btn-back" onclick="seekBy(-10)">
      <svg viewBox="0 0 24 24"><path d="M12.5 12l5 4V8l-5 4zM6.5 12l5 4V8l-5 4zM5 8h2v8H5z"/></svg>
    </button>
    <button id="btn-play" onclick="togglePlay()">
      <svg id="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      <svg id="pause-icon" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
    </button>
    <button id="btn-fwd" onclick="seekBy(10)">
      <svg viewBox="0 0 24 24"><path d="M11.5 12l-5-4v8l5-4zM17.5 12l-5-4v8l5-4zM17 8h2v8h-2z"/></svg>
    </button>
    <div id="progress-wrap" onclick="seekFromClick(event)">
      <div id="progress-bg">
        <div id="progress-fill">
          <div id="progress-handle"></div>
        </div>
      </div>
    </div>
    <div id="time-display">${isLive ? 'LIVE' : '0:00 / 0:00'}</div>
  </div>
</div>

<script>
  var player;
  var isLive = ${isLive ? 'true' : 'false'};
  var controlsInterval;

  // Load YouTube IFrame API
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  function onYouTubeIframeAPIReady() {
    player = new YT.Player('ytplayer', {
      videoId: '${youtubeId}',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        playsinline: 1,
        origin: 'https://testportal.garudclasses.com'
      },
      events: {
        onReady: function(e) {
          e.target.playVideo();
          startControls();
          moveWatermarks();
          setInterval(moveWatermarks, 5000);
        },
        onStateChange: onStateChange
      }
    });
  }



  var hideControlsTimer;

  function resetControlsTimer() {
    var controls = document.getElementById('controls');
    controls.classList.remove('hidden');
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(function() {
      controls.classList.add('hidden');
    }, 3000);
  }

  // Initial show
  resetControlsTimer();

  function onStateChange(e) {
    var playIcon = document.getElementById('play-icon');
    var pauseIcon = document.getElementById('pause-icon');
    if (e.data === YT.PlayerState.PLAYING) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
    resetControlsTimer();
    // Notify React Native of state changes
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stateChange', playing: e.data === YT.PlayerState.PLAYING }));
  }

  function togglePlay() {
    resetControlsTimer();
    if (!player || typeof player.getPlayerState !== 'function') return;
    var state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  function seekBy(seconds) {
    resetControlsTimer();
    if (!player || typeof player.getCurrentTime !== 'function') return;
    var t = player.getCurrentTime();
    var d = player.getDuration();
    player.seekTo(Math.max(0, Math.min(d, t + seconds)), true);
  }

  function seekFromClick(e) {
    resetControlsTimer();
    if (!player || typeof player.getDuration !== 'function') return;
    var d = player.getDuration();
    if (d <= 0) return;
    var rect = e.currentTarget.getBoundingClientRect();
    var pos = (e.clientX - rect.left) / rect.width;
    player.seekTo(pos * d, true);
  }

  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function startControls() {
    if (controlsInterval) clearInterval(controlsInterval);
    controlsInterval = setInterval(function() {
      if (!player || typeof player.getCurrentTime !== 'function') return;
      var t = player.getCurrentTime();
      var d = player.getDuration();
      var fill = document.getElementById('progress-fill');
      var timeEl = document.getElementById('time-display');

      if (d > 0 && d !== Infinity) {
        var pct = (t / d) * 100;
        if (fill) fill.style.width = pct + '%';
        if (timeEl) timeEl.textContent = formatTime(t) + ' / ' + formatTime(d);
      } else if (isLive) {
        if (timeEl) timeEl.textContent = '🔴 LIVE';
        if (fill) fill.style.width = '100%';
      }

      // Send time to RN for external display if needed
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'timeUpdate',
        currentTime: t,
        duration: d
      }));
    }, 1000);
  }

  function moveWatermarks() {
    ['wm1','wm2','wm3'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      var maxX = Math.max(10, window.innerWidth - 200);
      var maxY = Math.max(10, window.innerHeight - 80);
      el.style.left = Math.floor(Math.random() * maxX) + 'px';
      el.style.top  = Math.floor(Math.random() * maxY) + 'px';
    });
  }

  // Tap overlay single click toggles controls visibility
  document.getElementById('tap-overlay').addEventListener('click', function() {
    var controls = document.getElementById('controls');
    if (controls.classList.contains('hidden')) {
      resetControlsTimer();
    } else {
      controls.classList.add('hidden');
      clearTimeout(hideControlsTimer);
    }
  });

  // Tap overlay double click for fullscreen
  document.getElementById('tap-overlay').addEventListener('dblclick', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullscreen' }));
  });
</script>
</body>
</html>
`;
}

// Pure JS fallback for atob in React Native
const decodeBase64 = (input) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = String(input).replace(/[=]+$/, '');
  let output = '';
  for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

// ─── Screen component ─────────────────────────────────────────────────────────
export default function StudyYoutubeVideoPlayerScreen({ route, navigation }) {
  const { courseId, lectureId, lectureTitle, status } = route.params || {};
  const [youtubeId, setYoutubeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const webViewRef = useRef(null);

  // Get user email for watermark
  useEffect(() => {
    AsyncStorage.getItem('user_data').then(raw => {
      if (raw) {
        try {
          const u = JSON.parse(raw);
          setUserEmail(u.email || u.username || '');
        } catch (_) {}
      }
    });
  }, []);

  // Fetch playback token from backend (same endpoint as website)
  useEffect(() => {
    if (!courseId || !lectureId) {
      setError('Missing course or lecture ID.');
      setLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        const res = await apiClient.get(
          `/courses/published/${courseId}/lectures/${lectureId}/playback`
        );
        const token = res?.data?.token;
        if (!token) throw new Error('No playback token received');

        // Decode base64 → YouTube video ID (using pure JS fallback instead of Node Buffer)
        const decoded = decodeBase64(token);
        setYoutubeId(decoded);
      } catch (err) {
        console.error('Playback Token Fetch Error:', err?.response?.status, err?.response?.data, err.message);
        setError(err?.response?.data?.message || 'Unable to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [courseId, lectureId]);

  // Orientation handling
  useEffect(() => {
    ScreenOrientation.unlockAsync();

    const sub = ScreenOrientation.addOrientationChangeListener(ev => {
      const o = ev.orientationInfo.orientation;
      const land =
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(land);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(sub);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Back button: if landscape, go portrait first
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLandscape) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [isLandscape]);

  // Messages from the WebView
  const handleWebViewMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'fullscreen') {
        // Toggle orientation for fullscreen
        if (isLandscape) {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      }
    } catch (_) {}
  };

  const videoHeight = isLandscape
    ? Dimensions.get('window').height
    : Math.round(SCREEN_WIDTH * 9 / 16);

  return (
    <SafeAreaView style={styles.safeArea} edges={isLandscape ? [] : ['top']}>
      <StatusBar hidden={isLandscape} barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header – hidden in landscape */}
      {!isLandscape && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#1D4ED8" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {lectureTitle || 'Video Player'}
            </Text>
            {status === 'live' && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>🔴 LIVE</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() =>
              ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
            }
          >
            <MaterialCommunityIcons name="fullscreen" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Player area */}
      {loading && (
        <View style={[styles.playerBox, { height: videoHeight }]}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading video…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={[styles.playerBox, { height: videoHeight }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {youtubeId && !loading && (
        <>
          <WebView
            ref={webViewRef}
            source={{ html: buildPlayerHtml(youtubeId, status, userEmail), baseUrl: 'https://testportal.garudclasses.com' }}
            style={isLandscape ? styles.webviewLandscape : { height: videoHeight, width: '100%' }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo={false}  // We handle fullscreen via orientation
            onMessage={handleWebViewMessage}
            // Security: restrict navigation inside the WebView
            onShouldStartLoadWithRequest={req => {
              // Allow the spoofed baseUrl and YouTube iframe URLs
              return req.url === 'about:blank' || 
                     req.url === 'https://testportal.garudclasses.com/' ||
                     req.url.startsWith('https://testportal.garudclasses.com') ||
                     req.url.startsWith('https://www.youtube.com');
            }}
          />
          {!isLandscape && (
            <View style={styles.chatSection}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>Live Chat</Text>
              </View>
              <View style={styles.chatPlaceholder}>
                <MaterialCommunityIcons name="chat-outline" size={40} color="#CBD5E1" />
                <Text style={styles.chatPlaceholderText}>Chat features coming soon</Text>
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  playerBox: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  webviewLandscape: {
    flex: 1,
    width: '100%',
  },
  chatSection: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  chatPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  chatPlaceholderText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});
