import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useAuth,
} from '../../auth/AuthContext';

import {
  Picker,
} from '@react-native-picker/picker';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getCourse,
  getCohorts,
} from '../../api/client';

import apiClient from '../../api/client';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import {
  Platform,
} from 'react-native';


const {
  width,
} = Dimensions.get('window');


const PURPLE = '#6D28D9';
const PURPLE_DARK = '#4C1D95';
const PURPLE_DEEP = '#2E1065';

const TEXT = '#111827';
const TEXT_SECONDARY = '#475569';
const MUTED = '#64748B';
const LIGHT_MUTED = '#94A3B8';

const BACKGROUND = '#F8F7FC';
const WHITE = '#FFFFFF';
const BORDER = '#ECE9F3';


const QUICK_ACTIONS = [
  {
    label: 'Live Classes',
    icon: 'video-outline',
    color: '#7C3AED',
    background: '#F3E8FF',
  },
  {
    label: 'Study',
    icon: 'school-outline',
    color: '#2563EB',
    background: '#EFF6FF',
  },
  {
    label: 'All Batches',
    icon: 'account-group-outline',
    color: '#EA580C',
    background: '#FFF7ED',
  },
  {
    label: 'Test Series',
    icon: 'clipboard-text-outline',
    color: '#059669',
    background: '#ECFDF5',
  },
  {
    label: 'Results',
    icon: 'chart-box-outline',
    color: '#DB2777',
    background: '#FDF2F8',
  },
  {
    label: 'Downloads',
    icon: 'download-outline',
    color: '#2563EB',
    background: '#EFF6FF',
  },
  {
    label: 'Announcements',
    icon: 'bullhorn-outline',
    color: '#D97706',
    background: '#FFFBEB',
  },
];


export default function DashboardScreen({
  navigation,
}) {
  const {
    logout,
  } = useAuth();


  const scrollRef = useRef(null);

  const scheduleSectionY = useRef(0);


  const [menuOpen, setMenuOpen] = useState(false);

  const [cohorts, setCohorts] = useState([]);

  const [
    selectedCohort,
    setSelectedCohort,
  ] = useState(null);


  const [schedule, setSchedule] = useState({
    live: [],
    upcoming: [],
    completed: [],
    cancelled: [],
  });


  const [
    cohortsLoading,
    setCohortsLoading,
  ] = useState(true);


  const [
    scheduleLoading,
    setScheduleLoading,
  ] = useState(false);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    hasNewAnnouncement,
    setHasNewAnnouncement,
  ] = useState(false);


  // ============================================================
  // DATE
  // ============================================================

  const isToday = useCallback((dateString) => {
    if (!dateString) {
      return false;
    }

    const date = new Date(dateString);

    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);


  // ============================================================
  // COHORTS
  // ============================================================

  const loadCohorts = useCallback(async () => {
    setCohortsLoading(true);

    try {
      const response = await getCohorts();

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setCohorts(data);


      if (data.length > 0) {
        const persisted =
          await AsyncStorage.getItem(
            'selectedCohort'
          );


        const matched = data.find(
          cohort =>
            String(cohort?._id) ===
            String(persisted)
        );


        setSelectedCohort(
          matched
            ? matched._id
            : data[0]._id
        );
      } else {
        setSelectedCohort(null);
      }

    } catch (error) {
      console.error(
        'Failed to load cohorts:',
        error
      );

      setCohorts([]);

    } finally {
      setCohortsLoading(false);
    }
  }, []);


  // ============================================================
  // PUSH NOTIFICATIONS
  // ============================================================

  const registerForPushNotificationsAsync =
    useCallback(async () => {
      if (
        Platform.OS === 'web' ||
        !Device.isDevice
      ) {
        return;
      }


      try {
        const {
          status: existingStatus,
        } =
          await Notifications.getPermissionsAsync();


        let finalStatus = existingStatus;


        if (existingStatus !== 'granted') {
          const {
            status,
          } =
            await Notifications.requestPermissionsAsync();

          finalStatus = status;
        }


        if (finalStatus !== 'granted') {
          return;
        }


        const tokenData =
          await Notifications.getExpoPushTokenAsync();


        if (tokenData?.data) {
          await apiClient.post(
            '/auth/push-token',
            {
              token: tokenData.data,
            }
          );
        }

      } catch (error) {
        console.log(
          'Push notification registration error:',
          error
        );
      }
    }, []);


  useEffect(() => {
    loadCohorts();

    registerForPushNotificationsAsync();
  }, [
    loadCohorts,
    registerForPushNotificationsAsync,
  ]);


  // ============================================================
  // SAVE COHORT
  // ============================================================

  useEffect(() => {
    if (!selectedCohort) {
      return;
    }


    AsyncStorage.setItem(
      'selectedCohort',
      String(selectedCohort)
    ).catch(error => {
      console.log(
        'Failed to save cohort:',
        error
      );
    });
  }, [selectedCohort]);


  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  const loadAnnouncements =
    useCallback(async () => {
      if (!selectedCohort) {
        setHasNewAnnouncement(false);

        return;
      }


      try {
        const response = await apiClient.get(
          `/student/announcements?batchId=${selectedCohort}`
        );


        const data = Array.isArray(response?.data)
          ? response.data
          : [];


        if (data.length === 0) {
          setHasNewAnnouncement(false);

          return;
        }


        const lastSeen =
          await AsyncStorage.getItem(
            `lastSeenAnnouncement_${selectedCohort}`
          );


        const lastDate = lastSeen
          ? new Date(lastSeen)
          : new Date(0);


        const sortedAnnouncements = [
          ...data,
        ].sort(
          (a, b) =>
            new Date(b?.createdAt || 0) -
            new Date(a?.createdAt || 0)
        );


        const latestDate = new Date(
          sortedAnnouncements[0]?.createdAt || 0
        );


        setHasNewAnnouncement(
          latestDate > lastDate
        );

      } catch (error) {
        console.log(
          'Announcement loading error:',
          error
        );
      }
    }, [selectedCohort]);


  // ============================================================
  // SCHEDULE
  // ============================================================

  const loadSchedule =
    useCallback(async () => {
      if (!selectedCohort) {
        setSchedule({
          live: [],
          upcoming: [],
          completed: [],
          cancelled: [],
        });

        return;
      }


      setScheduleLoading(true);


      try {
        const data = await getCourse(
          selectedCohort
        );


        setSchedule({
          live: (
            data?.live || []
          ).filter(item =>
            isToday(item?.scheduledAt)
          ),

          upcoming: (
            data?.upcoming || []
          ).filter(item =>
            isToday(item?.scheduledAt)
          ),

          completed: (
            data?.completed || []
          ).filter(item =>
            isToday(item?.scheduledAt)
          ),

          cancelled: (
            data?.cancelled || []
          ).filter(item =>
            isToday(item?.scheduledAt)
          ),
        });

      } catch (error) {
        console.error(
          'Failed to load schedule:',
          error
        );


        setSchedule({
          live: [],
          upcoming: [],
          completed: [],
          cancelled: [],
        });

      } finally {
        setScheduleLoading(false);
      }
    }, [
      selectedCohort,
      isToday,
    ]);


  useEffect(() => {
    loadSchedule();

    loadAnnouncements();
  }, [
    loadSchedule,
    loadAnnouncements,
  ]);


  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh = async () => {
    setRefreshing(true);


    try {
      await loadCohorts();

      if (selectedCohort) {
        await Promise.all([
          loadSchedule(),
          loadAnnouncements(),
        ]);
      }

    } finally {
      setRefreshing(false);
    }
  };


  // ============================================================
  // OPEN LECTURE
  // ============================================================

  const openLecture = lecture => {
    navigation.navigate('Study', {
      screen: 'StudyYoutubeVideoPlayer',

      params: {
        courseId: selectedCohort,

        lectureId: lecture?._id,

        lectureTitle:
          lecture?.title,

        status:
          lecture?.status ||
          'ended',
      },
    });
  };


  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = date => {
    if (!date) {
      return '';
    }


    const parsedDate = new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return '';
    }


    return parsedDate.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }
    );
  };


  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  const openAnnouncements = async () => {
    if (!selectedCohort) {
      Alert.alert(
        'No Active Batch',
        'Select a batch to view announcements.'
      );

      return;
    }


    try {
      await AsyncStorage.setItem(
        `lastSeenAnnouncement_${selectedCohort}`,
        new Date().toISOString()
      );

      setHasNewAnnouncement(false);

    } catch (error) {
      console.log(
        'Announcement state error:',
        error
      );
    }


    navigation.navigate(
      'Announcements',
      {
        batchId: selectedCohort,
      }
    );
  };


  // ============================================================
  // QUICK ACTION
  // ============================================================

  const handleQuickAction = label => {
    switch (label) {
      case 'Study':
        navigation.navigate('Study', {
          state: {
            routes: [
              {
                name: 'StudyHome',
              },
            ],
          },
        });

        break;


      case 'All Batches':
        navigation.navigate('Batches', {
          state: {
            routes: [
              {
                name: 'BatchesList',
              },
            ],
          },
        });

        break;


      case 'Test Series':
        navigation.navigate('MyTests', {
          state: {
            routes: [
              {
                name: 'MyTestsList',
              },
            ],
          },
        });

        break;


      case 'Results':
        navigation.navigate('MyTests', {
          state: {
            routes: [
              {
                name: 'AttemptedTests',
              },
            ],
          },
        });

        break;


      case 'Downloads':
        navigation.navigate('Study', {
          state: {
            routes: [
              {
                name: 'Downloads',
              },
            ],
          },
        });

        break;


      case 'Live Classes':
        scrollRef.current?.scrollTo({
          y: Math.max(
            0,
            scheduleSectionY.current - 20
          ),

          animated: true,
        });

        break;


      case 'Announcements':
        openAnnouncements();

        break;


      default:
        break;
    }
  };


  // ============================================================
  // SCHEDULE CARD
  // ============================================================

  const renderScheduleCard = lecture => {
    const isLive =
      lecture?.status === 'live';

    const isCancelled =
      lecture?.status === 'cancelled';

    const isEnded =
      lecture?.status === 'ended' || lecture?.status === 'completed';

    const statusData = isLive
      ? {
        label: 'LIVE',
        color: '#DC2626',
        background: '#FEF2F2',
        icon: 'access-point',
      }
      : isCancelled
        ? {
          label: 'CANCELLED',
          color: '#64748B',
          background: '#F1F5F9',
          icon: 'close-circle-outline',
        }
        : isEnded
          ? {
            label: 'COMPLETED',
            color: '#16A34A',
            background: '#F0FDF4',
            icon: 'check-circle-outline',
          }
          : {
            label: 'UPCOMING',
            color: PURPLE,
            background: '#F3E8FF',
            icon: 'clock-outline',
          };


    return (
      <TouchableOpacity
        style={styles.scheduleCard}
        activeOpacity={
          isCancelled
            ? 1
            : 0.82
        }
        onPress={() => {
          if (!isCancelled) {
            openLecture(lecture);
          }
        }}
      >
        <View style={styles.scheduleTop}>
          <View
            style={[
              styles.scheduleIcon,
              {
                backgroundColor:
                  statusData.background,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={statusData.icon}
              size={22}
              color={statusData.color}
            />
          </View>


          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusData.background,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    statusData.color,
                },
              ]}
            >
              {statusData.label}
            </Text>
          </View>
        </View>


        <Text
          style={styles.scheduleSubject}
          numberOfLines={1}
        >
          {lecture?.subject
            ? `${lecture.subject}${lecture?.chapter ? ` • ${lecture.chapter}` : ''}`
            : 'CLASS'}
        </Text>


        <Text
          style={styles.scheduleTitle}
          numberOfLines={2}
        >
          {lecture?.title || 'Scheduled Class'}
        </Text>


        <View style={styles.scheduleFooter}>
          <View style={styles.scheduleTimeRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={MUTED}
            />

            <Text style={styles.scheduleTime}>
              {formatTime(
                lecture?.scheduledAt
              ) || 'Time unavailable'}
            </Text>
          </View>


          {!isCancelled && (
            <View style={styles.openClassButton}>
              <MaterialCommunityIcons
                name={
                  isLive
                    ? 'video-outline'
                    : 'play-outline'
                }
                size={15}
                color={PURPLE}
              />

              <Text style={styles.openClassText}>
                {isLive
                  ? 'Join'
                  : 'Open'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  // ============================================================
  // SCHEDULE SECTION
  // ============================================================

  const renderScheduleSection = ({
    title,
    subtitle,
    icon,
    color,
    background,
    items,
    emptyText,
  }) => {
    return (
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleSectionHeader}>
          <View
            style={[
              styles.scheduleSectionIcon,
              {
                backgroundColor:
                  background,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={color}
            />
          </View>


          <View style={styles.scheduleSectionText}>
            <Text style={styles.scheduleSectionTitle}>
              {title}
            </Text>

            <Text style={styles.scheduleSectionSubtitle}>
              {subtitle}
            </Text>
          </View>


          <View style={styles.scheduleCount}>
            <Text style={styles.scheduleCountText}>
              {items.length}
            </Text>
          </View>
        </View>


        {items.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.scheduleHorizontalContent
            }
          >
            {items.map((item, index) => (
              <View
                key={String(item?._id) + '-' + index}
                style={styles.scheduleCardContainer}
              >
                {renderScheduleCard(item)}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.scheduleEmptyCard}>
            <View
              style={[
                styles.scheduleEmptyIcon,
                {
                  backgroundColor:
                    background,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={icon}
                size={22}
                color={color}
              />
            </View>

            <Text style={styles.scheduleEmptyText}>
              {emptyText}
            </Text>
          </View>
        )}
      </View>
    );
  };


  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PURPLE}
              colors={[PURPLE]}
            />
          }
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                setMenuOpen(true)
              }
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name="menu"
                size={25}
                color={TEXT}
              />
            </TouchableOpacity>

            <Text style={styles.headerLogoText}>
              Garud Classes
            </Text>


            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={openAnnouncements}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={23}
                  color={PURPLE_DARK}
                />

                {hasNewAnnouncement && (
                  <View
                    style={
                      styles.notificationBadge
                    }
                  />
                )}
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.profileButton}
                onPress={() =>
                  navigation.navigate(
                    'MyProfile'
                  )
                }
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={24}
                  color={PURPLE}
                />
              </TouchableOpacity>
            </View>
          </View>


          {/* WELCOME */}

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEyebrow}>
              GARUD CLASSES
            </Text>

            <Text style={styles.welcomeTitle}>
              Hello, Student
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Continue learning and stay consistent with your goals.
            </Text>
          </View>


          {/* ACTIVE BATCH */}

          {cohortsLoading ? (
            <View style={styles.batchLoadingCard}>
              <ActivityIndicator
                color={PURPLE}
              />

              <Text style={styles.loadingText}>
                Loading your batch...
              </Text>
            </View>
          ) : cohorts.length === 0 ? (
            <View style={styles.emptyBatchCard}>
              <View style={styles.emptyBatchIcon}>
                <MaterialCommunityIcons
                  name="school-outline"
                  size={28}
                  color={PURPLE}
                />
              </View>

              <View style={styles.emptyBatchContent}>
                <Text style={styles.emptyBatchTitle}>
                  No active batch
                </Text>

                <Text style={styles.emptyBatchText}>
                  Enroll in a batch to access classes and your study schedule.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.batchPickerCard}>
              <View style={styles.batchPickerHeader}>
                <View style={styles.batchIcon}>
                  <MaterialCommunityIcons
                    name="school-outline"
                    size={20}
                    color={PURPLE}
                  />
                </View>

                <View>
                  <Text style={styles.batchPickerLabel}>
                    ACTIVE BATCH
                  </Text>

                  <Text style={styles.batchPickerHint}>
                    Select your current learning batch
                  </Text>
                </View>
              </View>


              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={selectedCohort}
                  onValueChange={
                    setSelectedCohort
                  }
                  style={styles.picker}
                  dropdownIconColor={PURPLE}
                >
                  {cohorts.map(cohort => (
                    <Picker.Item
                      key={cohort._id}
                      label={
                        cohort.name ||
                        'Unnamed Batch'
                      }
                      value={cohort._id}
                      color={TEXT}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}


          {/* OVERVIEW */}

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                Today's Overview
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your learning activity for today
              </Text>
            </View>
          </View>


          <View style={styles.statisticsRow}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor:
                    '#F8F5FF',
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      '#EDE9FE',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#7C3AED"
                />
              </View>

              <Text style={styles.statNumber}>
                {schedule.upcoming.length}
              </Text>

              <Text style={styles.statLabel}>
                Upcoming
              </Text>
            </View>


            <View
              style={[
                styles.statCard,
                {
                  backgroundColor:
                    '#F0F7FF',
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      '#DBEAFE',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.statNumber}>
                {schedule.completed.length}
              </Text>

              <Text style={styles.statLabel}>
                Completed
              </Text>
            </View>


            <View
              style={[
                styles.statCard,
                {
                  backgroundColor:
                    '#F0FDF4',
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      '#DCFCE7',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="school-outline"
                  size={20}
                  color="#16A34A"
                />
              </View>

              <Text style={styles.statNumber}>
                {cohorts.length}
              </Text>

              <Text style={styles.statLabel}>
                Batches
              </Text>
            </View>


            <View
              style={[
                styles.statCard,
                {
                  backgroundColor:
                    '#FFF7ED',
                },
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      '#FFEDD5',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="access-point"
                  size={20}
                  color="#EA580C"
                />
              </View>

              <Text style={styles.statNumber}>
                {schedule.live.length}
              </Text>

              <Text style={styles.statLabel}>
                Live Now
              </Text>
            </View>
          </View>


          {/* QUICK ACCESS */}

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                Quick Access
              </Text>

              <Text style={styles.sectionSubtitle}>
                Open your frequently used sections
              </Text>
            </View>
          </View>


          <View style={styles.quickAccessCard}>
            {QUICK_ACTIONS.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickAccessItem}
                activeOpacity={0.72}
                onPress={() =>
                  handleQuickAction(
                    item.label
                  )
                }
              >
                <View
                  style={[
                    styles.quickAccessIcon,
                    {
                      backgroundColor:
                        item.background,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={23}
                    color={item.color}
                  />
                </View>

                <Text
                  style={styles.quickAccessLabel}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>


          {/* SCHEDULE */}

          <View
            onLayout={event => {
              scheduleSectionY.current =
                event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  Today's Schedule
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Classes scheduled for today
                </Text>
              </View>
            </View>


            {scheduleLoading ? (
              <View style={styles.scheduleLoader}>
                <ActivityIndicator
                  size="large"
                  color={PURPLE}
                />

                <Text style={styles.loadingText}>
                  Loading today's classes...
                </Text>
              </View>
            ) : (
              <>
                {renderScheduleSection({
                  title: 'Live Now',
                  subtitle:
                    'Classes currently in progress',
                  icon: 'access-point',
                  color: '#DC2626',
                  background: '#FEF2F2',
                  items: schedule.live,
                  emptyText:
                    'No classes are live right now.',
                })}


                {renderScheduleSection({
                  title: 'Upcoming',
                  subtitle:
                    'Classes scheduled later today',
                  icon: 'clock-outline',
                  color: PURPLE,
                  background: '#F3E8FF',
                  items: schedule.upcoming,
                  emptyText:
                    'No upcoming classes today.',
                })}


                {renderScheduleSection({
                  title: 'Completed',
                  subtitle:
                    'Classes completed today',
                  icon: 'check-circle-outline',
                  color: '#16A34A',
                  background: '#F0FDF4',
                  items: schedule.completed,
                  emptyText:
                    'No completed classes today.',
                })}


                {renderScheduleSection({
                  title: 'Cancelled',
                  subtitle:
                    'Classes cancelled today',
                  icon: 'close-circle-outline',
                  color: '#64748B',
                  background: '#F1F5F9',
                  items: schedule.cancelled,
                  emptyText:
                    'No cancelled classes today.',
                })}
              </>
            )}
          </View>
        </ScrollView>


        {/* DRAWER */}

        <Modal
          visible={menuOpen}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() =>
            setMenuOpen(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.drawer}>
              <View style={styles.drawerHandle} />


              <View style={styles.drawerHeader}>
                <View>
                  <Text style={styles.drawerTitle}>
                    Menu
                  </Text>

                  <Text style={styles.drawerSubtitle}>
                    Manage your account and preferences
                  </Text>
                </View>


                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() =>
                    setMenuOpen(false)
                  }
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color={MUTED}
                  />
                </TouchableOpacity>
              </View>


              <DrawerItem
                icon="account-circle-outline"
                title="My Profile"
                onPress={() => {
                  setMenuOpen(false);

                  navigation.navigate(
                    'MyProfile'
                  );
                }}
              />


              <DrawerItem
                icon="cart-outline"
                title="My Purchases"
                onPress={() => {
                  setMenuOpen(false);

                  navigation.navigate(
                    'Batches',
                    {
                      screen: 'MyPurchases',
                    }
                  );
                }}
              />


              <DrawerItem
                icon="lifebuoy"
                title="Help & Support"
                onPress={() => {
                  setMenuOpen(false);

                  navigation.navigate(
                    'HelpSupport'
                  );
                }}
              />

              <View style={styles.drawerSpacer} />


              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                  setMenuOpen(false);

                  await logout();
                }}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={19}
                  color="#DC2626"
                />

                <Text style={styles.logoutText}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}


// ============================================================
// DRAWER ITEM
// ============================================================

function DrawerItem({
  icon,
  title,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.drawerItem}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.drawerIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={PURPLE}
        />
      </View>


      <Text style={styles.drawerItemText}>
        {title}
      </Text>


      <MaterialCommunityIcons
        name="chevron-right"
        size={21}
        color="#CBD5E1"
      />
    </TouchableOpacity>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },

  root: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollContent: {
    paddingBottom: 125,
  },


  // HEADER

  header: {
    height: 68,

    paddingHorizontal: 16,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: WHITE,
  },

  headerButton: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: '#F8F7FC',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: '#F0EDF8',
  },

  headerLogoText: {
    marginLeft: 14,
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  headerRight: {
    marginLeft: 'auto',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 9,
  },

  profileButton: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: '#F3E8FF',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: '#E9D5FF',
  },

  notificationBadge: {
    position: 'absolute',

    top: 8,
    right: 8,

    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: '#DC2626',

    borderWidth: 1.5,
    borderColor: WHITE,
  },


  // WELCOME

  welcomeContainer: {
    paddingHorizontal: 18,

    paddingTop: 20,

    paddingBottom: 18,

    backgroundColor: WHITE,
  },

  welcomeEyebrow: {
    color: PURPLE,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1.3,
  },

  welcomeTitle: {
    marginTop: 6,

    color: TEXT,

    fontSize: 25,

    fontWeight: '900',

    letterSpacing: -0.6,
  },

  welcomeSubtitle: {
    marginTop: 6,

    color: MUTED,

    fontSize: 12,

    lineHeight: 18,

    fontWeight: '500',
  },


  // BATCH

  batchLoadingCard: {
    marginHorizontal: 16,

    marginTop: 14,

    minHeight: 86,

    borderRadius: 18,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 10,
  },

  loadingText: {
    color: MUTED,

    fontSize: 11,

    fontWeight: '600',
  },

  emptyBatchCard: {
    marginHorizontal: 16,

    marginTop: 14,

    padding: 15,

    borderRadius: 18,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: 'row',

    alignItems: 'center',
  },

  emptyBatchIcon: {
    width: 50,
    height: 50,

    borderRadius: 15,

    backgroundColor: '#F3E8FF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBatchContent: {
    flex: 1,

    marginLeft: 13,
  },

  emptyBatchTitle: {
    color: TEXT,

    fontSize: 14,

    fontWeight: '800',
  },

  emptyBatchText: {
    marginTop: 4,

    color: MUTED,

    fontSize: 10,

    lineHeight: 15,

    fontWeight: '500',
  },

  batchPickerCard: {
    marginHorizontal: 16,

    marginTop: 14,

    borderRadius: 19,

    padding: 14,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    shadowColor: PURPLE_DEEP,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.04,

    shadowRadius: 10,

    elevation: 2,
  },

  batchPickerHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 11,
  },

  batchIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: '#F3E8FF',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  batchPickerLabel: {
    color: PURPLE,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1,
  },

  batchPickerHint: {
    marginTop: 3,

    color: MUTED,

    fontSize: 10,

    fontWeight: '500',
  },

  pickerWrap: {
    height: 50,

    borderRadius: 13,

    overflow: 'hidden',

    backgroundColor: '#F8F7FC',

    borderWidth: 1,

    borderColor: '#F0EDF8',

    justifyContent: 'center',
  },

  picker: {
    height: 50,

    color: TEXT,
  },


  // SECTION

  sectionHeading: {
    marginTop: 25,

    marginBottom: 12,

    paddingHorizontal: 18,
  },

  sectionTitle: {
    color: TEXT,

    fontSize: 18,

    fontWeight: '900',

    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 3,

    color: MUTED,

    fontSize: 10,

    lineHeight: 15,

    fontWeight: '500',
  },


  // STATISTICS

  statisticsRow: {
    paddingHorizontal: 16,

    flexDirection: 'row',

    justifyContent: 'space-between',

    gap: 7,
  },

  statCard: {
    flex: 1,

    minHeight: 105,

    borderRadius: 17,

    paddingHorizontal: 9,

    paddingVertical: 11,

    borderWidth: 1,

    borderColor:
      'rgba(226,232,240,0.75)',
  },

  statIcon: {
    width: 34,
    height: 34,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',
  },

  statNumber: {
    marginTop: 9,

    color: TEXT,

    fontSize: 21,

    fontWeight: '900',
  },

  statLabel: {
    marginTop: 2,

    color: TEXT_SECONDARY,

    fontSize: 9,

    fontWeight: '700',
  },


  // QUICK ACCESS

  quickAccessCard: {
    marginHorizontal: 16,

    paddingHorizontal: 7,

    paddingVertical: 10,

    borderRadius: 20,

    backgroundColor: WHITE,

    flexDirection: 'row',

    flexWrap: 'wrap',

    borderWidth: 1,
    borderColor: BORDER,

    shadowColor: PURPLE_DEEP,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.04,

    shadowRadius: 12,

    elevation: 2,
  },

  quickAccessItem: {
    width: '25%',

    minHeight: 84,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 3,
  },

  quickAccessIcon: {
    width: 46,
    height: 46,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',
  },

  quickAccessLabel: {
    marginTop: 7,

    color: TEXT,

    fontSize: 9,

    lineHeight: 12,

    fontWeight: '700',

    textAlign: 'center',
  },


  // SCHEDULE SECTION

  scheduleSection: {
    marginBottom: 21,
  },

  scheduleSectionHeader: {
    paddingHorizontal: 18,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 11,
  },

  scheduleSectionIcon: {
    width: 40,
    height: 40,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',
  },

  scheduleSectionText: {
    flex: 1,

    marginLeft: 10,
  },

  scheduleSectionTitle: {
    color: TEXT,

    fontSize: 14,

    fontWeight: '800',
  },

  scheduleSectionSubtitle: {
    marginTop: 2,

    color: MUTED,

    fontSize: 9,

    lineHeight: 13,

    fontWeight: '500',
  },

  scheduleCount: {
    minWidth: 30,
    height: 30,

    borderRadius: 10,

    paddingHorizontal: 8,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    alignItems: 'center',
    justifyContent: 'center',
  },

  scheduleCountText: {
    color: PURPLE,

    fontSize: 11,

    fontWeight: '900',
  },

  scheduleHorizontalContent: {
    paddingLeft: 16,

    paddingRight: 8,

    paddingVertical: 10,
  },

  scheduleCardContainer: {
    width: 260,

    marginRight: 10,
  },

  scheduleCard: {
    minHeight: 155,

    borderRadius: 19,

    padding: 14,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    shadowColor: PURPLE_DEEP,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.04,

    shadowRadius: 9,

    elevation: 2,
  },

  scheduleTop: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  scheduleIcon: {
    width: 39,
    height: 39,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBadge: {
    borderRadius: 999,

    paddingHorizontal: 8,

    paddingVertical: 5,
  },

  statusBadgeText: {
    fontSize: 8,

    fontWeight: '900',

    letterSpacing: 0.5,
  },

  scheduleSubject: {
    marginTop: 14,

    color: PURPLE,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 0.7,

    textTransform: 'uppercase',
  },

  scheduleTitle: {
    marginTop: 3,

    minHeight: 38,

    color: TEXT,

    fontSize: 14,

    lineHeight: 19,

    fontWeight: '800',
  },

  scheduleFooter: {
    marginTop: 10,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  scheduleTimeRow: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },

  scheduleTime: {
    color: MUTED,

    fontSize: 9,

    fontWeight: '600',
  },

  openClassButton: {
    minHeight: 32,

    paddingHorizontal: 10,

    borderRadius: 10,

    backgroundColor: '#F3E8FF',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,
  },

  openClassText: {
    color: PURPLE,

    fontSize: 9,

    fontWeight: '800',
  },

  scheduleEmptyCard: {
    marginHorizontal: 16,

    minHeight: 68,

    borderRadius: 16,

    paddingHorizontal: 13,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: 'row',

    alignItems: 'center',
  },

  scheduleEmptyIcon: {
    width: 39,
    height: 39,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  scheduleEmptyText: {
    flex: 1,

    marginLeft: 11,

    color: MUTED,

    fontSize: 10,

    lineHeight: 15,

    fontWeight: '600',
  },


  // CONTINUE LEARNING

  continueLearningCard: {
    marginHorizontal: 16,

    minHeight: 104,

    borderRadius: 19,

    padding: 12,

    backgroundColor: WHITE,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: 'row',

    alignItems: 'center',

    shadowColor: PURPLE_DEEP,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.04,

    shadowRadius: 10,

    elevation: 2,
  },

  thumbnail: {
    width: 92,
    height: 76,

    borderRadius: 15,

    backgroundColor: PURPLE_DEEP,

    alignItems: 'center',
    justifyContent: 'center',
  },

  playButton: {
    width: 43,
    height: 43,

    borderRadius: 22,

    backgroundColor: WHITE,

    alignItems: 'center',
    justifyContent: 'center',
  },

  learningInfo: {
    flex: 1,

    marginLeft: 12,

    marginRight: 5,
  },

  learningSubject: {
    color: PURPLE,

    fontSize: 8,

    fontWeight: '900',

    letterSpacing: 0.7,
  },

  learningTitle: {
    marginTop: 4,

    color: TEXT,

    fontSize: 13,

    lineHeight: 18,

    fontWeight: '800',
  },

  resumeRow: {
    marginTop: 9,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },

  resumeText: {
    color: PURPLE,

    fontSize: 9,

    fontWeight: '700',
  },


  // SCHEDULE LOADER

  scheduleLoader: {
    minHeight: 150,

    alignItems: 'center',

    justifyContent: 'center',

    gap: 12,
  },


  // DRAWER

  modalOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(15,23,42,0.45)',

    justifyContent: 'flex-end',
  },

  drawer: {
    height: '72%',

    backgroundColor: WHITE,

    borderTopLeftRadius: 28,

    borderTopRightRadius: 28,

    paddingHorizontal: 20,

    paddingTop: 10,

    paddingBottom: 34,
  },

  drawerHandle: {
    alignSelf: 'center',

    width: 42,
    height: 4,

    borderRadius: 2,

    backgroundColor: '#CBD5E1',

    marginBottom: 18,
  },

  drawerHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 15,
  },

  drawerTitle: {
    color: TEXT,

    fontSize: 23,

    fontWeight: '900',
  },

  drawerSubtitle: {
    marginTop: 4,

    color: MUTED,

    fontSize: 10,

    fontWeight: '500',
  },

  closeButton: {
    width: 40,
    height: 40,

    borderRadius: 13,

    backgroundColor: '#F8F7FC',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: BORDER,
  },

  drawerItem: {
    minHeight: 64,

    borderBottomWidth: 1,

    borderBottomColor: '#F1F5F9',

    flexDirection: 'row',

    alignItems: 'center',
  },

  drawerIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: '#F3E8FF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  drawerItemText: {
    flex: 1,

    marginLeft: 12,

    color: TEXT,

    fontSize: 14,

    fontWeight: '700',
  },

  drawerSpacer: {
    flex: 1,
  },

  logoutButton: {
    minHeight: 52,

    borderRadius: 15,

    backgroundColor: '#FEF2F2',

    borderWidth: 1,

    borderColor: '#FECACA',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,
  },

  logoutText: {
    color: '#DC2626',

    fontSize: 14,

    fontWeight: '800',
  },
});