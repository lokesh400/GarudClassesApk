import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { clearDownloadById, listDownloads } from '../../utils/downloads';

const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#4C1D95',
  primaryLight: '#EDE9FE',
  primarySoft: '#F5F3FF',

  background: '#F8F7FC',
  white: '#FFFFFF',

  text: '#171717',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  border: '#E8E5EF',

  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerLight: '#FEE2E2',
  dangerSoft: '#FEF2F2',

  success: '#16A34A',
  successLight: '#DCFCE7',
};

function formatDate(value) {
  if (!value) return 'Unknown date';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileType(item) {
  const title = String(item?.title || '').toLowerCase();
  const uri = String(
    item?.localUri ||
      item?.uri ||
      item?.fileUri ||
      item?.url ||
      ''
  ).toLowerCase();

  const value = `${title} ${uri}`;

  if (value.includes('.pdf')) {
    return {
      icon: 'file-pdf-box',
      label: 'PDF',
      color: '#DC2626',
      background: '#FEE2E2',
    };
  }

  if (
    value.includes('.jpg') ||
    value.includes('.jpeg') ||
    value.includes('.png') ||
    value.includes('.webp')
  ) {
    return {
      icon: 'file-image-outline',
      label: 'IMAGE',
      color: '#0284C7',
      background: '#E0F2FE',
    };
  }

  if (
    value.includes('.mp4') ||
    value.includes('.mov') ||
    value.includes('.mkv')
  ) {
    return {
      icon: 'file-video-outline',
      label: 'VIDEO',
      color: '#7C3AED',
      background: '#F3E8FF',
    };
  }

  if (
    value.includes('.doc') ||
    value.includes('.docx')
  ) {
    return {
      icon: 'file-word-outline',
      label: 'DOCUMENT',
      color: '#2563EB',
      background: '#DBEAFE',
    };
  }

  if (
    value.includes('.xls') ||
    value.includes('.xlsx')
  ) {
    return {
      icon: 'file-excel-outline',
      label: 'SHEET',
      color: '#16A34A',
      background: '#DCFCE7',
    };
  }

  return {
    icon: 'file-document-outline',
    label: 'FILE',
    color: COLORS.primary,
    background: COLORS.primaryLight,
  };
}

export default function DownloadsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);

      const data = await listDownloads();

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Download list error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleDelete = (item) => {
    Alert.alert(
      'Remove Download',
      `"${item?.title || 'This file'}" will be deleted from your device.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(item.id);

              const updated = await clearDownloadById(item.id);

              setItems(Array.isArray(updated) ? updated : []);
            } catch (error) {
              console.log('Delete download error:', error);

              Alert.alert(
                'Unable to Delete',
                'The downloaded file could not be removed. Please try again.'
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const openDownload = (item) => {
    navigation.navigate('AttachmentViewer', {
      localFile: item,
      title: item.title,
    });
  };

  const renderItem = ({ item }) => {
    const fileType = getFileType(item);
    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.downloadCard}>
        <TouchableOpacity
          style={styles.downloadMain}
          activeOpacity={0.82}
          disabled={isDeleting}
          onPress={() => openDownload(item)}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: fileType.background,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={fileType.icon}
              size={27}
              color={fileType.color}
            />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text
                style={styles.cardTitle}
                numberOfLines={2}
              >
                {item.title || 'Attachment'}
              </Text>
            </View>

            <View style={styles.typeRow}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: fileType.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    {
                      color: fileType.color,
                    },
                  ]}
                >
                  {fileType.label}
                </Text>
              </View>

              <View style={styles.savedBadge}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={12}
                  color={COLORS.success}
                />

                <Text style={styles.savedBadgeText}>
                  Saved Offline
                </Text>
              </View>
            </View>

            {!!item.courseTitle && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="book-open-outline"
                  size={14}
                  color={COLORS.primary}
                />

                <Text
                  style={styles.metaText}
                  numberOfLines={1}
                >
                  {item.courseTitle}
                </Text>
              </View>
            )}

            {!!item.lessonTitle && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={14}
                  color="#7C3AED"
                />

                <Text
                  style={styles.metaText}
                  numberOfLines={1}
                >
                  {item.lessonTitle}
                </Text>
              </View>
            )}

            <View style={styles.dateRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color={COLORS.textMuted}
              />

              <Text style={styles.dateText}>
                Downloaded {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.openIcon}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={COLORS.textMuted}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.cardDivider} />

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.openButton}
            activeOpacity={0.8}
            disabled={isDeleting}
            onPress={() => openDownload(item)}
          >
            <MaterialCommunityIcons
              name="folder-open-outline"
              size={17}
              color={COLORS.primary}
            />

            <Text style={styles.openButtonText}>
              Open File
            </Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            disabled={isDeleting}
            onPress={() => handleDelete(item)}
          >
            {isDeleting ? (
              <ActivityIndicator
                size="small"
                color={COLORS.danger}
              />
            ) : (
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color={COLORS.danger}
              />
            )}

            <Text style={styles.deleteButtonText}>
              {isDeleting ? 'Removing...' : 'Remove'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <LinearGradient
          colors={[
            COLORS.primaryDark,
            COLORS.primary,
            '#8B5CF6',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerArea}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                My Downloads
              </Text>

              <Text style={styles.headerSubtitle}>
                Access your saved study material offline
              </Text>
            </View>

            <View style={styles.headerIconWrap}>
              <MaterialCommunityIcons
                name="download-circle-outline"
                size={25}
                color="#FFFFFF"
              />
            </View>
          </View>

          {!loading && items.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons
                  name="folder-download-outline"
                  size={27}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>
                  OFFLINE LIBRARY
                </Text>

                <Text style={styles.summaryTitle}>
                  {items.length}{' '}
                  {items.length === 1 ? 'File' : 'Files'} Saved
                </Text>

                <Text style={styles.summarySubtitle}>
                  Your downloaded learning resources
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <View style={styles.root}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <View style={styles.loadingIconWrap}>
                <MaterialCommunityIcons
                  name="folder-download-outline"
                  size={38}
                  color={COLORS.primary}
                />
              </View>

              <ActivityIndicator
                size="large"
                color={COLORS.primary}
              />

              <Text style={styles.loadingTitle}>
                Loading downloads...
              </Text>

              <Text style={styles.loadingSubtitle}>
                Finding your saved study material
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item, index) =>
                String(item?.id ?? index)
              }
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                items.length === 0 &&
                  styles.emptyListContent,
              ]}
              ListHeaderComponent={
                items.length > 0 ? (
                  <View style={styles.listHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>
                        Downloaded Files
                      </Text>

                      <Text style={styles.sectionSubtitle}>
                        Tap any file to open it
                      </Text>
                    </View>

                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {items.length}
                      </Text>
                    </View>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIllustration}>
                    <View style={styles.emptyCircleLarge}>
                      <MaterialCommunityIcons
                        name="cloud-download-outline"
                        size={54}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.emptySmallIcon}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={22}
                        color="#7C3AED"
                      />
                    </View>
                  </View>

                  <Text style={styles.emptyTitle}>
                    No Downloads Yet
                  </Text>

                  <Text style={styles.emptySubtext}>
                    Download lecture attachments and study
                    materials to access them anytime, even
                    when you're offline.
                  </Text>

                  <View style={styles.emptyTip}>
                    <MaterialCommunityIcons
                      name="lightbulb-outline"
                      size={18}
                      color={COLORS.primary}
                    />

                    <Text style={styles.emptyTipText}>
                      Open a lecture attachment and tap the
                      download button to save it here.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.exploreButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.goBack()}
                  >
                    <LinearGradient
                      colors={[
                        COLORS.primary,
                        '#8B5CF6',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.exploreGradient}
                    >
                      <MaterialCommunityIcons
                        name="book-open-page-variant-outline"
                        size={19}
                        color="#FFFFFF"
                      />

                      <Text style={styles.exploreButtonText}>
                        Explore Study Material
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerArea: {
    paddingBottom: 18,
  },

  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },

  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    marginHorizontal: 16,
    marginTop: 7,
    padding: 16,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContent: {
    flex: 1,
  },

  summaryLabel: {
    color: '#DDD6FE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },

  summarySubtitle: {
    color: '#DDD6FE',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },

  listContent: {
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 45,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
  },

  downloadCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 13,
    overflow: 'hidden',

    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  downloadMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },

  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardBody: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  cardTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
    marginBottom: 8,
  },

  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },

  typeBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },

  savedBadgeText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '800',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  metaText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  dateText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },

  openIcon: {
    marginLeft: 7,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  cardActions: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
  },

  openButton: {
    flex: 1,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  openButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  actionDivider: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.border,
  },

  deleteButton: {
    flex: 1,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  loadingIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  loadingTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 15,
  },

  loadingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingBottom: 35,
  },

  emptyIllustration: {
    width: 130,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyCircleLarge: {
    width: 105,
    height: 105,
    borderRadius: 35,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptySmallIcon: {
    position: 'absolute',
    right: 4,
    bottom: 5,
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#F3E8FF',
    borderWidth: 4,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
  },

  emptySubtext: {
    maxWidth: 310,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },

  emptyTip: {
    maxWidth: 330,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
  },

  emptyTipText: {
    flex: 1,
    color: COLORS.primaryDark,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
  },

  exploreButton: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 18,
  },

  exploreGradient: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },

  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});