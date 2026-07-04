import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  Picker,
} from '@react-native-picker/picker';

import apiClient from '../../api/client';


/* ============================================================
   COLORS
============================================================ */

const COLORS = {
  primary: '#6D28D9',

  primaryDark: '#21105D',

  primaryLight: '#F3E8FF',

  primarySoft: '#FAF8FF',

  background: '#FBFBFE',

  white: '#FFFFFF',

  text: '#111827',

  muted: '#6B7280',

  lightMuted: '#9CA3AF',

  border: '#E8E3F3',

  success: '#059669',

  successLight: '#ECFDF5',

  blue: '#2563EB',

  blueLight: '#EFF6FF',

  orange: '#F97316',

  orangeLight: '#FFF7ED',

  pink: '#DB2777',

  pinkLight: '#FDF2F8',

  error: '#DC2626',

  errorLight: '#FEF2F2',
};


const TARGET_EXAMS = [
  'JEE',

  'NEET',

  'FOUNDATION',

  'CUET',

  'NDA',
];


/* ============================================================
   MY PROFILE
============================================================ */

export default function MyProfileScreen({
  navigation,
}) {
  /* =========================================================
     STATE
  ========================================================= */

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [editMode, setEditMode] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    name: '',

    class: '',

    targetExam: '',

    mobile: '',

    address: '',
  });


  /* =========================================================
     FETCH PROFILE
  ========================================================= */

  const fetchProfile = async (
    isRefresh = false
  ) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res =
        await apiClient.get(
          '/auth/m/me'
        );

      setProfile(res.data);

      setForm({
        name: res.data.name || '',

        class: res.data.class || '',

        targetExam:
          res.data.targetExam || '',

        mobile:
          res.data.mobile || '',

        address:
          res.data.address || '',
      });

      setError(null);
    } catch (err) {
      console.log(
        'PROFILE FETCH ERROR:',
        err
      );

      setError(
        'Failed to load your profile.'
      );
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchProfile();
  }, []);


  /* =========================================================
     REFRESH
  ========================================================= */

  const onRefresh = () => {
    fetchProfile(true);
  };


  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (
    key,
    value
  ) => {
    setForm(current => ({
      ...current,

      [key]: value,
    }));
  };


  /* =========================================================
     CANCEL EDIT
  ========================================================= */

  const handleCancelEdit = () => {
    if (profile) {
      setForm({
        name: profile.name || '',

        class: profile.class || '',

        targetExam:
          profile.targetExam || '',

        mobile:
          profile.mobile || '',

        address:
          profile.address || '',
      });
    }

    setEditMode(false);
  };


  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert(
        'Name Required',
        'Please enter your name.'
      );

      return;
    }

    setSaving(true);

    try {
      await apiClient.put(
        '/auth/student/profile',
        {
          name: form.name.trim(),

          class: form.class.trim(),

          targetExam:
            form.targetExam,

          mobile: form.mobile.trim(),

          address:
            form.address.trim(),
        }
      );

      setProfile(current => ({
        ...current,

        ...form,

        name: form.name.trim(),

        class: form.class.trim(),

        mobile: form.mobile.trim(),

        address:
          form.address.trim(),
      }));

      setEditMode(false);

      Alert.alert(
        'Profile Updated 🎉',
        'Your profile has been updated successfully.'
      );
    } catch (e) {
      console.log(
        'PROFILE UPDATE ERROR:',
        e
      );

      Alert.alert(
        'Unable to Update',
        e?.response?.data?.message ||
          'Failed to update your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatJoinedDate = date => {
    if (!date) {
      return '-';
    }

    try {
      return new Date(
        date
      ).toLocaleDateString('en-IN', {
        day: '2-digit',

        month: 'short',

        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };


  /* =========================================================
     PROFILE INITIAL
  ========================================================= */

  const getProfileInitial = () => {
    const name =
      profile?.name?.trim();

    if (!name) {
      return 'S';
    }

    return name
      .charAt(0)
      .toUpperCase();
  };


  /* =========================================================
     DETAIL CARD
  ========================================================= */

  const DetailCard = ({
    icon,
    label,
    value,
    iconColor,
    iconBackground,
  }) => {
    return (
      <View style={styles.detailCard}>
        <View
          style={[
            styles.detailIconContainer,

            {
              backgroundColor:
                iconBackground,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={iconColor}
          />
        </View>

        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
          numberOfLines={1}
        >
          {value || '-'}
        </Text>
      </View>
    );
  };


  /* =========================================================
     INFORMATION ROW
  ========================================================= */

  const InformationRow = ({
    icon,
    label,
    value,
    iconColor = COLORS.primary,
  }) => {
    return (
      <View style={styles.informationRow}>
        <View
          style={
            styles.informationIconContainer
          }
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={iconColor}
          />
        </View>

        <View
          style={styles.informationContent}
        >
          <Text
            style={styles.informationLabel}
          >
            {label}
          </Text>

          <Text
            style={styles.informationValue}
          >
            {value || '-'}
          </Text>
        </View>
      </View>
    );
  };


  /* =========================================================
     EDIT FIELD
  ========================================================= */

  const EditField = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  }) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {label}
        </Text>

        <View
          style={[
            styles.inputContainer,

            multiline &&
              styles.multilineInputContainer,
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={COLORS.primary}
            style={
              multiline
                ? styles.multilineIcon
                : null
            }
          />

          <TextInput
            style={[
              styles.input,

              multiline &&
                styles.multilineInput,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={
              COLORS.lightMuted
            }
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={
              multiline ? 'top' : 'center'
            }
          />
        </View>
      </View>
    );
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.background
        }
      />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        {/* ===================================================
            BACKGROUND DECORATION
        =================================================== */}

        <View
          style={styles.topPurpleCircle}
        />

        <View
          style={styles.smallPurpleCircle}
        />


        {/* ===================================================
            HEADER
        =================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              navigation.goBack()
            }
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={23}
              color={COLORS.primaryDark}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            My Profile
          </Text>

          <TouchableOpacity
            style={[
              styles.headerButton,

              editMode &&
                styles.activeHeaderButton,
            ]}
            onPress={() => {
              if (editMode) {
                handleCancelEdit();
              } else {
                setEditMode(true);
              }
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={
                editMode
                  ? 'close'
                  : 'pencil-outline'
              }
              size={21}
              color={
                editMode
                  ? '#FFFFFF'
                  : COLORS.primary
              }
            />
          </TouchableOpacity>
        </View>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <View
              style={styles.loadingContainer}
            >
              <View
                style={styles.loadingIcon}
              >
                <Image
                  source={require(
                    '../../../assets/icon.png'
                  )}
                  style={styles.loadingLogo}
                  resizeMode="contain"
                />
              </View>

              <ActivityIndicator
                size="large"
                color={COLORS.primary}
                style={{ marginTop: 22 }}
              />

              <Text
                style={styles.loadingText}
              >
                Loading your profile...
              </Text>
            </View>
          ) : error ? (
            /* ===============================================
               ERROR
            =============================================== */

            <View
              style={styles.errorContainer}
            >
              <View
                style={styles.errorIcon}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={32}
                  color={COLORS.error}
                />
              </View>

              <Text style={styles.errorTitle}>
                Unable to Load Profile
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={() =>
                  fetchProfile()
                }
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.retryButtonText}
                >
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : profile ? (
            <>
              {/* =============================================
                  PROFILE HERO
              ============================================= */}

              <View style={styles.profileHero}>
                <View
                  style={styles.heroCircleOne}
                />

                <View
                  style={styles.heroCircleTwo}
                />

                <View
                  style={styles.avatarOuter}
                >
                  <View
                    style={styles.avatarContainer}
                  >
                    <Image
                      source={require(
                        '../../../assets/icon.png'
                      )}
                      style={styles.avatarLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View
                    style={styles.onlineBadge}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                <Text style={styles.profileName}>
                  {profile.name ||
                    'Student'}
                </Text>

                <Text
                  style={styles.profileEmail}
                >
                  {profile.email || '-'}
                </Text>

                <View
                  style={styles.studentBadge}
                >
                  <MaterialCommunityIcons
                    name="school-outline"
                    size={15}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.studentBadgeText
                    }
                  >
                    {profile.role
                      ? String(
                          profile.role
                        ).toUpperCase()
                      : 'STUDENT'}
                  </Text>
                </View>
              </View>


              {/* =============================================
                  EDIT MODE
              ============================================= */}

              {editMode ? (
                <View style={styles.editCard}>
                  <View
                    style={styles.sectionTitleRow}
                  >
                    <View
                      style={
                        styles.sectionIconContainer
                      }
                    >
                      <MaterialCommunityIcons
                        name="account-edit-outline"
                        size={21}
                        color={COLORS.primary}
                      />
                    </View>

                    <View>
                      <Text
                        style={styles.sectionTitle}
                      >
                        Edit Profile
                      </Text>

                      <Text
                        style={
                          styles.sectionSubtitle
                        }
                      >
                        Update your personal
                        information
                      </Text>
                    </View>
                  </View>


                  <EditField
                    label="Full Name"
                    icon="account-outline"
                    value={form.name}
                    onChangeText={value =>
                      handleChange(
                        'name',
                        value
                      )
                    }
                    placeholder="Enter your name"
                  />


                  <EditField
                    label="Class"
                    icon="school-outline"
                    value={form.class}
                    onChangeText={value =>
                      handleChange(
                        'class',
                        value
                      )
                    }
                    placeholder="Example: Class 12"
                  />


                  {/* TARGET EXAM */}

                  <View
                    style={styles.fieldContainer}
                  >
                    <Text
                      style={styles.fieldLabel}
                    >
                      Target Exam
                    </Text>

                    <View
                      style={
                        styles.pickerContainer
                      }
                    >
                      <MaterialCommunityIcons
                        name="target"
                        size={21}
                        color={COLORS.primary}
                      />

                      <View
                        style={styles.pickerWrapper}
                      >
                        <Picker
                          selectedValue={
                            form.targetExam
                          }
                          onValueChange={value =>
                            handleChange(
                              'targetExam',
                              value
                            )
                          }
                          style={styles.picker}
                          dropdownIconColor={
                            COLORS.primary
                          }
                        >
                          <Picker.Item
                            label="Select Target Exam"
                            value=""
                            color={
                              COLORS.lightMuted
                            }
                          />

                          {TARGET_EXAMS.map(
                            exam => (
                              <Picker.Item
                                key={exam}
                                label={exam}
                                value={exam}
                              />
                            )
                          )}
                        </Picker>
                      </View>
                    </View>
                  </View>


                  <EditField
                    label="Mobile Number"
                    icon="phone-outline"
                    value={form.mobile}
                    onChangeText={value =>
                      handleChange(
                        'mobile',
                        value
                      )
                    }
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                  />


                  <EditField
                    label="Address"
                    icon="map-marker-outline"
                    value={form.address}
                    onChangeText={value =>
                      handleChange(
                        'address',
                        value
                      )
                    }
                    placeholder="Enter your address"
                    multiline
                  />


                  {/* SAVE BUTTON */}

                  <TouchableOpacity
                    style={[
                      styles.saveButton,

                      saving &&
                        styles.disabledButton,
                    ]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.85}
                  >
                    {saving ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="content-save-outline"
                          size={21}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.saveButtonText
                          }
                        >
                          Save Changes
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>


                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                    disabled={saving}
                  >
                    <Text
                      style={
                        styles.cancelButtonText
                      }
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* ===========================================
                      LEARNING PROFILE
                  =========================================== */}

                  <View
                    style={styles.sectionHeader}
                  >
                    <Text
                      style={styles.mainSectionTitle}
                    >
                      Learning Profile
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        setEditMode(true)
                      }
                    >
                      <Text
                        style={
                          styles.editSectionText
                        }
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>


                  <View style={styles.detailGrid}>
                    <DetailCard
                      icon="school-outline"
                      label="Class"
                      value={
                        profile.class || '-'
                      }
                      iconColor="#7C3AED"
                      iconBackground="#F3E8FF"
                    />

                    <DetailCard
                      icon="target"
                      label="Target Exam"
                      value={
                        profile.targetExam ||
                        '-'
                      }
                      iconColor="#2563EB"
                      iconBackground="#EFF6FF"
                    />

                    <DetailCard
                      icon="phone-outline"
                      label="Mobile"
                      value={
                        profile.mobile || '-'
                      }
                      iconColor="#059669"
                      iconBackground="#ECFDF5"
                    />

                    <DetailCard
                      icon="cart-check"
                      label="Test Series"
                      value={
                        Array.isArray(
                          profile.purchasedSeries
                        )
                          ? `${profile.purchasedSeries.length} Purchased`
                          : '0 Purchased'
                      }
                      iconColor="#F97316"
                      iconBackground="#FFF7ED"
                    />
                  </View>


                  {/* ===========================================
                      ACCOUNT INFORMATION
                  =========================================== */}

                  <View
                    style={[
                      styles.sectionHeader,

                      styles.accountSectionHeader,
                    ]}
                  >
                    <Text
                      style={styles.mainSectionTitle}
                    >
                      Account Information
                    </Text>
                  </View>


                  <View
                    style={
                      styles.informationCard
                    }
                  >
                    <InformationRow
                      icon="email-outline"
                      label="Email Address"
                      value={profile.email}
                    />

                    <View
                      style={
                        styles.informationDivider
                      }
                    />

                    <InformationRow
                      icon="map-marker-outline"
                      label="Address"
                      value={profile.address}
                      iconColor="#DB2777"
                    />

                    <View
                      style={
                        styles.informationDivider
                      }
                    />

                    <InformationRow
                      icon="calendar-check-outline"
                      label="Joined Garud Classes"
                      value={formatJoinedDate(
                        profile.createdAt
                      )}
                      iconColor="#F97316"
                    />
                  </View>


                  {/* ===========================================
                      PREPARATION CARD
                  =========================================== */}

                  <View
                    style={styles.preparationCard}
                  >
                    <View
                      style={
                        styles.preparationIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="rocket-launch-outline"
                        size={28}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.preparationContent
                      }
                    >
                      <Text
                        style={
                          styles.preparationTitle
                        }
                      >
                        Keep Going! 🚀
                      </Text>

                      <Text
                        style={
                          styles.preparationText
                        }
                      >
                        Consistency is the key to
                        achieving your dream exam.
                      </Text>
                    </View>
                  </View>
                </>
              )}


              {/* =============================================
                  FOOTER
              ============================================= */}

              <View style={styles.footer}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={15}
                  color={COLORS.primary}
                />

                <Text style={styles.footerText}>
                  Secure Student Profile
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor:
      COLORS.background,
  },


  root: {
    flex: 1,

    backgroundColor:
      COLORS.background,
  },


  /* =========================================================
     BACKGROUND
  ========================================================= */

  topPurpleCircle: {
    position: 'absolute',

    width: 260,

    height: 260,

    borderRadius: 130,

    backgroundColor: '#EDE9FE',

    top: -150,

    right: -110,

    opacity: 0.7,
  },


  smallPurpleCircle: {
    position: 'absolute',

    width: 100,

    height: 100,

    borderRadius: 50,

    backgroundColor: '#DDD6FE',

    top: 280,

    left: -70,

    opacity: 0.25,
  },


  /* =========================================================
     HEADER
  ========================================================= */

  header: {
    height: 64,

    paddingHorizontal: 20,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    zIndex: 10,
  },


  headerButton: {
    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#EEEAFB',

    shadowColor: '#312E81',

    shadowOffset: {
      width: 0,

      height: 5,
    },

    shadowOpacity: 0.06,

    shadowRadius: 10,

    elevation: 3,
  },


  activeHeaderButton: {
    backgroundColor: COLORS.primary,

    borderColor: COLORS.primary,
  },


  headerTitle: {
    color: COLORS.text,

    fontSize: 17,

    fontWeight: '900',

    letterSpacing: -0.3,
  },


  /* =========================================================
     SCROLL
  ========================================================= */

  scrollView: {
    flex: 1,
  },


  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 20,

    paddingTop: 12,

    paddingBottom: 45,
  },


  /* =========================================================
     LOADING
  ========================================================= */

  loadingContainer: {
    flex: 1,

    minHeight: 500,

    alignItems: 'center',

    justifyContent: 'center',
  },


  loadingIcon: {
    width: 90,

    height: 90,

    borderRadius: 28,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#EEEAFB',
  },


  loadingLogo: {
    width: 72,

    height: 72,
  },


  loadingText: {
    marginTop: 13,

    color: COLORS.muted,

    fontSize: 13,

    fontWeight: '600',
  },


  /* =========================================================
     ERROR
  ========================================================= */

  errorContainer: {
    minHeight: 500,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,
  },


  errorIcon: {
    width: 70,

    height: 70,

    borderRadius: 22,

    backgroundColor: COLORS.errorLight,

    alignItems: 'center',

    justifyContent: 'center',
  },


  errorTitle: {
    marginTop: 18,

    color: COLORS.text,

    fontSize: 19,

    fontWeight: '900',
  },


  errorText: {
    marginTop: 7,

    color: COLORS.muted,

    fontSize: 13,

    lineHeight: 20,

    textAlign: 'center',
  },


  retryButton: {
    height: 50,

    marginTop: 22,

    paddingHorizontal: 25,

    borderRadius: 16,

    backgroundColor: COLORS.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,
  },


  retryButtonText: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '800',
  },


  /* =========================================================
     PROFILE HERO
  ========================================================= */

  profileHero: {
    minHeight: 250,

    backgroundColor:
      COLORS.primaryDark,

    borderRadius: 30,

    alignItems: 'center',

    paddingTop: 25,

    paddingBottom: 24,

    paddingHorizontal: 20,

    overflow: 'hidden',

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,

      height: 12,
    },

    shadowOpacity: 0.18,

    shadowRadius: 22,

    elevation: 8,
  },


  heroCircleOne: {
    position: 'absolute',

    width: 190,

    height: 190,

    borderRadius: 95,

    backgroundColor: '#6D28D9',

    top: -100,

    right: -70,

    opacity: 0.6,
  },


  heroCircleTwo: {
    position: 'absolute',

    width: 140,

    height: 140,

    borderRadius: 70,

    backgroundColor: '#8B5CF6',

    bottom: -90,

    left: -40,

    opacity: 0.35,
  },


  avatarOuter: {
    position: 'relative',
  },


  avatarContainer: {
    width: 96,

    height: 96,

    borderRadius: 31,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 4,

    borderColor:
      'rgba(255,255,255,0.25)',
  },


  avatarLogo: {
    width: 78,

    height: 78,
  },


  onlineBadge: {
    position: 'absolute',

    bottom: -3,

    right: -3,

    width: 27,

    height: 27,

    borderRadius: 14,

    backgroundColor: '#10B981',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 3,

    borderColor: COLORS.primaryDark,
  },


  profileName: {
    marginTop: 15,

    color: '#FFFFFF',

    fontSize: 23,

    fontWeight: '900',

    textAlign: 'center',

    letterSpacing: -0.5,
  },


  profileEmail: {
    marginTop: 4,

    color: '#DDD6FE',

    fontSize: 13,

    fontWeight: '500',

    textAlign: 'center',
  },


  studentBadge: {
    marginTop: 13,

    paddingHorizontal: 14,

    height: 31,

    borderRadius: 16,

    backgroundColor:
      'rgba(255,255,255,0.15)',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.18)',
  },


  studentBadgeText: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '900',

    letterSpacing: 0.7,
  },


  /* =========================================================
     SECTION
  ========================================================= */

  sectionHeader: {
    marginTop: 27,

    marginBottom: 13,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },


  accountSectionHeader: {
    marginTop: 16,
  },


  mainSectionTitle: {
    color: COLORS.text,

    fontSize: 18,

    fontWeight: '900',

    letterSpacing: -0.4,
  },


  editSectionText: {
    color: COLORS.primary,

    fontSize: 13,

    fontWeight: '800',
  },


  /* =========================================================
     DETAIL GRID
  ========================================================= */

  detailGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',
  },


  detailCard: {
    width: '48.3%',

    minHeight: 136,

    backgroundColor: '#FFFFFF',

    borderRadius: 21,

    padding: 15,

    marginBottom: 12,

    borderWidth: 1,

    borderColor: COLORS.border,

    shadowColor: '#312E81',

    shadowOffset: {
      width: 0,

      height: 6,
    },

    shadowOpacity: 0.05,

    shadowRadius: 12,

    elevation: 3,
  },


  detailIconContainer: {
    width: 42,

    height: 42,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 13,
  },


  detailLabel: {
    color: COLORS.muted,

    fontSize: 11,

    fontWeight: '600',
  },


  detailValue: {
    marginTop: 4,

    color: COLORS.text,

    fontSize: 15,

    fontWeight: '900',
  },


  /* =========================================================
     INFORMATION
  ========================================================= */

  informationCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 22,

    paddingHorizontal: 17,

    borderWidth: 1,

    borderColor: COLORS.border,

    shadowColor: '#312E81',

    shadowOffset: {
      width: 0,

      height: 6,
    },

    shadowOpacity: 0.04,

    shadowRadius: 12,

    elevation: 2,
  },


  informationRow: {
    minHeight: 78,

    flexDirection: 'row',

    alignItems: 'center',

    paddingVertical: 13,
  },


  informationIconContainer: {
    width: 44,

    height: 44,

    borderRadius: 15,

    backgroundColor: COLORS.primarySoft,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 13,
  },


  informationContent: {
    flex: 1,
  },


  informationLabel: {
    color: COLORS.muted,

    fontSize: 11,

    fontWeight: '600',
  },


  informationValue: {
    marginTop: 4,

    color: COLORS.text,

    fontSize: 14,

    fontWeight: '800',

    lineHeight: 20,
  },


  informationDivider: {
    height: 1,

    backgroundColor: '#F1F0F6',

    marginLeft: 57,
  },


  /* =========================================================
     PREPARATION
  ========================================================= */

  preparationCard: {
    marginTop: 22,

    minHeight: 105,

    borderRadius: 23,

    backgroundColor: COLORS.primary,

    paddingHorizontal: 18,

    paddingVertical: 18,

    flexDirection: 'row',

    alignItems: 'center',

    shadowColor: COLORS.primary,

    shadowOffset: {
      width: 0,

      height: 8,
    },

    shadowOpacity: 0.2,

    shadowRadius: 15,

    elevation: 6,
  },


  preparationIcon: {
    width: 55,

    height: 55,

    borderRadius: 18,

    backgroundColor:
      'rgba(255,255,255,0.16)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 15,
  },


  preparationContent: {
    flex: 1,
  },


  preparationTitle: {
    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '900',
  },


  preparationText: {
    marginTop: 5,

    color: '#EDE9FE',

    fontSize: 12,

    lineHeight: 18,

    fontWeight: '500',
  },


  /* =========================================================
     EDIT CARD
  ========================================================= */

  editCard: {
    marginTop: 22,

    backgroundColor: '#FFFFFF',

    borderRadius: 27,

    padding: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    shadowColor: '#312E81',

    shadowOffset: {
      width: 0,

      height: 10,
    },

    shadowOpacity: 0.07,

    shadowRadius: 20,

    elevation: 5,
  },


  sectionTitleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 24,
  },


  sectionIconContainer: {
    width: 47,

    height: 47,

    borderRadius: 16,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,
  },


  sectionTitle: {
    color: COLORS.text,

    fontSize: 17,

    fontWeight: '900',
  },


  sectionSubtitle: {
    marginTop: 3,

    color: COLORS.muted,

    fontSize: 11,

    fontWeight: '500',
  },


  fieldContainer: {
    marginBottom: 17,
  },


  fieldLabel: {
    color: COLORS.text,

    fontSize: 12,

    fontWeight: '800',

    marginBottom: 8,
  },


  inputContainer: {
    minHeight: 56,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: '#FAFAFD',

    paddingHorizontal: 15,

    flexDirection: 'row',

    alignItems: 'center',
  },


  multilineInputContainer: {
    minHeight: 105,

    alignItems: 'flex-start',

    paddingTop: 16,
  },


  multilineIcon: {
    marginTop: 1,
  },


  input: {
    flex: 1,

    marginLeft: 11,

    paddingVertical: 14,

    color: COLORS.text,

    fontSize: 14,

    fontWeight: '500',
  },


  multilineInput: {
    minHeight: 80,

    paddingTop: 0,
  },


  pickerContainer: {
    minHeight: 56,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: '#FAFAFD',

    paddingLeft: 15,

    flexDirection: 'row',

    alignItems: 'center',
  },


  pickerWrapper: {
    flex: 1,

    marginLeft: 3,
  },


  picker: {
    color: COLORS.text,

    marginLeft: -5,

    marginRight: -5,
  },


  saveButton: {
    height: 57,

    marginTop: 8,

    borderRadius: 17,

    backgroundColor: COLORS.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,

    shadowColor: COLORS.primary,

    shadowOffset: {
      width: 0,

      height: 8,
    },

    shadowOpacity: 0.25,

    shadowRadius: 15,

    elevation: 6,
  },


  saveButtonText: {
    color: '#FFFFFF',

    fontSize: 15,

    fontWeight: '900',
  },


  disabledButton: {
    opacity: 0.6,
  },


  cancelButton: {
    height: 50,

    marginTop: 12,

    borderRadius: 16,

    backgroundColor:
      COLORS.primarySoft,

    borderWidth: 1,

    borderColor: '#DDD6FE',

    alignItems: 'center',

    justifyContent: 'center',
  },


  cancelButtonText: {
    color: COLORS.primary,

    fontSize: 14,

    fontWeight: '800',
  },


  /* =========================================================
     FOOTER
  ========================================================= */

  footer: {
    marginTop: 25,

    marginBottom: 10,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 5,
  },


  footerText: {
    color: COLORS.muted,

    fontSize: 11,

    fontWeight: '600',
  },
});