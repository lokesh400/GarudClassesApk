import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ActivityIndicator, NativeModules, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { downloadAttachment, getAttachmentUrls } from '../../utils/downloads';

let Pdf = null;
try {
  const PdfModule = require('react-native-pdf').default;
  const hasNativeViewManager =
    !!UIManager?.getViewManagerConfig?.('RNPDFPdfView') ||
    !!UIManager?.getViewManagerConfig?.('PdfView') ||
    !!NativeModules?.RNPDFPdfViewManager;
  Pdf = hasNativeViewManager ? PdfModule : null;
} catch {
  Pdf = null;
}

export default function AttachmentViewerScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [pdfFallbackMode, setPdfFallbackMode] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const { attachment, localFile, title, lessonTitle, courseTitle } = route.params || {};
  const hideTimerRef = useRef(null);

  const resolved = useMemo(() => {
    if (localFile?.uri) {
      const localSourceLink = String(localFile.sourceLink || '').trim();
      const localUrls = localSourceLink ? getAttachmentUrls(localSourceLink) : null;
      return {
        displayTitle: String(localFile.title || title || 'Attachment'),
        // Android WebView often cannot render local PDF file:// URIs reliably.
        // Prefer original source preview URL when available.
        webUri: String(localUrls?.previewUrl || localFile.uri),
        pdfUri: String(localFile.uri),
        usePdfRenderer: true,
        canDownload: false,
        sourceLink: localSourceLink,
        isGoogleDrive: !!localUrls?.isGoogleDrive,
      };
    }

    const link = String(attachment?.link || '');
    const urls = getAttachmentUrls(link);
    return {
      displayTitle: String(attachment?.title || title || 'Attachment'),
      webUri: urls.previewUrl,
      pdfUri: '',
      usePdfRenderer: false,
      canDownload: true,
      sourceLink: link,
      isGoogleDrive: !!urls.isGoogleDrive,
    };
  }, [attachment, localFile, title]);

  const initialUriRef = useRef(String(resolved.webUri || ''));

  useEffect(() => {
    initialUriRef.current = String(resolved.webUri || '');
  }, [resolved.webUri]);

  useEffect(() => {
    setPdfFallbackMode(false);
  }, [resolved.pdfUri, resolved.webUri]);

  const resetAutoHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2500);
  };

  const revealControls = () => {
    setControlsVisible(true);
    resetAutoHideTimer();
  };

  useEffect(() => {
    setControlsVisible(true);
    resetAutoHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resolved.webUri, resolved.pdfUri]);

  const isFullScreenPdf = !!(resolved.usePdfRenderer && !pdfFallbackMode && Pdf);

  const handleShouldStart = (request) => {
    const url = String(request?.url || '').trim();
    if (!url) return false;

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
      const isTopFrame = request?.isTopFrame !== false;
      if (!isTopFrame) return true;

      const isInitial = url === initialUriRef.current;
      const isEmbeddedViewer = url.includes('drive.google.com/viewerng/viewer');

      // Block navigation from "open in drive" arrows/buttons and keep user in-app.
      if (!isInitial && !isEmbeddedViewer) return false;
    }

    return true;
  };

  const onDownload = async () => {
    if (!resolved.sourceLink) {
      Alert.alert('Unavailable', 'Attachment link is missing.');
      return;
    }

    setLoading(true);
    try {
      const file = await downloadAttachment({
        title: resolved.displayTitle,
        link: resolved.sourceLink,
        lessonTitle,
        courseTitle,
      });

      Alert.alert('Downloaded', 'Attachment saved in Downloads section.', [
        {
          text: 'Open Downloads',
          onPress: () => navigation.navigate('Downloads'),
        },
        { text: 'OK' },
      ]);

      // Keep current viewer open after download.
      if (file?.uri) {
        // no-op
      }
    } catch (err) {
      Alert.alert('Download failed', err?.message || 'Could not download attachment.');
    } finally {
      setLoading(false);
    }
  };

  if (!resolved.webUri) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.floatingBar, { top: insets.top + 8 }]}> 
          <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.floatingTitle}>Attachment</Text>
          <View style={styles.floatingBtnPlaceholder} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Attachment URL is missing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {controlsVisible && (
        <View style={[styles.floatingBar, { top: insets.top + 8 }]}> 
          <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.floatingTitle}>{resolved.displayTitle}</Text>

          {resolved.canDownload ? (
            <TouchableOpacity style={styles.floatingBtn} onPress={onDownload} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#1D4ED8" />
              ) : (
                <MaterialCommunityIcons name="download" size={20} color="#1D4ED8" />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.floatingBtnPlaceholder} />
          )}
        </View>
      )}

      {isFullScreenPdf ? (
        <Pdf
          source={{ uri: resolved.pdfUri, cache: true }}
          style={styles.pdfView}
          trustAllCerts
          enablePaging={false}
          fitPolicy={0}
          onLoadComplete={resetAutoHideTimer}
          onPageChanged={resetAutoHideTimer}
          onError={() => {
            setPdfFallbackMode(true);
            Alert.alert('Preview issue', 'Switching to web preview for this file.');
          }}
        />
      ) : (
        <WebView
          source={{ uri: resolved.webUri }}
          style={styles.webView}
          startInLoadingState
          allowFileAccess
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          builtInZoomControls
          displayZoomControls={false}
          scalesPageToFit
          onLoadEnd={resetAutoHideTimer}
          onShouldStartLoadWithRequest={handleShouldStart}
          renderLoading={() => (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#1D4ED8" />
            </View>
          )}
        />
      )}

      {!controlsVisible && (
        <TouchableOpacity
          style={styles.tapToShowOverlay}
          activeOpacity={1}
          onPress={revealControls}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  webView: { flex: 1, backgroundColor: '#FFFFFF' },
  pdfView: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  floatingTitle: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 7,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  tapToShowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 8,
  },
});
