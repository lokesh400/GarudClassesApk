import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  BackHandler,
  Dimensions,
  ScrollView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { WebView } from 'react-native-webview';

import * as ScreenOrientation from
  'expo-screen-orientation';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import { LinearGradient } from
  'expo-linear-gradient';

import apiClient from '../../api/client';
import io from 'socket.io-client';

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

  red: '#DC2626',
  redLight: '#FEE2E2',

  orange: '#EA580C',
  orangeLight: '#FFEDD5',
};


function buildPlayerHtml(
  youtubeId,
  status,
  userEmail
) {
  const isLive = status === 'live';

  const safeEmail = String(
    userEmail || 'Garud Classes'
  )
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `
<!DOCTYPE html>

<html>

<head>

<meta
  name="viewport"
  content="
    width=device-width,
    initial-scale=1.0,
    maximum-scale=1.0,
    user-scalable=no
  "
>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
}

#player-wrapper {
  position: relative;

  width: 100%;
  height: 100%;

  background: #000;
}

#ytplayer {
  position: absolute;

  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  border: none;

  pointer-events: none;
}

#tap-overlay {
  position: absolute;

  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  z-index: 10;
}

.watermark {
  position: absolute;

  font-size: 10px;

  color: rgba(
    255,
    255,
    255,
    0.30
  );

  font-family: monospace;

  pointer-events: none;

  z-index: 20;

  white-space: nowrap;

  transition:
    left 5s ease-in-out,
    top 5s ease-in-out;

  text-shadow:
    0 1px 3px rgba(
      0,
      0,
      0,
      0.8
    );
}

#controls {
  position: absolute;

  bottom: 0;
  left: 0;
  right: 0;

  min-height: 72px;

  background:
    linear-gradient(
      to top,
      rgba(0,0,0,0.95) 0%,
      rgba(0,0,0,0.70) 55%,
      rgba(0,0,0,0) 100%
    );

  display: flex;

  align-items: center;

  padding:
    18px 15px
    10px 15px;

  gap: 12px;

  z-index: 30;

  opacity: 1;

  transition:
    opacity 0.25s ease;

  pointer-events: auto;
}

#controls.hidden {
  opacity: 0;

  pointer-events: none;
}

.control-button {
  width: 39px;
  height: 39px;

  border-radius: 50%;

  background:
    rgba(
      255,
      255,
      255,
      0.13
    );

  border: 1px solid
    rgba(
      255,
      255,
      255,
      0.14
    );

  display: flex;

  align-items: center;

  justify-content: center;

  color: #fff;

  padding: 0;
}

.control-button svg {
  width: 21px;
  height: 21px;

  fill: #fff;
}

#btn-play {
  width: 45px;
  height: 45px;

  background: #6D28D9;

  border: 1px solid
    rgba(
      255,
      255,
      255,
      0.25
    );
}

#btn-play svg {
  width: 24px;
  height: 24px;
}

#progress-area {
  flex: 1;

  min-width: 0;
}

#progress-wrap {
  width: 100%;

  height: 20px;

  display: flex;

  align-items: center;

  cursor: pointer;
}

#progress-bg {
  width: 100%;

  height: 5px;

  background:
    rgba(
      255,
      255,
      255,
      0.28
    );

  border-radius: 100px;

  position: relative;
}

#progress-fill {
  height: 100%;

  width: 0%;

  border-radius: 100px;

  position: relative;

  background:
    linear-gradient(
      90deg,
      #8B5CF6,
      #A78BFA
    );
}

#progress-handle {
  position: absolute;

  right: -6px;
  top: -4px;

  width: 13px;
  height: 13px;

  background: #FFFFFF;

  border-radius: 50%;

  box-shadow:
    0 2px 7px
    rgba(
      0,
      0,
      0,
      0.45
    );
}

#time-display {
  color: #FFFFFF;

  font-size: 10px;

  font-weight: 600;

  margin-top: 1px;

  text-align: right;

  white-space: nowrap;

  text-shadow:
    0 1px 3px
    rgba(
      0,
      0,
      0,
      0.9
    );
}

#fullscreen-btn {
  width: 39px;
  height: 39px;

  border-radius: 12px;

  background:
    rgba(
      255,
      255,
      255,
      0.13
    );

  border: 1px solid
    rgba(
      255,
      255,
      255,
      0.14
    );

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 0;
}

#fullscreen-btn svg {
  width: 21px;
  height: 21px;

  fill: #FFFFFF;
}

#live-indicator {
  position: absolute;

  top: 14px;
  left: 14px;

  z-index: 31;

  display:
    ${isLive ? 'flex' : 'none'};

  align-items: center;

  gap: 5px;

  background:
    rgba(
      220,
      38,
      38,
      0.94
    );

  border-radius: 7px;

  padding:
    5px 8px;

  color: #FFFFFF;

  font-size: 9px;

  font-weight: 800;

  letter-spacing: 0.5px;
}

.live-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #FFFFFF;

  animation:
    pulse 1.2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }

  100% {
    opacity: 1;
  }
}

#loading-overlay {
  position: absolute;

  inset: 0;

  z-index: 50;

  background: #000;

  display: flex;

  align-items: center;

  justify-content: center;

  flex-direction: column;

  gap: 13px;

  color: #FFFFFF;
}

.loader {
  width: 38px;
  height: 38px;

  border-radius: 50%;

  border:
    3px solid
    rgba(
      255,
      255,
      255,
      0.15
    );

  border-top-color:
    #8B5CF6;

  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform:
      rotate(360deg);
  }
}

.loading-text {
  color:
    rgba(
      255,
      255,
      255,
      0.72
    );

  font-size: 11px;

  font-weight: 600;
}

</style>

</head>

<body>

<div id="player-wrapper">

<div id="loading-overlay">

  <div class="loader"></div>

  <div class="loading-text">
    Preparing lecture...
  </div>

</div>

<div id="ytplayer"></div>

<div id="tap-overlay"></div>

<div id="live-indicator">

  <span class="live-dot"></span>

  LIVE

</div>

<div
  class="watermark"
  id="wm1"
  style="
    top:15%;
    left:10%;
  "
>
  ${safeEmail}
</div>

<div
  class="watermark"
  id="wm2"
  style="
    top:55%;
    left:50%;
  "
>
  ${safeEmail}
</div>

<div
  class="watermark"
  id="wm3"
  style="
    top:30%;
    left:70%;
  "
>
  ${safeEmail}
</div>

<div id="controls">

<button
  class="control-button"
  onclick="seekBy(-10)"
>

<svg viewBox="0 0 24 24">

<path
  d="
    M11 18V6
    L3 12
    L11 18Z

    M21 18V6
    L13 12
    L21 18Z
  "
/>

</svg>

</button>

<button
  id="btn-play"
  class="control-button"
  onclick="togglePlay()"
>

<svg
  id="play-icon"
  viewBox="0 0 24 24"
>

<path
  d="
    M8 5
    v14
    l11-7
    z
  "
/>

</svg>

<svg
  id="pause-icon"
  viewBox="0 0 24 24"
  style="display:none;"
>

<path
  d="
    M6 19
    h4
    V5
    H6
    v14
    z

    m8-14
    v14
    h4
    V5
    h-4
    z
  "
/>

</svg>

</button>

<button
  class="control-button"
  onclick="seekBy(10)"
>

<svg viewBox="0 0 24 24">

<path
  d="
    M13 6
    v12
    l8-6
    l-8-6
    z

    M3 6
    v12
    l8-6
    l-8-6
    z
  "
/>

</svg>

</button>

<div id="progress-area">

<div
  id="progress-wrap"
  onclick="seekFromClick(event)"
>

<div id="progress-bg">

<div id="progress-fill">

<div id="progress-handle"></div>

</div>

</div>

</div>

<div id="time-display">

${isLive ? 'LIVE' : '0:00 / 0:00'}

</div>

</div>

<button
  id="fullscreen-btn"
  onclick="requestFullscreen()"
>

<svg viewBox="0 0 24 24">

<path
  d="
    M7 14
    H5
    v5
    h5
    v-2
    H7
    v-3

    m-2-4
    h2
    V7
    h3
    V5
    H5
    v5

    m12 7
    h-3
    v2
    h5
    v-5
    h-2
    v3

    M14 5
    v2
    h3
    v3
    h2
    V5
    h-5
  "
/>

</svg>

</button>

</div>

</div>

<script>

var player;

var isLive =
  ${isLive ? 'true' : 'false'};

var controlsInterval;

var hideControlsTimer;

var tag =
  document.createElement(
    'script'
  );

tag.src =
  'https://www.youtube.com/iframe_api';

document.head.appendChild(tag);


function sendMessage(data) {

  if (
    window.ReactNativeWebView
  ) {

    window.ReactNativeWebView
      .postMessage(
        JSON.stringify(data)
      );

  }

}


function onYouTubeIframeAPIReady() {

  player = new YT.Player(
    'ytplayer',
    {

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

        origin:
          'https://testportal.garudclasses.com'

      },

      events: {

        onReady: function(e) {

          var loadingOverlay =
            document.getElementById(
              'loading-overlay'
            );

          if (loadingOverlay) {

            loadingOverlay.style.display =
              'none';

          }

          sendMessage({
            type: 'playerReady'
          });

          startControls();

          moveWatermarks();

          setInterval(
            moveWatermarks,
            5000
          );

          resetControlsTimer();

        },

        onStateChange:
          onStateChange

      }

    }
  );

}


function restorePlayback(
  time,
  shouldPlay
) {

  if (
    !player ||
    typeof player.seekTo !==
      'function'
  ) {

    return;

  }

  var targetTime =
    Number(time || 0);

  player.seekTo(
    targetTime,
    true
  );

  setTimeout(
    function() {

      if (shouldPlay) {

        player.playVideo();

      } else {

        player.pauseVideo();

      }

    },
    200
  );

}


function resetControlsTimer() {

  var controls =
    document.getElementById(
      'controls'
    );

  controls.classList.remove(
    'hidden'
  );

  clearTimeout(
    hideControlsTimer
  );

  hideControlsTimer =
    setTimeout(
      function() {

        controls.classList.add(
          'hidden'
        );

      },
      3500
    );

}


function onStateChange(e) {

  var playIcon =
    document.getElementById(
      'play-icon'
    );

  var pauseIcon =
    document.getElementById(
      'pause-icon'
    );

  if (
    e.data ===
    YT.PlayerState.PLAYING
  ) {

    playIcon.style.display =
      'none';

    pauseIcon.style.display =
      'block';

  } else {

    playIcon.style.display =
      'block';

    pauseIcon.style.display =
      'none';

  }

  resetControlsTimer();

  sendMessage({

    type:
      'stateChange',

    playing:
      e.data ===
      YT.PlayerState.PLAYING

  });

}


function togglePlay() {

  resetControlsTimer();

  if (
    !player ||
    typeof player.getPlayerState
      !== 'function'
  ) {

    return;

  }

  var state =
    player.getPlayerState();

  if (
    state ===
    YT.PlayerState.PLAYING
  ) {

    player.pauseVideo();

  } else {

    player.playVideo();

  }

}


function seekBy(seconds) {

  resetControlsTimer();

  if (
    !player ||
    typeof player.getCurrentTime
      !== 'function'
  ) {

    return;

  }

  var t =
    player.getCurrentTime();

  var d =
    player.getDuration();

  player.seekTo(

    Math.max(

      0,

      Math.min(
        d,
        t + seconds
      )

    ),

    true

  );

}


function seekFromClick(e) {

  resetControlsTimer();

  if (
    !player ||
    typeof player.getDuration
      !== 'function'
  ) {

    return;

  }

  var d =
    player.getDuration();

  if (d <= 0) {

    return;

  }

  var rect =
    e.currentTarget
      .getBoundingClientRect();

  var pos =
    (
      e.clientX -
      rect.left
    )
    /
    rect.width;

  player.seekTo(
    pos * d,
    true
  );

}


function formatTime(s) {

  if (
    !isFinite(s) ||
    s < 0
  ) {

    return '0:00';

  }

  var h =
    Math.floor(
      s / 3600
    );

  var m =
    Math.floor(
      (
        s % 3600
      )
      /
      60
    );

  var sec =
    Math.floor(
      s % 60
    );

  if (h > 0) {

    return (
      h +
      ':' +
      (
        m < 10
          ? '0'
          : ''
      ) +
      m +
      ':' +
      (
        sec < 10
          ? '0'
          : ''
      ) +
      sec
    );

  }

  return (
    m +
    ':' +
    (
      sec < 10
        ? '0'
        : ''
    ) +
    sec
  );

}


function startControls() {

  if (controlsInterval) {

    clearInterval(
      controlsInterval
    );

  }

  controlsInterval =
    setInterval(
      function() {

        if (
          !player ||
          typeof player.getCurrentTime
            !== 'function'
        ) {

          return;

        }

        var t =
          player.getCurrentTime();

        var d =
          player.getDuration();

        var fill =
          document.getElementById(
            'progress-fill'
          );

        var timeEl =
          document.getElementById(
            'time-display'
          );

        if (
          d > 0 &&
          d !== Infinity
        ) {

          var pct =
            (
              t / d
            ) * 100;

          if (fill) {

            fill.style.width =
              pct + '%';

          }

          if (timeEl) {

            timeEl.textContent =
              formatTime(t)
              +
              ' / '
              +
              formatTime(d);

          }

        } else if (isLive) {

          if (timeEl) {

            timeEl.textContent =
              'LIVE';

          }

          if (fill) {

            fill.style.width =
              '100%';

          }

        }

        sendMessage({

          type:
            'timeUpdate',

          currentTime: t,

          duration: d

        });

      },
      500
    );

}


function moveWatermarks() {

  [
    'wm1',
    'wm2',
    'wm3'
  ]
  .forEach(
    function(id) {

      var el =
        document.getElementById(id);

      if (!el) {

        return;

      }

      var maxX =
        Math.max(

          10,

          window.innerWidth -
          180

        );

      var maxY =
        Math.max(

          10,

          window.innerHeight -
          70

        );

      el.style.left =
        Math.floor(
          Math.random() * maxX
        )
        +
        'px';

      el.style.top =
        Math.floor(
          Math.random() * maxY
        )
        +
        'px';

    }
  );

}


function requestFullscreen() {

  resetControlsTimer();

  sendMessage({

    type:
      'fullscreen'

  });

}


document
  .getElementById(
    'tap-overlay'
  )
  .addEventListener(
    'click',
    function() {

      var controls =
        document.getElementById(
          'controls'
        );

      if (
        controls.classList.contains(
          'hidden'
        )
      ) {

        resetControlsTimer();

      } else {

        controls.classList.add(
          'hidden'
        );

        clearTimeout(
          hideControlsTimer
        );

      }

    }
  );


document
  .getElementById(
    'tap-overlay'
  )
  .addEventListener(
    'dblclick',
    function() {

      requestFullscreen();

    }
  );

</script>

</body>

</html>
`;
}


const decodeBase64 = (input) => {

  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  let str =
    String(input)
      .replace(
        /[=]+$/,
        ''
      );

  let output = '';

  for (
    let bc = 0,
    bs,
    buffer,
    idx = 0;

    (
      buffer =
      str.charAt(idx++)
    );

    ~buffer &&
      (
        bs =
        bc % 4
          ? bs * 64 + buffer
          : buffer,

        bc++ % 4
      )
      ? output +=
      String.fromCharCode(
        255 &
        bs >>
        (
          -2 * bc & 6
        )
      )
      : 0
  ) {

    buffer =
      chars.indexOf(buffer);

  }

  return output;

};


export default function StudyYoutubeVideoPlayerScreen({
  route,
  navigation,
}) {

  const {
    courseId,
    lectureId,
    lectureTitle,
    status,
  } = route.params || {};


  const [youtubeId, setYoutubeId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [
    isLandscape,
    setIsLandscape,
  ] = useState(false);

  const [
    userEmail,
    setUserEmail,
  ] = useState('');

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);

  const [
    duration,
    setDuration,
  ] = useState(0);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatUser, setChatUser] = useState(null);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  const webViewRef = useRef(null);


  const playbackRef = useRef({

    currentTime: 0,

    playing: true,

  });


  const shouldRestoreRef =
    useRef(false);


  const tabNavigatorRef =
    useRef(null);


  // =========================================================
  // FIND TAB NAVIGATOR
  // =========================================================

  useEffect(() => {

    let parent =
      navigation.getParent?.();

    while (parent) {

      const state =
        parent.getState?.();

      if (state?.type === 'tab') {

        tabNavigatorRef.current =
          parent;

        break;

      }

      parent =
        parent.getParent?.();

    }

  }, [navigation]);


  // =========================================================
  // USER EMAIL
  // =========================================================

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/auth/m/me');
        const user = res.data;
        setUserEmail(user?.email || user?.username || '');
        setChatUser({
          id: user?._id || user?.id,
          username: user?.name || user?.username || user?.email,
          role: user?.role
        });
      } catch (err) {
        console.log('Failed to fetch user for chat:', err);
      }
    };
    fetchUser();
  }, []);

  // =========================================================
  // CHAT SOCKET
  // =========================================================

  useEffect(() => {
    if (!lectureId || !chatUser) return;

    const baseUrl = apiClient.defaults.baseURL.replace(/\/api\/?$/, '');
    console.log('[Chat] Connecting to:', baseUrl, 'for class:', lectureId);

    const socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Chat] Connected, socket id:', socket.id);
      socket.emit('joinRoom', {
        classId: lectureId,
        user: chatUser,
      });
    });

    socket.on('connect_error', (err) => {
      console.log('[Chat] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Chat] Disconnected:', reason);
    });

    socket.on('loadHistory', (history) => {
      console.log('[Chat] Loaded history:', (history || []).length, 'messages');
      setMessages(history || []);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 500);
    });

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      console.log('[Chat] Cleaning up socket');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [lectureId, chatUser]);

  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current || !chatUser) return;

    socketRef.current.emit('chatMessage', {
      classId: lectureId,
      message: chatInput.trim()
    });
    setChatInput('');
  };


  // =========================================================
  // FETCH TOKEN
  // =========================================================

  useEffect(() => {

    if (
      !courseId ||
      !lectureId
    ) {

      setError(
        'Missing course or lecture ID.'
      );

      setLoading(false);

      return;

    }


    const fetchToken = async () => {

      try {

        setLoading(true);

        setError(null);


        const response =
          await apiClient.get(

            `/courses/published/${courseId}/lectures/${lectureId}/playback`

          );


        const token =
          response?.data?.token;


        if (!token) {

          throw new Error(
            'No playback token received'
          );

        }


        const decoded =
          decodeBase64(token);


        if (!decoded) {

          throw new Error(
            'Invalid playback token'
          );

        }


        setYoutubeId(decoded);


      } catch (err) {

        console.error(

          'Playback Token Fetch Error:',

          err?.response?.status,

          err?.response?.data,

          err?.message

        );


        setError(

          err?.response?.data?.message ||

          'Unable to load video'

        );


      } finally {

        setLoading(false);

      }

    };


    fetchToken();


  }, [
    courseId,
    lectureId,
  ]);


  // =========================================================
  // ORIENTATION
  // =========================================================

  useEffect(() => {

    ScreenOrientation.unlockAsync();


    const subscription =
      ScreenOrientation
        .addOrientationChangeListener(
          (event) => {

            const orientation =
              event
                .orientationInfo
                .orientation;


            const landscape =

              orientation ===
              ScreenOrientation
                .Orientation
                .LANDSCAPE_LEFT

              ||

              orientation ===
              ScreenOrientation
                .Orientation
                .LANDSCAPE_RIGHT;


            setIsLandscape(
              landscape
            );

          }
        );


    return () => {

      ScreenOrientation
        .removeOrientationChangeListener(
          subscription
        );


      ScreenOrientation
        .lockAsync(

          ScreenOrientation
            .OrientationLock
            .PORTRAIT_UP

        );

    };


  }, []);


  // =========================================================
  // HIDE BOTTOM TAB BAR
  // =========================================================

  useEffect(() => {

    const tabNavigator =
      tabNavigatorRef.current;


    if (!tabNavigator) {

      return;

    }


    if (isLandscape) {

      tabNavigator.setOptions({

        tabBarStyle: {

          display: 'none',

        },

      });

    } else {

      tabNavigator.setOptions({

        tabBarStyle: undefined,

      });

    }


    return () => {

      tabNavigator.setOptions({

        tabBarStyle: undefined,

      });

    };


  }, [isLandscape]);


  // =========================================================
  // ANDROID BACK
  // =========================================================

  useEffect(() => {

    const handler =
      BackHandler.addEventListener(

        'hardwareBackPress',

        () => {

          if (isLandscape) {

            shouldRestoreRef.current =
              true;


            ScreenOrientation
              .lockAsync(

                ScreenOrientation
                  .OrientationLock
                  .PORTRAIT_UP

              );


            return true;

          }


          return false;

        }

      );


    return () =>
      handler.remove();


  }, [isLandscape]);


  // =========================================================
  // FULLSCREEN
  // =========================================================

  const toggleFullscreen = async () => {

    shouldRestoreRef.current =
      true;


    try {

      if (isLandscape) {

        await ScreenOrientation
          .lockAsync(

            ScreenOrientation
              .OrientationLock
              .PORTRAIT_UP

          );

      } else {

        await ScreenOrientation
          .lockAsync(

            ScreenOrientation
              .OrientationLock
              .LANDSCAPE

          );

      }

    } catch (err) {

      console.log(
        'Orientation error:',
        err
      );

    }

  };


  // =========================================================
  // RESTORE PLAYER
  // =========================================================

  const restorePlayback = () => {

    if (
      !shouldRestoreRef.current ||
      !webViewRef.current
    ) {

      return;

    }


    const savedTime =
      playbackRef.current
        .currentTime;


    const wasPlaying =
      playbackRef.current
        .playing;


    const script = `

      restorePlayback(

        ${Number(savedTime || 0)},

        ${wasPlaying ? 'true' : 'false'}

      );

      true;

    `;


    setTimeout(() => {

      webViewRef.current
        ?.injectJavaScript(
          script
        );


      shouldRestoreRef.current =
        false;

    }, 500);

  };


  // =========================================================
  // WEBVIEW MESSAGE
  // =========================================================

  const handleWebViewMessage = (
    event
  ) => {

    try {

      const message =
        JSON.parse(
          event.nativeEvent.data
        );


      if (
        message.type ===
        'fullscreen'
      ) {

        toggleFullscreen();

        return;

      }


      if (
        message.type ===
        'playerReady'
      ) {

        restorePlayback();

        return;

      }


      if (
        message.type ===
        'stateChange'
      ) {

        const playing =
          Boolean(
            message.playing
          );


        playbackRef.current.playing =
          playing;


        setIsPlaying(
          playing
        );


        return;

      }


      if (
        message.type ===
        'timeUpdate'
      ) {

        const time =
          Number(
            message.currentTime || 0
          );


        const videoDuration =
          Number(
            message.duration || 0
          );


        playbackRef.current
          .currentTime = time;


        setCurrentTime(time);


        setDuration(
          videoDuration
        );


        return;

      }


    } catch (_) { }

  };


  // =========================================================
  // FORMAT DURATION
  // =========================================================

  const formatDuration = (
    seconds
  ) => {

    if (
      !seconds ||
      !Number.isFinite(seconds)
    ) {

      return '--';

    }


    const totalMinutes =
      Math.floor(
        seconds / 60
      );


    if (
      totalMinutes < 60
    ) {

      return `${totalMinutes} min`;

    }


    const hours =
      Math.floor(
        totalMinutes / 60
      );


    const minutes =
      totalMinutes % 60;


    return minutes > 0

      ? `${hours}h ${minutes}m`

      : `${hours}h`;

  };


  const progress =
    duration > 0

      ? Math.min(

        100,

        (
          currentTime /
          duration
        ) * 100

      )

      : 0;


  const windowDimensions =
    Dimensions.get('window');


  const videoHeight =
    isLandscape

      ? windowDimensions.height

      : Math.round(

        windowDimensions.width *
        9 /
        16

      );


  // =========================================================
  // LANDSCAPE
  // =========================================================

  if (isLandscape) {

    return (

      <View
        style={
          styles.landscapeRoot
        }
      >

        <StatusBar hidden />


        {loading && (

          <View
            style={
              styles.fullscreenState
            }
          >

            <ActivityIndicator

              size="large"

              color="#A78BFA"

            />


            <Text
              style={
                styles.fullscreenStateText
              }
            >

              Preparing lecture...

            </Text>

          </View>

        )}


        {error && !loading && (

          <View
            style={
              styles.fullscreenState
            }
          >

            <MaterialCommunityIcons

              name="alert-circle-outline"

              size={50}

              color="#F87171"

            />


            <Text
              style={
                styles.fullscreenErrorText
              }
            >

              {error}

            </Text>


            <TouchableOpacity

              style={
                styles.fullscreenBackButton
              }

              activeOpacity={0.85}

              onPress={() => {

                shouldRestoreRef.current =
                  true;


                ScreenOrientation
                  .lockAsync(

                    ScreenOrientation
                      .OrientationLock
                      .PORTRAIT_UP

                  );

              }}

            >

              <Text
                style={
                  styles.fullscreenBackButtonText
                }
              >

                Exit Fullscreen

              </Text>

            </TouchableOpacity>

          </View>

        )}


        {youtubeId &&
          !loading &&
          !error && (

            <WebView

              ref={webViewRef}

              source={{

                html: buildPlayerHtml(

                  youtubeId,

                  status,

                  userEmail

                ),

                baseUrl:
                  'https://dashboard.garudclasses.com',

              }}

              style={
                styles.webviewLandscape
              }

              allowsInlineMediaPlayback

              mediaPlaybackRequiresUserAction={
                false
              }

              javaScriptEnabled

              domStorageEnabled

              allowsFullscreenVideo={
                false
              }

              onMessage={
                handleWebViewMessage
              }

              onShouldStartLoadWithRequest={(
                request
              ) => {

                const url =
                  request?.url || '';


                return (

                  url === 'about:blank'

                  ||

                  url ===
                  'https://dashboard.garudclasses.com/'

                  ||

                  url.startsWith(
                    'https://dashboard.garudclasses.com'
                  )

                  ||

                  url.startsWith(
                    'https://www.youtube.com'
                  )

                  ||

                  url.startsWith(
                    'https://www.youtube-nocookie.com'
                  )

                );

              }}

            />

          )}

      </View>

    );

  }


  // =========================================================
  // PORTRAIT
  // =========================================================

  return (

    <>

      <StatusBar

        barStyle="light-content"

        backgroundColor={
          COLORS.primaryDark
        }

      />


      <SafeAreaView

        style={styles.safeArea}

        edges={['top']}

      >


        <View
          style={{ flex: 1, backgroundColor: COLORS.background }}
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

                onPress={() =>
                  navigation.goBack()
                }

              >


                <MaterialCommunityIcons

                  name="arrow-left"

                  size={23}

                  color="#FFFFFF"

                />


              </TouchableOpacity>


              <View
                style={styles.headerContent}
              >


                <Text
                  style={styles.headerLabel}
                >

                  NOW WATCHING

                </Text>


                <Text

                  style={styles.headerTitle}

                  numberOfLines={1}

                >

                  {lectureTitle ||
                    'Video Player'}

                </Text>


              </View>


              <TouchableOpacity

                style={styles.headerButton}

                activeOpacity={0.8}

                onPress={toggleFullscreen}

              >


                <MaterialCommunityIcons

                  name="fullscreen"

                  size={24}

                  color="#FFFFFF"

                />


              </TouchableOpacity>


            </View>





          </LinearGradient>


          <View
            style={styles.playerSection}
          >


            <View
              style={[styles.playerCard, { height: videoHeight }]}
            >


              {loading && (


                <View

                  style={[

                    styles.playerState,

                    {
                      height: videoHeight,
                    },

                  ]}

                >


                  <View
                    style={
                      styles.loadingIconWrap
                    }
                  >


                    <ActivityIndicator

                      size="large"

                      color={
                        COLORS.primary
                      }

                    />


                  </View>


                  <Text
                    style={
                      styles.loadingTitle
                    }
                  >

                    Preparing Lecture

                  </Text>


                  <Text
                    style={
                      styles.loadingDescription
                    }
                  >

                    Securely loading your video...

                  </Text>


                </View>


              )}


              {error && !loading && (


                <View

                  style={[

                    styles.playerState,

                    {
                      height: videoHeight,
                    },

                  ]}

                >


                  <View
                    style={styles.errorIconWrap}
                  >


                    <MaterialCommunityIcons

                      name="alert-circle-outline"

                      size={44}

                      color={COLORS.red}

                    />


                  </View>


                  <Text
                    style={styles.errorTitle}
                  >

                    Video Unavailable

                  </Text>


                  <Text
                    style={
                      styles.errorDescription
                    }
                  >

                    {error}

                  </Text>


                  <TouchableOpacity

                    style={
                      styles.goBackButton
                    }

                    activeOpacity={0.85}

                    onPress={() =>
                      navigation.goBack()
                    }

                  >


                    <MaterialCommunityIcons

                      name="arrow-left"

                      size={17}

                      color="#FFFFFF"

                    />


                    <Text
                      style={
                        styles.goBackButtonText
                      }
                    >

                      Go Back

                    </Text>


                  </TouchableOpacity>


                </View>


              )}


              {youtubeId &&
                !loading &&
                !error && (


                  <WebView

                    ref={webViewRef}

                    source={{

                      html: buildPlayerHtml(

                        youtubeId,

                        status,

                        userEmail

                      ),

                      baseUrl:
                        'https://dashboard.garudclasses.com',

                    }}

                    style={{

                      height: videoHeight,

                      width: '100%',

                      backgroundColor:
                        '#000000',

                    }}

                    allowsInlineMediaPlayback

                    mediaPlaybackRequiresUserAction={
                      false
                    }

                    javaScriptEnabled

                    domStorageEnabled

                    allowsFullscreenVideo={
                      false
                    }

                    onMessage={
                      handleWebViewMessage
                    }

                    onShouldStartLoadWithRequest={(
                      request
                    ) => {

                      const url =
                        request?.url || '';


                      return (

                        url === 'about:blank'

                        ||

                        url ===
                        'https://dashboard.garudclasses.com/'

                        ||

                        url.startsWith(
                          'https://dashboard.garudclasses.com'
                        )

                        ||

                        url.startsWith(
                          'https://www.youtube.com'
                        )

                        ||

                        url.startsWith(
                          'https://www.youtube-nocookie.com'
                        )

                      );

                    }}

                  />


                )}


            </View>


            {youtubeId &&
              !loading &&
              !error && (


                <View
                  style={
                    styles.playerInfoCard
                  }
                >


                  <View
                    style={
                      styles.playerInfoTop
                    }
                  >


                    <View
                      style={
                        styles.playerStatusIcon
                      }
                    >


                      <MaterialCommunityIcons
                        name={
                          isPlaying
                            ? 'play'
                            : 'pause'
                        }
                        size={19}
                        color={COLORS.primary}
                      />
                    </View>


                    <View
                      style={
                        styles.playerInfoContent
                      }
                    >


                      <Text
                        style={
                          styles.playerStatusLabel
                        }
                      >

                        {isPlaying

                          ? 'NOW PLAYING'

                          : 'VIDEO PAUSED'}

                      </Text>


                      <Text

                        style={
                          styles.playerLectureTitle
                        }

                        numberOfLines={2}

                      >

                        {lectureTitle ||
                          'Lecture Video'}

                      </Text>


                    </View>


                    <TouchableOpacity

                      style={
                        styles.fullscreenButton
                      }

                      activeOpacity={0.82}

                      onPress={
                        toggleFullscreen
                      }

                    >


                      <MaterialCommunityIcons

                        name="fullscreen"

                        size={21}

                        color={COLORS.primary}

                      />


                    </TouchableOpacity>


                  </View>


                  {status !== 'live' && (


                    <View
                      style={
                        styles.externalProgressSection
                      }
                    >


                      <View
                        style={
                          styles.externalProgressTrack
                        }
                      >


                        <View

                          style={[

                            styles.externalProgressFill,

                            {
                              width:
                                `${progress}%`,
                            },

                          ]}

                        />


                      </View>


                      <View
                        style={
                          styles.progressInfoRow
                        }
                      >


                        <Text
                          style={
                            styles.progressText
                          }
                        >

                          {Math.round(progress)}%
                          watched

                        </Text>


                        <Text
                          style={
                            styles.progressText
                          }
                        >

                          {formatDuration(
                            duration
                          )}

                        </Text>


                      </View>


                    </View>


                  )}


                </View>


              )}


          </View>


          <View style={[styles.content, { flex: 1 }]}>

            {!isLandscape && (
              <View style={styles.chatContainer}>
                <View style={styles.chatHeader}>
                  <MaterialCommunityIcons name="forum-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.chatTitle}>
                    {status === 'live' ? 'Live Chat' : 'Chat History'}
                  </Text>
                </View>

                <ScrollView
                  ref={flatListRef}
                  style={styles.chatList}
                  contentContainerStyle={styles.chatListContent}
                  nestedScrollEnabled={true}
                  onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                  onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                >
                  {messages.map((item, index) => {
                    const isMe = item.userId === chatUser?.id;
                    const isTeacher = item.role === 'teacher' || item.role === 'admin';

                    return (
                      <View key={item._id || item.id || String(index)} style={[styles.chatMessageWrap, isMe ? styles.chatMessageMe : styles.chatMessageOther]}>
                        {!isMe && (
                          <View style={[styles.chatAvatar, isTeacher && styles.chatAvatarTeacher]}>
                            <Text style={styles.chatAvatarText}>
                              {item.username ? item.username.charAt(0).toUpperCase() : '?'}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther, isTeacher && !isMe && styles.chatBubbleTeacher]}>
                          {!isMe && (
                            <Text style={[styles.chatSenderName, isTeacher && styles.chatSenderTeacher]}>
                              {item.username} {isTeacher && '✓'}
                            </Text>
                          )}
                          <Text style={[styles.chatMessageText, isMe && styles.chatMessageTextMe]}>
                            {item.message}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.chatInputWrap}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Type a message..."
                    placeholderTextColor={COLORS.textMuted}
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    style={[styles.chatSendBtn, !chatInput.trim() && styles.chatSendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!chatInput.trim()}
                  >
                    <MaterialCommunityIcons name="send" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>


        </View>


      </SafeAreaView>


    </>

  );

}


const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor:
      COLORS.primaryDark,

  },


  landscapeRoot: {

    flex: 1,

    backgroundColor: '#000000',

    zIndex: 9999,

    elevation: 9999,

  },


  webviewLandscape: {

    flex: 1,

    width: '100%',

    height: '100%',

    backgroundColor: '#000000',

  },


  fullscreenState: {

    flex: 1,

    backgroundColor: '#000000',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,

  },


  fullscreenStateText: {

    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '700',

    marginTop: 13,

  },


  fullscreenErrorText: {

    color: '#FCA5A5',

    fontSize: 13,

    lineHeight: 20,

    fontWeight: '600',

    textAlign: 'center',

    marginTop: 13,

  },


  fullscreenBackButton: {

    marginTop: 18,

    backgroundColor:
      COLORS.primary,

    borderRadius: 12,

    paddingHorizontal: 20,

    paddingVertical: 11,

  },


  fullscreenBackButtonText: {

    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '900',

  },


  scrollView: {

    flex: 1,

    backgroundColor:
      COLORS.background,

  },


  scrollContent: {

    flexGrow: 1,

    backgroundColor:
      COLORS.background,

    paddingBottom: 115,

  },


  hero: {

    paddingBottom: 24,

    flexShrink: 0,

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


  heroInfoRow: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 18,

    paddingTop: 13,

  },


  heroPlayIcon: {

    width: 64,

    height: 64,

    borderRadius: 21,

    backgroundColor:
      'rgba(255,255,255,0.15)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.20)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 14,

  },


  heroTextContent: {

    flex: 1,

  },


  heroBadgeRow: {

    flexDirection: 'row',

    marginBottom: 6,

  },


  liveBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    backgroundColor: COLORS.red,

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 6,

  },


  liveBadgeDot: {

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: '#FFFFFF',

  },


  liveBadgeText: {

    color: '#FFFFFF',

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.5,

  },


  lectureBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    backgroundColor:
      'rgba(255,255,255,0.16)',

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 6,

  },


  lectureBadgeText: {

    color: '#FFFFFF',

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.5,

  },


  heroTitle: {

    color: '#FFFFFF',

    fontSize: 20,

    lineHeight: 26,

    fontWeight: '900',

  },


  heroSubtitle: {

    color: '#DDD6FE',

    fontSize: 9,

    fontWeight: '600',

    marginTop: 5,

  },


  playerSection: {

    marginTop: -1,

    flexShrink: 0,

  },


  playerCard: {

    width: '100%',

    backgroundColor: '#000000',

    overflow: 'hidden',

  },


  playerState: {

    width: '100%',

    backgroundColor: '#09090B',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 25,

  },


  loadingIconWrap: {

    width: 66,

    height: 66,

    borderRadius: 22,

    backgroundColor:
      'rgba(109,40,217,0.17)',

    alignItems: 'center',

    justifyContent: 'center',

  },


  loadingTitle: {

    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '900',

    marginTop: 15,

  },


  loadingDescription: {

    color: '#94A3B8',

    fontSize: 10,

    fontWeight: '600',

    marginTop: 5,

  },


  errorIconWrap: {

    width: 72,

    height: 72,

    borderRadius: 24,

    backgroundColor:
      'rgba(220,38,38,0.16)',

    alignItems: 'center',

    justifyContent: 'center',

  },


  errorTitle: {

    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '900',

    marginTop: 14,

  },


  errorDescription: {

    color: '#FCA5A5',

    fontSize: 10,

    lineHeight: 17,

    fontWeight: '600',

    textAlign: 'center',

    marginTop: 6,

  },


  goBackButton: {

    minHeight: 42,

    borderRadius: 12,

    backgroundColor:
      COLORS.primary,

    paddingHorizontal: 17,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

    marginTop: 15,

  },


  goBackButtonText: {

    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '900',

  },


  playerInfoCard: {

    backgroundColor: COLORS.white,

    paddingHorizontal: 15,

    paddingTop: 14,

    paddingBottom: 13,

    borderBottomWidth: 1,

    borderBottomColor: COLORS.border,

  },


  playerInfoTop: {

    flexDirection: 'row',

    alignItems: 'center',

  },


  playerStatusIcon: {

    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  playerInfoContent: {

    flex: 1,

  },


  playerStatusLabel: {

    color: COLORS.primary,

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.7,

  },


  playerLectureTitle: {

    color: COLORS.text,

    fontSize: 13,

    lineHeight: 18,

    fontWeight: '900',

    marginTop: 3,

  },


  fullscreenButton: {

    width: 41,

    height: 41,

    borderRadius: 13,

    backgroundColor:
      COLORS.primarySoft,

    borderWidth: 1,

    borderColor: '#DDD6FE',

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 10,

  },


  externalProgressSection: {

    marginTop: 13,

  },


  externalProgressTrack: {

    height: 5,

    borderRadius: 100,

    backgroundColor: '#EDE9FE',

    overflow: 'hidden',

  },


  externalProgressFill: {

    height: '100%',

    borderRadius: 100,

    backgroundColor:
      COLORS.primary,

  },


  progressInfoRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: 6,

  },


  progressText: {

    color: COLORS.textMuted,

    fontSize: 8,

    fontWeight: '700',

  },


  content: {

    paddingHorizontal: 15,

    paddingTop: 21,

  },


  sectionHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 14,

  },


  sectionTitle: {

    color: COLORS.text,

    fontSize: 19,

    fontWeight: '900',

  },


  sectionSubtitle: {

    color: COLORS.textSecondary,

    fontSize: 9,

    fontWeight: '600',

    marginTop: 4,

  },


  detailsCard: {

    backgroundColor: COLORS.white,

    borderRadius: 19,

    borderWidth: 1,

    borderColor: COLORS.border,

    paddingHorizontal: 14,

    shadowColor: '#4C1D95',

    shadowOffset: {

      width: 0,

      height: 5,

    },

    shadowOpacity: 0.05,

    shadowRadius: 10,

    elevation: 3,

  },


  detailRow: {

    minHeight: 75,

    flexDirection: 'row',

    alignItems: 'center',

  },


  detailIcon: {

    width: 44,

    height: 44,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,

  },


  detailContent: {

    flex: 1,

  },


  detailLabel: {

    color: COLORS.textMuted,

    fontSize: 8,

    fontWeight: '800',

    textTransform: 'uppercase',

    letterSpacing: 0.5,

  },


  detailValue: {

    color: COLORS.text,

    fontSize: 12,

    lineHeight: 17,

    fontWeight: '800',

    marginTop: 4,

  },


  detailDivider: {

    height: 1,

    backgroundColor: '#F1F5F9',

    marginLeft: 56,

  },


  securityNotice: {

    backgroundColor:
      COLORS.primarySoft,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: '#DDD6FE',

    padding: 14,

    flexDirection: 'row',

    marginTop: 13,

  },


  securityNoticeIcon: {

    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  securityNoticeContent: {

    flex: 1,

  },


  securityNoticeTitle: {

    color: COLORS.primaryDark,

    fontSize: 11,

    fontWeight: '900',

  },


  securityNoticeText: {

    color: COLORS.textSecondary,

    fontSize: 9,

    lineHeight: 15,

    fontWeight: '600',

    marginTop: 4,

  },

  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 12,
    gap: 12,
  },
  chatMessageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    maxWidth: '85%',
  },
  chatMessageMe: {
    alignSelf: 'flex-end',
  },
  chatMessageOther: {
    alignSelf: 'flex-start',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chatAvatarTeacher: {
    backgroundColor: COLORS.orangeLight,
  },
  chatAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  chatBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  chatBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  chatBubbleTeacher: {
    backgroundColor: COLORS.orangeLight,
  },
  chatSenderName: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  chatSenderTeacher: {
    color: COLORS.orange,
  },
  chatMessageText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  chatMessageTextMe: {
    color: COLORS.white,
  },
  chatInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: COLORS.text,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
});