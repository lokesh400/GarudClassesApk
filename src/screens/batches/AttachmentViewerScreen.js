import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  ActivityIndicator,
  NativeModules,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { WebView } from 'react-native-webview';

import {
  downloadAttachment,
  getAttachmentUrls,
} from '../../utils/downloads';


const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#4C1D95',
  primaryMedium: '#7C3AED',
  primaryLight: '#EDE9FE',
  primarySoft: '#F5F3FF',

  white: '#FFFFFF',

  text: '#171717',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  border: '#E8E5EF',

  background: '#F8F7FC',

  danger: '#DC2626',
};


// ============================================================
// PDF NATIVE MODULE CHECK
// ============================================================

let Pdf = null;

try {
  const PdfModule =
    require('react-native-pdf').default;

  const hasNativeViewManager =
    !!UIManager?.getViewManagerConfig?.(
      'RNPDFPdfView'
    ) ||
    !!UIManager?.getViewManagerConfig?.(
      'PdfView'
    ) ||
    !!NativeModules?.RNPDFPdfViewManager;

  Pdf = hasNativeViewManager
    ? PdfModule
    : null;

} catch {
  Pdf = null;
}


// ============================================================
// SCREEN
// ============================================================

export default function AttachmentViewerScreen({
  route,
  navigation,
}) {
  const insets = useSafeAreaInsets();

  const {
    attachment,
    localFile,
    title,
    lessonTitle,
    courseTitle,
  } = route.params || {};


  const [loading, setLoading] =
    useState(false);

  const [
    pdfFallbackMode,
    setPdfFallbackMode,
  ] = useState(false);

  const [
    controlsVisible,
    setControlsVisible,
  ] = useState(true);


  const hideTimerRef = useRef(null);


  // ==========================================================
  // RESOLVE ATTACHMENT
  // ==========================================================

  const resolved = useMemo(() => {
    if (localFile?.uri) {
      const localSourceLink =
        String(
          localFile.sourceLink || ''
        ).trim();

      const localUrls =
        localSourceLink
          ? getAttachmentUrls(
            localSourceLink
          )
          : null;


      return {
        displayTitle:
          String(
            localFile.title ||
            title ||
            'Attachment'
          ),

        webUri:
          String(
            localUrls?.previewUrl ||
            localFile.uri
          ),

        pdfUri:
          String(
            localFile.uri
          ),

        usePdfRenderer:
          localFile?.fileType === 'pdf' ||
          localFile?.extension === 'pdf' ||
          String(localFile.uri)
            .toLowerCase()
            .endsWith('.pdf'),

        canDownload: false,

        sourceLink:
          localSourceLink,

        isGoogleDrive:
          !!localUrls?.isGoogleDrive,

        fileType:
          localFile?.fileType || 'file',
      };
    }


    const link =
      String(
        attachment?.link || ''
      ).trim();


    const urls =
      getAttachmentUrls(link);


    return {
      displayTitle:
        String(
          attachment?.title ||
          title ||
          'Attachment'
        ),

      webUri:
        urls.previewUrl,

      pdfUri: '',

      usePdfRenderer: false,

      canDownload: true,

      sourceLink: link,

      isGoogleDrive:
        !!urls.isGoogleDrive,

      fileType: 'remote',
    };

  }, [
    attachment,
    localFile,
    title,
  ]);


  // ==========================================================
  // INITIAL URI
  // ==========================================================

  const initialUriRef =
    useRef(
      String(
        resolved.webUri || ''
      )
    );


  useEffect(() => {
    initialUriRef.current =
      String(
        resolved.webUri || ''
      );
  }, [resolved.webUri]);


  // ==========================================================
  // RESET PDF FALLBACK
  // ==========================================================

  useEffect(() => {
    setPdfFallbackMode(false);
  }, [
    resolved.pdfUri,
    resolved.webUri,
  ]);


  // ==========================================================
  // AUTO HIDE CONTROLS
  // ==========================================================

  const clearAutoHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(
        hideTimerRef.current
      );

      hideTimerRef.current = null;
    }
  };


  const resetAutoHideTimer = () => {
    clearAutoHideTimer();

    hideTimerRef.current =
      setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
  };


  const revealControls = () => {
    setControlsVisible(true);

    resetAutoHideTimer();
  };


  const hideControls = () => {
    clearAutoHideTimer();

    setControlsVisible(false);
  };


  useEffect(() => {
    setControlsVisible(true);

    resetAutoHideTimer();

    return () => {
      clearAutoHideTimer();
    };
  }, [
    resolved.webUri,
    resolved.pdfUri,
  ]);


  // ==========================================================
  // PDF MODE
  // ==========================================================

  const isFullScreenPdf =
    !!(
      resolved.usePdfRenderer &&
      !pdfFallbackMode &&
      Pdf
    );


  // ==========================================================
  // WEBVIEW NAVIGATION SECURITY
  // ==========================================================

  const handleShouldStart = (
    request
  ) => {
    const url =
      String(
        request?.url || ''
      ).trim();


    if (!url) {
      return false;
    }


    if (
      url.startsWith('about:blank') ||
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('file:') ||
      url.startsWith('content:')
    ) {
      return true;
    }


    if (resolved.isGoogleDrive) {
      const isTopFrame =
        request?.isTopFrame !== false;


      if (!isTopFrame) {
        return true;
      }


      const isInitial =
        url ===
        initialUriRef.current;


      const isEmbeddedViewer =
        url.includes(
          'drive.google.com/viewerng/viewer'
        );


      if (
        !isInitial &&
        !isEmbeddedViewer
      ) {
        return false;
      }
    }


    return true;
  };


  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const onDownload = async () => {
    if (!resolved.sourceLink) {
      Alert.alert(
        'Unavailable',
        'Attachment link is missing.'
      );

      return;
    }


    setLoading(true);


    try {
      await downloadAttachment({
        title:
          resolved.displayTitle,

        link:
          resolved.sourceLink,

        lessonTitle,

        courseTitle,
      });


      Alert.alert(
        'Download Complete',
        'Attachment has been saved to My Downloads.',
        [
          {
            text: 'Open Downloads',

            onPress: () =>
              navigation.navigate(
                'Downloads'
              ),
          },

          {
            text: 'Continue Reading',
            style: 'cancel',
          },
        ]
      );

    } catch (error) {
      Alert.alert(
        'Download Failed',

        error?.message ||
        'Could not download attachment.'
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // EMPTY ATTACHMENT
  // ==========================================================

  if (!resolved.webUri) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <SafeAreaView
          style={styles.safeArea}
          edges={['top', 'bottom']}
        >
          <View
            style={[
              styles.viewerHeader,
              {
                top: insets.top + 8,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() =>
                navigation.goBack()
              }
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={21}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            <View style={styles.titlePill}>
              <Text
                numberOfLines={1}
                style={styles.viewerTitle}
              >
                Attachment
              </Text>
            </View>

            <View
              style={
                styles.controlButtonPlaceholder
              }
            />
          </View>


          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="file-alert-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Attachment Unavailable
            </Text>

            <Text style={styles.emptyText}>
              The attachment URL is missing or
              could not be loaded.
            </Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                navigation.goBack()
              }
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.backButtonText
                }
              >
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }


  // ==========================================================
  // MAIN VIEWER
  // ==========================================================

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        {/* ===================================================
            FLOATING CONTROLS
        =================================================== */}

        {controlsVisible && (
          <View
            style={[
              styles.viewerHeader,
              {
                top: insets.top + 8,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() =>
                navigation.goBack()
              }
              activeOpacity={0.75}
              hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
              }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={21}
                color={COLORS.primary}
              />
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.titlePill}
              activeOpacity={0.85}
              onPress={hideControls}
            >
              <View
                style={
                  styles.titleIconWrap
                }
              >
                <MaterialCommunityIcons
                  name={
                    isFullScreenPdf
                      ? 'file-pdf-box'
                      : 'file-document-outline'
                  }
                  size={15}
                  color={COLORS.primary}
                />
              </View>

              <Text
                numberOfLines={1}
                style={styles.viewerTitle}
              >
                {resolved.displayTitle}
              </Text>

              <MaterialCommunityIcons
                name="chevron-up"
                size={16}
                color={
                  COLORS.textMuted
                }
              />
            </TouchableOpacity>


            {resolved.canDownload ? (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={onDownload}
                disabled={loading}
                activeOpacity={0.75}
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="download-outline"
                    size={21}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <View
                style={
                  styles.controlButtonPlaceholder
                }
              />
            )}
          </View>
        )}


        {/* ===================================================
            PDF VIEWER
        =================================================== */}

        {isFullScreenPdf ? (
          <Pdf
            source={{
              uri: resolved.pdfUri,
              cache: true,
            }}
            style={styles.pdfView}
            trustAllCerts
            enablePaging={false}
            fitPolicy={0}
            spacing={4}
            onLoadComplete={() => {
              resetAutoHideTimer();
            }}
            onPageChanged={() => {
              resetAutoHideTimer();
            }}
            onError={(error) => {
              console.error(
                'PDF viewer error:',
                error
              );

              setPdfFallbackMode(true);

              Alert.alert(
                'Preview Issue',
                'Native PDF preview is unavailable. Switching to web preview.'
              );
            }}
          />
        ) : (
          <WebView
            source={{
              uri: resolved.webUri,
            }}
            style={styles.webView}
            startInLoadingState
            allowFileAccess
            allowsInlineMediaPlayback
            setSupportMultipleWindows={false}
            builtInZoomControls
            displayZoomControls={false}
            scalesPageToFit
            onLoadEnd={() => {
              resetAutoHideTimer();
            }}
            onShouldStartLoadWithRequest={
              handleShouldStart
            }
            renderLoading={() => (
              <View
                style={
                  styles.loadingContainer
                }
              >
                <View
                  style={
                    styles.loadingIconWrap
                  }
                >
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={32}
                    color={COLORS.primary}
                  />
                </View>

                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{
                    marginTop: 18,
                  }}
                />

                <Text
                  style={
                    styles.loadingTitle
                  }
                >
                  Opening Attachment
                </Text>

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Preparing your study material...
                </Text>
              </View>
            )}
          />
        )}


        {/* ===================================================
            REVEAL CONTROLS BUTTON

            IMPORTANT:
            This replaces your full screen transparent overlay.
            PDF/WebView scrolling and zooming remain interactive.
        =================================================== */}

        {!controlsVisible && (
          <TouchableOpacity
            style={[
              styles.revealButton,
              {
                top: insets.top + 10,
              },
            ]}
            onPress={revealControls}
            activeOpacity={0.75}
            hitSlop={{
              top: 12,
              bottom: 12,
              left: 12,
              right: 12,
            }}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },


  // =========================================================
  // VIEWERS
  // =========================================================

  webView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  pdfView: {
    flex: 1,
    backgroundColor: '#F1F0F5',
  },


  // =========================================================
  // FLOATING HEADER
  // =========================================================

  viewerHeader: {
    position: 'absolute',

    left: 12,
    right: 12,

    zIndex: 100,

    flexDirection: 'row',
    alignItems: 'center',

    elevation: 10,
  },

  controlButton: {
    width: 40,
    height: 40,

    borderRadius: 13,

    borderWidth: 1,
    borderColor: COLORS.primaryLight,

    backgroundColor:
      'rgba(255,255,255,0.97)',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 6,
  },

  controlButtonPlaceholder: {
    width: 40,
    height: 40,
  },


  // =========================================================
  // TITLE
  // =========================================================

  titlePill: {
    flex: 1,

    minWidth: 0,

    minHeight: 40,

    marginHorizontal: 8,

    paddingHorizontal: 10,

    borderRadius: 14,

    backgroundColor:
      'rgba(255,255,255,0.97)',

    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 5,
  },

  titleIconWrap: {
    width: 28,
    height: 28,

    borderRadius: 9,

    backgroundColor:
      COLORS.primarySoft,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 7,
  },

  viewerTitle: {
    flex: 1,

    color: COLORS.primaryDark,

    fontSize: 11,
    fontWeight: '800',

    textAlign: 'center',
  },


  // =========================================================
  // REVEAL BUTTON
  // =========================================================

  revealButton: {
    position: 'absolute',

    right: 14,

    zIndex: 100,

    width: 40,
    height: 40,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.96)',

    borderWidth: 1,
    borderColor: COLORS.primaryLight,

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.15,
    shadowRadius: 8,

    elevation: 7,
  },


  // =========================================================
  // LOADING
  // =========================================================

  loadingContainer: {
    ...StyleSheet.absoluteFillObject,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      COLORS.background,

    paddingHorizontal: 30,
  },

  loadingIconWrap: {
    width: 72,
    height: 72,

    borderRadius: 24,

    backgroundColor:
      COLORS.primarySoft,

    borderWidth: 1,
    borderColor:
      COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingTitle: {
    color: COLORS.text,

    fontSize: 17,
    fontWeight: '900',

    marginTop: 16,
  },

  loadingText: {
    color: COLORS.textSecondary,

    fontSize: 11,
    fontWeight: '600',

    marginTop: 5,

    textAlign: 'center',
  },


  // =========================================================
  // EMPTY
  // =========================================================

  emptyContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 30,

    backgroundColor:
      COLORS.background,
  },

  emptyIconWrap: {
    width: 82,
    height: 82,

    borderRadius: 27,

    backgroundColor:
      COLORS.primarySoft,

    borderWidth: 1,
    borderColor:
      COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: COLORS.text,

    fontSize: 20,
    fontWeight: '900',

    marginTop: 18,
  },

  emptyText: {
    color: COLORS.textSecondary,

    fontSize: 12,
    fontWeight: '600',

    lineHeight: 19,

    textAlign: 'center',

    marginTop: 7,
  },

  backButton: {
    minHeight: 46,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    backgroundColor:
      COLORS.primary,

    borderRadius: 14,

    paddingHorizontal: 22,

    marginTop: 20,

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.2,
    shadowRadius: 10,

    elevation: 5,
  },

  backButtonText: {
    color: '#FFFFFF',

    fontSize: 12,
    fontWeight: '900',
  },
});