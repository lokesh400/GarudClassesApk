import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  RefreshControl,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import AppHeader from '../../components/AppHeader';

import {
  fetchMyHelpRequests,
  createHelpRequest,
} from '../../api/help';


/* ============================================================
   COLORS
============================================================ */

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

  danger: '#DC2626',
  dangerLight: '#FEE2E2',

  warning: '#D97706',
  warningLight: '#FEF3C7',

  info: '#2563EB',
  infoLight: '#DBEAFE',
};


/* ============================================================
   SCREEN
============================================================ */

export default function HelpSupportScreen({
  navigation,
}) {

  const [message, setMessage] = useState('');

  const [
    helpRequests,
    setHelpRequests,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [
    ticketModalVisible,
    setTicketModalVisible,
  ] = useState(false);

  const [
    ticketDetailVisible,
    setTicketDetailVisible,
  ] = useState(false);

  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState(null);


  /* ============================================================
     STATUS
  ============================================================ */

  const getStatusMeta = (statusValue) => {

    const normalized = String(
      statusValue || ''
    )
      .trim()
      .toLowerCase();

    if (
      normalized === 'closed' ||
      normalized === 'resolved'
    ) {

      return {
        label:
          normalized === 'resolved'
            ? 'Resolved'
            : 'Closed',

        background: COLORS.successLight,

        color: COLORS.success,

        icon: 'check-circle-outline',
      };

    }

    if (
      normalized === 'pending' ||
      normalized === 'in progress' ||
      normalized === 'processing'
    ) {

      return {
        label:
          normalized === 'pending'
            ? 'Pending'
            : 'In Progress',

        background: COLORS.warningLight,

        color: COLORS.warning,

        icon: 'clock-outline',
      };

    }

    return {
      label: 'Open',

      background: COLORS.infoLight,

      color: COLORS.info,

      icon: 'message-processing-outline',
    };

  };


  /* ============================================================
     LOAD REQUESTS
  ============================================================ */

  const loadHelpRequests = async (
    isRefresh = false
  ) => {

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {

      const data =
        await fetchMyHelpRequests();

      setHelpRequests(
        Array.isArray(data)
          ? data
          : []
      );

      setError(null);

    } catch (e) {

      setError(
        'Unable to load your support requests.'
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  useEffect(() => {

    loadHelpRequests();

  }, []);


  /* ============================================================
     CREATE TICKET
  ============================================================ */

  const handleAddHelp = async () => {

    const cleanMessage =
      message.trim();

    if (!cleanMessage) return;

    setSubmitting(true);
    setError(null);

    try {

      await createHelpRequest(
        cleanMessage
      );

      setMessage('');

      setTicketModalVisible(false);

      await loadHelpRequests();

    } catch (e) {

      setError(
        'Unable to submit your support request.'
      );

    } finally {

      setSubmitting(false);

    }

  };


  /* ============================================================
     REFRESH
  ============================================================ */

  const onRefresh = () => {

    loadHelpRequests(true);

  };


  /* ============================================================
     FORMAT DATE
  ============================================================ */

  const formatDate = (dateValue) => {

    if (!dateValue) {
      return 'Date unavailable';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleString(
      undefined,
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );

  };


  /* ============================================================
     RENDER TICKET
  ============================================================ */

  const renderTicket = ({ item }) => {

    const status =
      getStatusMeta(item?.status);

    return (

      <TouchableOpacity
        style={styles.ticketCard}
        activeOpacity={0.8}
        onPress={() => {

          setSelectedTicket(item);

          setTicketDetailVisible(true);

        }}
      >

        <View
          style={[
            styles.ticketIconContainer,
            {
              backgroundColor:
                status.background,
            },
          ]}
        >

          <MaterialCommunityIcons
            name={status.icon}
            size={24}
            color={status.color}
          />

        </View>


        <View style={styles.ticketContent}>

          <View style={styles.ticketTopRow}>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    status.background,
                },
              ]}
            >

              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      status.color,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      status.color,
                  },
                ]}
              >

                {status.label}

              </Text>

            </View>


            <MaterialCommunityIcons
              name="chevron-right"
              size={21}
              color={COLORS.textMuted}
            />

          </View>


          <Text
            style={styles.ticketMessage}
            numberOfLines={2}
          >

            {item?.message ||
              'Support request'}

          </Text>


          <View style={styles.ticketDateRow}>

            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={13}
              color={COLORS.textMuted}
            />

            <Text style={styles.ticketDate}>

              {formatDate(
                item?.createdAt
              )}

            </Text>

          </View>

        </View>

      </TouchableOpacity>

    );

  };


  /* ============================================================
     MAIN UI
  ============================================================ */

  return (

    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >

      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />


      <View style={styles.root}>

        <AppHeader
          title="Help & Support"
          navigation={navigation}
          showBack
        />


        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          {/* =================================================
              HERO
          ================================================= */}

          <LinearGradient
            colors={[
              COLORS.primaryDark,
              COLORS.primary,
              COLORS.primaryMedium,
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={styles.heroCard}
          >

            <View style={styles.heroTopRow}>

              <View
                style={
                  styles.heroIconContainer
                }
              >

                <MaterialCommunityIcons
                  name="headset"
                  size={30}
                  color={COLORS.white}
                />

              </View>


              <View style={styles.heroTextWrap}>

                <Text style={styles.heroTitle}>

                  How can we help?

                </Text>

                <Text
                  style={styles.heroDescription}
                >

                  Facing an issue? Send us a
                  support request and our team
                  will assist you.

                </Text>

              </View>

            </View>


            <TouchableOpacity
              style={styles.createTicketButton}
              activeOpacity={0.85}
              onPress={() => {

                setError(null);

                setTicketModalVisible(true);

              }}
            >

              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={COLORS.primary}
              />

              <Text
                style={
                  styles.createTicketButtonText
                }
              >

                Create Support Ticket

              </Text>

            </TouchableOpacity>

          </LinearGradient>


          {/* =================================================
              ERROR
          ================================================= */}

          {!!error && (

            <View style={styles.errorCard}>

              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={19}
                color={COLORS.danger}
              />

              <Text style={styles.errorText}>

                {error}

              </Text>

            </View>

          )}


          {/* =================================================
              REQUEST HEADER
          ================================================= */}

          <View style={styles.sectionHeader}>

            <View>

              <Text style={styles.sectionTitle}>

                My Requests

              </Text>

              <Text style={styles.sectionSubtitle}>

                Track your support tickets

              </Text>

            </View>


            {!loading && (

              <View style={styles.ticketCountBadge}>

                <Text
                  style={
                    styles.ticketCountText
                  }
                >

                  {helpRequests.length}

                </Text>

              </View>

            )}

          </View>


          {/* =================================================
              LIST
          ================================================= */}

          {loading ? (

            <View style={styles.loadingContainer}>

              <ActivityIndicator
                size="large"
                color={COLORS.primary}
              />

              <Text style={styles.loadingText}>

                Loading support requests...

              </Text>

            </View>

          ) : (

            <FlatList
              data={helpRequests}
              renderItem={renderTicket}
              keyExtractor={(
                item,
                index
              ) =>
                String(
                  item?._id ||
                  item?.id ||
                  index
                )
              }
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                helpRequests.length === 0
                  ? styles.emptyListContent
                  : styles.listContent
              }
              refreshControl={

                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />

              }
              ListEmptyComponent={

                <View style={styles.emptyContainer}>

                  <View style={styles.emptyIconWrap}>

                    <MaterialCommunityIcons
                      name="message-text-outline"
                      size={38}
                      color={COLORS.primary}
                    />

                  </View>

                  <Text style={styles.emptyTitle}>

                    No support requests

                  </Text>

                  <Text
                    style={styles.emptyDescription}
                  >

                    You haven't created any
                    support tickets yet. If you
                    need help, create a new
                    request.

                  </Text>


                  <TouchableOpacity
                    style={styles.emptyButton}
                    activeOpacity={0.85}
                    onPress={() => {

                      setError(null);

                      setTicketModalVisible(
                        true
                      );

                    }}
                  >

                    <MaterialCommunityIcons
                      name="plus"
                      size={18}
                      color={COLORS.white}
                    />

                    <Text
                      style={
                        styles.emptyButtonText
                      }
                    >

                      Create Ticket

                    </Text>

                  </TouchableOpacity>

                </View>

              }
            />

          )}

        </KeyboardAvoidingView>


        {/* ===================================================
            CREATE TICKET MODAL
        =================================================== */}

        <Modal
          visible={ticketModalVisible}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() =>
            !submitting &&
            setTicketModalVisible(false)
          }
        >

          <View style={styles.modalOverlay}>

            <KeyboardAvoidingView
              style={styles.modalKeyboardView}
              behavior={
                Platform.OS === 'ios'
                  ? 'padding'
                  : undefined
              }
            >

              <View style={styles.createModalCard}>

                <View style={styles.modalHandle} />


                <View style={styles.modalHeader}>

                  <View
                    style={
                      styles.modalTitleContainer
                    }
                  >

                    <View
                      style={
                        styles.modalIconContainer
                      }
                    >

                      <MaterialCommunityIcons
                        name="message-plus-outline"
                        size={24}
                        color={COLORS.primary}
                      />

                    </View>


                    <View style={{ flex: 1 }}>

                      <Text
                        style={styles.modalTitle}
                      >

                        Create Support Ticket

                      </Text>

                      <Text
                        style={
                          styles.modalSubtitle
                        }
                      >

                        Tell us what you need help
                        with

                      </Text>

                    </View>

                  </View>


                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    disabled={submitting}
                    onPress={() =>
                      setTicketModalVisible(
                        false
                      )
                    }
                  >

                    <MaterialCommunityIcons
                      name="close"
                      size={21}
                      color={
                        COLORS.textSecondary
                      }
                    />

                  </TouchableOpacity>

                </View>


                <View style={styles.inputHeaderRow}>

                  <Text style={styles.inputLabel}>

                    Describe your issue

                  </Text>

                  <Text style={styles.characterCount}>

                    {message.length}/1000

                  </Text>

                </View>


                <View style={styles.inputContainer}>

                  <TextInput
                    style={styles.messageInput}
                    placeholder={
                      'Explain your issue in detail. Include any relevant information that may help our support team...'
                    }
                    placeholderTextColor={
                      COLORS.textMuted
                    }
                    value={message}
                    onChangeText={(value) => {

                      if (
                        value.length <= 1000
                      ) {

                        setMessage(value);

                      }

                    }}
                    multiline
                    textAlignVertical="top"
                    editable={!submitting}
                  />

                </View>


                {!!error && (

                  <View
                    style={
                      styles.modalErrorContainer
                    }
                  >

                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={17}
                      color={COLORS.danger}
                    />

                    <Text
                      style={
                        styles.modalErrorText
                      }
                    >

                      {error}

                    </Text>

                  </View>

                )}


                <View style={styles.modalActions}>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    disabled={submitting}
                    onPress={() =>
                      setTicketModalVisible(
                        false
                      )
                    }
                  >

                    <Text
                      style={
                        styles.cancelButtonText
                      }
                    >

                      Cancel

                    </Text>

                  </TouchableOpacity>


                  <TouchableOpacity
                    style={[
                      styles.submitButton,

                      (
                        submitting ||
                        !message.trim()
                      ) &&
                      styles.submitButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={handleAddHelp}
                    disabled={
                      submitting ||
                      !message.trim()
                    }
                  >

                    {submitting ? (

                      <ActivityIndicator
                        size="small"
                        color={COLORS.white}
                      />

                    ) : (

                      <>

                        <MaterialCommunityIcons
                          name="send-outline"
                          size={18}
                          color={COLORS.white}
                        />

                        <Text
                          style={
                            styles.submitButtonText
                          }
                        >

                          Submit Ticket

                        </Text>

                      </>

                    )}

                  </TouchableOpacity>

                </View>

              </View>

            </KeyboardAvoidingView>

          </View>

        </Modal>


        {/* ===================================================
            TICKET DETAILS MODAL
        =================================================== */}

        <Modal
          visible={ticketDetailVisible}
          animationType="fade"
          transparent
          statusBarTranslucent
          onRequestClose={() =>
            setTicketDetailVisible(false)
          }
        >

          <View style={styles.detailOverlay}>

            <View style={styles.detailCard}>

              {selectedTicket && (() => {

                const status =
                  getStatusMeta(
                    selectedTicket.status
                  );

                return (

                  <>

                    <View
                      style={
                        styles.detailHeader
                      }
                    >

                      <View
                        style={[
                          styles.detailIcon,
                          {
                            backgroundColor:
                              status.background,
                          },
                        ]}
                      >

                        <MaterialCommunityIcons
                          name={status.icon}
                          size={25}
                          color={status.color}
                        />

                      </View>


                      <View
                        style={
                          styles.detailHeaderText
                        }
                      >

                        <Text
                          style={
                            styles.detailTitle
                          }
                        >

                          Support Ticket

                        </Text>

                        <Text
                          style={
                            styles.detailSubtitle
                          }
                        >

                          Ticket information

                        </Text>

                      </View>


                      <TouchableOpacity
                        style={
                          styles.detailCloseButton
                        }
                        onPress={() =>
                          setTicketDetailVisible(
                            false
                          )
                        }
                      >

                        <MaterialCommunityIcons
                          name="close"
                          size={20}
                          color={
                            COLORS.textSecondary
                          }
                        />

                      </TouchableOpacity>

                    </View>


                    <View
                      style={
                        styles.detailDivider
                      }
                    />


                    <View
                      style={
                        styles.detailStatusRow
                      }
                    >

                      <Text
                        style={
                          styles.detailLabel
                        }
                      >

                        STATUS

                      </Text>


                      <View
                        style={[
                          styles.detailStatusBadge,
                          {
                            backgroundColor:
                              status.background,
                          },
                        ]}
                      >

                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                status.color,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.detailStatusText,
                            {
                              color:
                                status.color,
                            },
                          ]}
                        >

                          {status.label}

                        </Text>

                      </View>

                    </View>


                    <View
                      style={
                        styles.detailInfoBlock
                      }
                    >

                      <View
                        style={
                          styles.detailInfoIcon
                        }
                      >

                        <MaterialCommunityIcons
                          name="calendar-blank-outline"
                          size={18}
                          color={COLORS.primary}
                        />

                      </View>


                      <View style={{ flex: 1 }}>

                        <Text
                          style={
                            styles.detailLabel
                          }
                        >

                          CREATED AT

                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >

                          {formatDate(
                            selectedTicket.createdAt
                          )}

                        </Text>

                      </View>

                    </View>


                    <View
                      style={
                        styles.messageDetailContainer
                      }
                    >

                      <Text
                        style={
                          styles.detailLabel
                        }
                      >

                        YOUR MESSAGE

                      </Text>

                      <Text
                        style={
                          styles.detailMessage
                        }
                      >

                        {selectedTicket.message ||
                          'No message available.'}

                      </Text>

                    </View>


                    <TouchableOpacity
                      style={
                        styles.detailDoneButton
                      }
                      activeOpacity={0.85}
                      onPress={() =>
                        setTicketDetailVisible(
                          false
                        )
                      }
                    >

                      <Text
                        style={
                          styles.detailDoneButtonText
                        }
                      >

                        Close

                      </Text>

                    </TouchableOpacity>

                  </>

                );

              })()}

            </View>

          </View>

        </Modal>

      </View>

    </SafeAreaView>

  );

}


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },


  /* =========================================================
     HERO
  ========================================================= */

  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    padding: 18,

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,

    elevation: 7,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,

    backgroundColor:
      'rgba(255,255,255,0.16)',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  heroTextWrap: {
    flex: 1,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
  },

  heroDescription: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 5,
  },

  createTicketButton: {
    minHeight: 48,
    marginTop: 18,

    borderRadius: 13,

    backgroundColor: COLORS.white,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,
  },

  createTicketButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },


  /* =========================================================
     ERROR
  ========================================================= */

  errorCard: {
    marginHorizontal: 16,
    marginTop: 12,

    borderRadius: 12,

    backgroundColor: COLORS.dangerLight,

    paddingHorizontal: 13,
    paddingVertical: 11,

    flexDirection: 'row',
    alignItems: 'center',
  },

  errorText: {
    flex: 1,

    color: COLORS.danger,

    fontSize: 12,
    fontWeight: '600',

    marginLeft: 8,
  },


  /* =========================================================
     SECTION
  ========================================================= */

  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },

  ticketCountBadge: {
    minWidth: 34,
    height: 34,

    paddingHorizontal: 9,

    borderRadius: 11,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  ticketCountText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
  },


  /* =========================================================
     LIST
  ========================================================= */

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  ticketCard: {
    backgroundColor: COLORS.white,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 13,

    marginBottom: 11,

    flexDirection: 'row',
    alignItems: 'flex-start',

    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 2,
  },

  ticketIconContainer: {
    width: 46,
    height: 46,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  ticketContent: {
    flex: 1,
  },

  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 7,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 999,

    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    marginRight: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  ticketMessage: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '650',
    lineHeight: 20,
  },

  ticketDateRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 8,
  },

  ticketDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',

    marginLeft: 5,
  },


  /* =========================================================
     LOADING
  ========================================================= */

  loadingContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: COLORS.textSecondary,

    fontSize: 13,
    fontWeight: '600',

    marginTop: 12,
  },


  /* =========================================================
     EMPTY
  ========================================================= */

  emptyContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 36,
    paddingBottom: 60,
  },

  emptyIconWrap: {
    width: 78,
    height: 78,

    borderRadius: 25,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 17,
  },

  emptyTitle: {
    color: COLORS.text,

    fontSize: 19,
    fontWeight: '900',
  },

  emptyDescription: {
    color: COLORS.textSecondary,

    fontSize: 13,
    fontWeight: '500',

    lineHeight: 20,

    textAlign: 'center',

    marginTop: 7,
  },

  emptyButton: {
    marginTop: 20,

    minHeight: 44,

    paddingHorizontal: 20,

    borderRadius: 12,

    backgroundColor: COLORS.primary,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 6,
  },

  emptyButtonText: {
    color: COLORS.white,

    fontSize: 13,
    fontWeight: '800',
  },


  /* =========================================================
     CREATE MODAL
  ========================================================= */

  modalOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(15,23,42,0.48)',

    justifyContent: 'flex-end',
  },

  modalKeyboardView: {
    justifyContent: 'flex-end',
  },

  createModalCard: {
    backgroundColor: COLORS.white,

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    paddingHorizontal: 18,
    paddingTop: 10,

    paddingBottom:
      Platform.OS === 'ios'
        ? 30
        : 20,

    minHeight: 500,
  },

  modalHandle: {
    width: 42,
    height: 4,

    borderRadius: 2,

    backgroundColor: '#CBD5E1',

    alignSelf: 'center',

    marginBottom: 17,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 22,
  },

  modalTitleContainer: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',
  },

  modalIconContainer: {
    width: 48,
    height: 48,

    borderRadius: 15,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  modalTitle: {
    color: COLORS.text,

    fontSize: 18,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: COLORS.textMuted,

    fontSize: 12,
    fontWeight: '500',

    marginTop: 3,
  },

  modalCloseButton: {
    width: 38,
    height: 38,

    borderRadius: 12,

    backgroundColor: '#F1F5F9',

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 8,
  },

  inputHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 8,
  },

  inputLabel: {
    color: COLORS.text,

    fontSize: 13,
    fontWeight: '800',
  },

  characterCount: {
    color: COLORS.textMuted,

    fontSize: 11,
    fontWeight: '600',
  },

  inputContainer: {
    minHeight: 190,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: '#FAFAFC',
  },

  messageInput: {
    minHeight: 190,

    paddingHorizontal: 14,
    paddingVertical: 13,

    color: COLORS.text,

    fontSize: 14,
    fontWeight: '500',

    lineHeight: 21,
  },

  modalErrorContainer: {
    marginTop: 10,

    flexDirection: 'row',
    alignItems: 'center',
  },

  modalErrorText: {
    flex: 1,

    color: COLORS.danger,

    fontSize: 12,
    fontWeight: '600',

    marginLeft: 6,
  },

  modalActions: {
    flexDirection: 'row',

    marginTop: 18,

    gap: 10,
  },

  cancelButton: {
    flex: 1,

    minHeight: 48,

    borderRadius: 13,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: '#F8FAFC',

    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.textSecondary,

    fontSize: 14,
    fontWeight: '800',
  },

  submitButton: {
    flex: 1.5,

    minHeight: 48,

    borderRadius: 13,

    backgroundColor: COLORS.primary,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,
  },

  submitButtonDisabled: {
    opacity: 0.5,
  },

  submitButtonText: {
    color: COLORS.white,

    fontSize: 14,
    fontWeight: '800',
  },


  /* =========================================================
     DETAIL MODAL
  ========================================================= */

  detailOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(15,23,42,0.55)',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 18,
  },

  detailCard: {
    width: '100%',

    maxWidth: 500,

    backgroundColor: COLORS.white,

    borderRadius: 24,

    padding: 18,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,

    elevation: 12,
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailIcon: {
    width: 48,
    height: 48,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  detailHeaderText: {
    flex: 1,
  },

  detailTitle: {
    color: COLORS.text,

    fontSize: 18,
    fontWeight: '900',
  },

  detailSubtitle: {
    color: COLORS.textMuted,

    fontSize: 12,
    fontWeight: '500',

    marginTop: 2,
  },

  detailCloseButton: {
    width: 36,
    height: 36,

    borderRadius: 11,

    backgroundColor: '#F1F5F9',

    alignItems: 'center',
    justifyContent: 'center',
  },

  detailDivider: {
    height: 1,

    backgroundColor: COLORS.border,

    marginVertical: 17,
  },

  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 16,
  },

  detailLabel: {
    color: COLORS.textMuted,

    fontSize: 10,
    fontWeight: '800',

    letterSpacing: 0.7,
  },

  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 999,

    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  detailStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  detailInfoBlock: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.primarySoft,

    borderRadius: 14,

    padding: 12,
  },

  detailInfoIcon: {
    width: 38,
    height: 38,

    borderRadius: 11,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  detailValue: {
    color: COLORS.text,

    fontSize: 13,
    fontWeight: '700',

    marginTop: 4,
  },

  messageDetailContainer: {
    marginTop: 16,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: '#FAFAFC',

    padding: 13,
  },

  detailMessage: {
    color: COLORS.text,

    fontSize: 14,
    fontWeight: '500',

    lineHeight: 21,

    marginTop: 8,
  },

  detailDoneButton: {
    minHeight: 47,

    marginTop: 18,

    borderRadius: 13,

    backgroundColor: COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  detailDoneButtonText: {
    color: COLORS.white,

    fontSize: 14,
    fontWeight: '800',
  },

});