import React, {
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  setNewPasswordWithResetToken,
} from '../../api/auth';


/* ============================================================
   COLORS
============================================================ */

const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#21105D',

  primaryLight: '#F3E8FF',
  primarySoft: '#F8F5FF',

  text: '#111827',
  muted: '#6B7280',

  border: '#E8E3F3',

  white: '#FFFFFF',
  background: '#FBFBFE',

  error: '#DC2626',
  errorBackground: '#FEF2F2',

  success: '#059669',
  successBackground: '#ECFDF5',
};


/* ============================================================
   RESET PASSWORD
============================================================ */

export default function ResetPasswordScreen({
  navigation,
  route,
}) {
  const initialIdentifier = String(
    route?.params?.identifier || ''
  ).trim();


  /* =========================================================
     STATE
  ========================================================= */

  const [step, setStep] = useState(1);

  const [
    identifier,
    setIdentifier,
  ] = useState(initialIdentifier);

  const [otp, setOtp] = useState('');

  const [
    resetToken,
    setResetToken,
  ] = useState('');

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [info, setInfo] =
    useState('');


  /* =========================================================
     OTP INPUT REF
  ========================================================= */

  const otpInputRef = useRef(null);


  /* =========================================================
     STEP DATA
  ========================================================= */

  const stepData = useMemo(() => {
    if (step === 1) {
      return {
        icon: 'email-fast-outline',

        title: 'Forgot Password?',

        subtitle:
          "Don't worry! Enter your email and we'll send you a verification code.",
      };
    }

    if (step === 2) {
      return {
        icon: 'shield-key-outline',

        title: 'Verify OTP',

        subtitle:
          'Enter the 6-digit verification code sent to your registered account.',
      };
    }

    return {
      icon: 'lock-reset',

      title: 'Create New Password',

      subtitle:
        'Create a strong password to secure your Garud Classes account.',
    };
  }, [step]);


  /* =========================================================
     PASSWORD STRENGTH
  ========================================================= */

  const passwordStrength = useMemo(() => {
    if (!newPassword) {
      return {
        level: 0,
        label: '',
      };
    }

    let score = 0;

    if (newPassword.length >= 8) {
      score += 1;
    }

    if (/[A-Z]/.test(newPassword)) {
      score += 1;
    }

    if (/[0-9]/.test(newPassword)) {
      score += 1;
    }

    if (
      /[^A-Za-z0-9]/.test(newPassword)
    ) {
      score += 1;
    }

    if (score <= 1) {
      return {
        level: 1,
        label: 'Weak',
      };
    }

    if (score === 2) {
      return {
        level: 2,
        label: 'Fair',
      };
    }

    if (score === 3) {
      return {
        level: 3,
        label: 'Good',
      };
    }

    return {
      level: 4,
      label: 'Strong',
    };
  }, [newPassword]);


  const getStrengthColor = () => {
    switch (passwordStrength.level) {
      case 1:
        return '#EF4444';

      case 2:
        return '#F59E0B';

      case 3:
        return '#3B82F6';

      case 4:
        return '#10B981';

      default:
        return '#E5E7EB';
    }
  };


  /* =========================================================
     REQUEST OTP
  ========================================================= */

  const handleRequestOtp = async () => {
    const value = identifier.trim();

    if (!value) {
      setError(
        'Please enter your email or username.'
      );

      return;
    }

    setLoading(true);

    setError('');

    setInfo('');

    try {
      const data =
        await requestPasswordResetOtp(
          value
        );

      setInfo(
        data?.message ||
          'Verification code sent successfully.'
      );

      setStep(2);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          'Failed to send verification code.'
      );
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const handleVerifyOtp = async () => {
    const idValue = identifier.trim();

    const otpValue = otp.trim();

    if (!idValue || !otpValue) {
      setError(
        'Please enter the verification code.'
      );

      return;
    }

    if (otpValue.length !== 6) {
      setError(
        'Please enter a valid 6-digit OTP.'
      );

      return;
    }

    setLoading(true);

    setError('');

    setInfo('');

    try {
      const data =
        await verifyPasswordResetOtp(
          idValue,
          otpValue
        );

      const token = String(
        data?.resetToken || ''
      );

      if (!token) {
        setError(
          'Reset token is missing. Please try again.'
        );

        return;
      }

      setResetToken(token);

      setInfo(
        data?.message ||
          'OTP verified successfully.'
      );

      setStep(3);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          'Invalid or expired verification code.'
      );
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     SET NEW PASSWORD
  ========================================================= */

  const handleSetNewPassword =
    async () => {
      const pass = newPassword;

      if (pass.length < 8) {
        setError(
          'Password must be at least 8 characters.'
        );

        return;
      }

      if (
        pass !== confirmPassword
      ) {
        setError(
          'Passwords do not match.'
        );

        return;
      }

      if (!resetToken) {
        setError(
          'Reset session expired. Please verify OTP again.'
        );

        return;
      }

      setLoading(true);

      setError('');

      setInfo('');

      try {
        const data =
          await setNewPasswordWithResetToken(
            resetToken,
            pass
          );

        setInfo(
          data?.message ||
            'Password changed successfully.'
        );

        navigation.navigate(
          'Login',
          {
            resetDone: true,
          }
        );
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            'Failed to update password.'
        );
      } finally {
        setLoading(false);
      }
    };


  /* =========================================================
     OTP BOX
  ========================================================= */

  const renderOtpBoxes = () => {
    const otpDigits = otp.split('');

    return (
      <TouchableOpacity
        style={styles.otpContainer}
        activeOpacity={1}
        onPress={() =>
          otpInputRef.current?.focus()
        }
      >
        {[0, 1, 2, 3, 4, 5].map(
          index => {
            const isActive =
              otp.length === index;

            const hasValue =
              otpDigits[index];

            return (
              <View
                key={index}
                style={[
                  styles.otpBox,

                  isActive &&
                    styles.activeOtpBox,

                  hasValue &&
                    styles.filledOtpBox,
                ]}
              >
                <Text
                  style={styles.otpDigit}
                >
                  {otpDigits[index] || ''}
                </Text>
              </View>
            );
          }
        )}

        <TextInput
          ref={otpInputRef}
          value={otp}
          onChangeText={value =>
            setOtp(
              value
                .replace(/[^0-9]/g, '')
                .slice(0, 6)
            )
          }
          keyboardType="number-pad"
          maxLength={6}
          style={styles.hiddenOtpInput}
        />
      </TouchableOpacity>
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
            : 'height'
        }
      >
        {/* ===================================================
            BACKGROUND
        =================================================== */}

        <View
          style={styles.topPurpleCircle}
        />

        <View
          style={
            styles.bottomPurpleCircle
          }
        />

        <View
          style={styles.smallCircle}
        />


        <ScrollView
          contentContainerStyle={
            styles.scrollContainer
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* =================================================
              TOP BAR
          ================================================= */}

          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                navigation.goBack()
              }
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={23}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            <Text style={styles.topBarTitle}>
              Reset Password
            </Text>

            <View style={styles.topBarSpace} />
          </View>


          {/* =================================================
              LOGO
          ================================================= */}

          <View style={styles.logoContainer}>
            <View style={styles.logoCard}>
              <Image
                source={require(
                  '../../../assets/icon.png'
                )}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>


          {/* =================================================
              HEADING
          ================================================= */}

          <View
            style={styles.headingContainer}
          >
            <View
              style={styles.headingIcon}
            >
              <MaterialCommunityIcons
                name={stepData.icon}
                size={29}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.title}>
              {stepData.title}
            </Text>

            <Text style={styles.subtitle}>
              {stepData.subtitle}
            </Text>
          </View>


          {/* =================================================
              STEP INDICATOR
          ================================================= */}

          <View
            style={styles.stepsContainer}
          >
            {[1, 2, 3].map(
              (item, index) => (
                <React.Fragment key={item}>
                  <View
                    style={styles.stepWrapper}
                  >
                    <View
                      style={[
                        styles.stepCircle,

                        step >= item &&
                          styles.activeStepCircle,
                      ]}
                    >
                      {step > item ? (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color="#FFFFFF"
                        />
                      ) : (
                        <Text
                          style={[
                            styles.stepNumber,

                            step >= item &&
                              styles.activeStepNumber,
                          ]}
                        >
                          {item}
                        </Text>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepLabel,

                        step >= item &&
                          styles.activeStepLabel,
                      ]}
                    >
                      {item === 1
                        ? 'Account'
                        : item === 2
                        ? 'Verify'
                        : 'Password'}
                    </Text>
                  </View>

                  {index < 2 && (
                    <View
                      style={[
                        styles.stepLine,

                        step > item &&
                          styles.activeStepLine,
                      ]}
                    />
                  )}
                </React.Fragment>
              )
            )}
          </View>


          {/* =================================================
              CARD
          ================================================= */}

          <View style={styles.card}>
            {/* ERROR */}

            {!!error && (
              <View
                style={styles.errorMessage}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={19}
                  color={COLORS.error}
                />

                <Text
                  style={styles.errorText}
                >
                  {error}
                </Text>
              </View>
            )}


            {/* INFO */}

            {!!info && (
              <View
                style={styles.infoMessage}
              >
                <View
                  style={
                    styles.infoIconContainer
                  }
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={COLORS.success}
                  />
                </View>

                <Text
                  style={styles.infoText}
                >
                  {info}
                </Text>
              </View>
            )}


            {/* =================================================
                STEP 1
            ================================================= */}

            {step === 1 && (
              <>
                <Text
                  style={styles.inputLabel}
                >
                  Email or Username
                </Text>

                <View
                  style={styles.inputContainer}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={21}
                    color={COLORS.primary}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter email or username"
                    placeholderTextColor="#9CA3AF"
                    value={identifier}
                    onChangeText={
                      setIdentifier
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="send"
                    onSubmitEditing={
                      handleRequestOtp
                    }
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,

                    loading &&
                      styles.buttonDisabled,
                  ]}
                  disabled={loading}
                  onPress={
                    handleRequestOtp
                  }
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Send Verification Code
                      </Text>

                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={21}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}


            {/* =================================================
                STEP 2
            ================================================= */}

            {step === 2 && (
              <>
                <Text
                  style={styles.otpSentText}
                >
                  Verification code sent to
                </Text>

                <Text
                  style={styles.identifierText}
                  numberOfLines={1}
                >
                  {identifier}
                </Text>

                <Text
                  style={styles.otpLabel}
                >
                  Enter 6-digit OTP
                </Text>

                {renderOtpBoxes()}

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={
                    handleRequestOtp
                  }
                  disabled={loading}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={16}
                    color={COLORS.primary}
                  />

                  <Text
                    style={styles.resendText}
                  >
                    Resend OTP
                  </Text>
                </TouchableOpacity>

                <View
                  style={styles.buttonRow}
                >
                  <TouchableOpacity
                    style={
                      styles.secondaryButton
                    }
                    disabled={loading}
                    onPress={() => {
                      setError('');

                      setInfo('');

                      setStep(1);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={18}
                      color={COLORS.primary}
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.rowPrimaryButton,

                      loading &&
                        styles.buttonDisabled,
                    ]}
                    disabled={loading}
                    onPress={
                      handleVerifyOtp
                    }
                  >
                    {loading ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <>
                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          Verify OTP
                        </Text>

                        <MaterialCommunityIcons
                          name="shield-check-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}


            {/* =================================================
                STEP 3
            ================================================= */}

            {step === 3 && (
              <>
                <Text
                  style={styles.inputLabel}
                >
                  New Password
                </Text>

                <View
                  style={styles.inputContainer}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={21}
                    color={COLORS.primary}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={
                      setNewPassword
                    }
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name={
                        showPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={21}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>


                {/* PASSWORD STRENGTH */}

                {newPassword.length > 0 && (
                  <View
                    style={
                      styles.passwordStrengthContainer
                    }
                  >
                    <View
                      style={
                        styles.strengthBarsContainer
                      }
                    >
                      {[1, 2, 3, 4].map(
                        item => (
                          <View
                            key={item}
                            style={[
                              styles.strengthBar,

                              {
                                backgroundColor:
                                  item <=
                                  passwordStrength.level
                                    ? getStrengthColor()
                                    : '#E5E7EB',
                              },
                            ]}
                          />
                        )
                      )}
                    </View>

                    <Text
                      style={[
                        styles.strengthText,

                        {
                          color:
                            getStrengthColor(),
                        },
                      ]}
                    >
                      {
                        passwordStrength.label
                      }
                    </Text>
                  </View>
                )}


                {/* CONFIRM PASSWORD */}

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputSpacing,
                  ]}
                >
                  Confirm Password
                </Text>

                <View
                  style={[
                    styles.inputContainer,

                    confirmPassword.length >
                      0 &&
                      newPassword ===
                        confirmPassword && {
                        borderColor:
                          '#A7F3D0',
                      },

                    confirmPassword.length >
                      0 &&
                      newPassword !==
                        confirmPassword && {
                        borderColor:
                          '#FECACA',
                      },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    size={21}
                    color={
                      confirmPassword.length >
                        0 &&
                      newPassword ===
                        confirmPassword
                        ? COLORS.success
                        : COLORS.primary
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={
                      setConfirmPassword
                    }
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={
                      handleSetNewPassword
                    }
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name={
                        showConfirmPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={21}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>


                {/* MATCH STATUS */}

                {confirmPassword.length >
                  0 && (
                  <View
                    style={styles.matchContainer}
                  >
                    <MaterialCommunityIcons
                      name={
                        newPassword ===
                        confirmPassword
                          ? 'check-circle'
                          : 'alert-circle'
                      }
                      size={14}
                      color={
                        newPassword ===
                        confirmPassword
                          ? COLORS.success
                          : COLORS.error
                      }
                    />

                    <Text
                      style={[
                        styles.matchText,

                        {
                          color:
                            newPassword ===
                            confirmPassword
                              ? COLORS.success
                              : COLORS.error,
                        },
                      ]}
                    >
                      {newPassword ===
                      confirmPassword
                        ? 'Passwords match'
                        : 'Passwords do not match'}
                    </Text>
                  </View>
                )}


                {/* BUTTONS */}

                <View
                  style={styles.buttonRow}
                >
                  <TouchableOpacity
                    style={
                      styles.secondaryButton
                    }
                    disabled={loading}
                    onPress={() => {
                      setError('');

                      setInfo('');

                      setStep(2);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={18}
                      color={COLORS.primary}
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      styles.rowPrimaryButton,

                      loading &&
                        styles.buttonDisabled,
                    ]}
                    disabled={loading}
                    onPress={
                      handleSetNewPassword
                    }
                  >
                    {loading ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <>
                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          Update Password
                        </Text>

                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>


          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>
            <View
              style={styles.secureContainer}
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={15}
                color={COLORS.primary}
              />

              <Text style={styles.secureText}>
                Secure Password Recovery
              </Text>
            </View>

            <Text style={styles.footerText}>
              Learn • Practice • Achieve
            </Text>
          </View>
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
    backgroundColor: COLORS.background,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },


  /* =========================================================
     BACKGROUND
  ========================================================= */

  topPurpleCircle: {
    position: 'absolute',

    width: 280,
    height: 280,

    borderRadius: 140,

    backgroundColor: '#EDE9FE',

    top: -160,
    right: -100,

    opacity: 0.75,
  },

  bottomPurpleCircle: {
    position: 'absolute',

    width: 320,
    height: 320,

    borderRadius: 160,

    backgroundColor: '#F3E8FF',

    bottom: -210,
    left: -170,

    opacity: 0.8,
  },

  smallCircle: {
    position: 'absolute',

    width: 90,
    height: 90,

    borderRadius: 45,

    backgroundColor: '#DDD6FE',

    top: '30%',
    left: -60,

    opacity: 0.35,
  },


  /* =========================================================
     SCROLL
  ========================================================= */

  scrollContainer: {
    flexGrow: 1,

    paddingHorizontal: 22,

    paddingTop: 10,
    paddingBottom: 28,
  },


  /* =========================================================
     TOP BAR
  ========================================================= */

  topBar: {
    height: 52,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,

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

  topBarTitle: {
    fontSize: 15,

    fontWeight: '800',

    color: COLORS.text,
  },

  topBarSpace: {
    width: 42,
  },


  /* =========================================================
     LOGO
  ========================================================= */

  logoContainer: {
    alignItems: 'center',

    marginTop: 15,

    marginBottom: 15,
  },

  logoCard: {
    width: 78,
    height: 78,

    borderRadius: 24,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#EEEAFB',

    shadowColor: '#4C1D95',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.1,

    shadowRadius: 18,

    elevation: 6,
  },

  logo: {
    width: 64,
    height: 64,
  },


  /* =========================================================
     HEADING
  ========================================================= */

  headingContainer: {
    alignItems: 'center',

    marginBottom: 20,
  },

  headingIcon: {
    width: 54,
    height: 54,

    borderRadius: 18,

    backgroundColor:
      COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 13,
  },

  title: {
    fontSize: 27,

    fontWeight: '900',

    color: COLORS.text,

    letterSpacing: -0.6,

    textAlign: 'center',
  },

  subtitle: {
    marginTop: 7,

    maxWidth: 320,

    fontSize: 13,

    lineHeight: 20,

    color: COLORS.muted,

    textAlign: 'center',

    fontWeight: '500',
  },


  /* =========================================================
     STEPS
  ========================================================= */

  stepsContainer: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'center',

    marginBottom: 22,

    paddingHorizontal: 15,
  },

  stepWrapper: {
    alignItems: 'center',

    width: 58,
  },

  stepCircle: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: '#FFFFFF',

    borderWidth: 2,

    borderColor: '#DDD6FE',

    alignItems: 'center',

    justifyContent: 'center',
  },

  activeStepCircle: {
    backgroundColor: COLORS.primary,

    borderColor: COLORS.primary,
  },

  stepNumber: {
    color: '#9CA3AF',

    fontSize: 12,

    fontWeight: '900',
  },

  activeStepNumber: {
    color: '#FFFFFF',
  },

  stepLabel: {
    marginTop: 6,

    fontSize: 9,

    color: '#9CA3AF',

    fontWeight: '700',
  },

  activeStepLabel: {
    color: COLORS.primary,
  },

  stepLine: {
    flex: 1,

    height: 2,

    backgroundColor: '#E5E7EB',

    marginTop: 16,

    marginHorizontal: -6,
  },

  activeStepLine: {
    backgroundColor: COLORS.primary,
  },


  /* =========================================================
     CARD
  ========================================================= */

  card: {
    backgroundColor: '#FFFFFF',

    borderRadius: 28,

    paddingHorizontal: 20,

    paddingVertical: 24,

    borderWidth: 1,

    borderColor: '#F0EDF8',

    shadowColor: '#312E81',

    shadowOffset: {
      width: 0,
      height: 12,
    },

    shadowOpacity: 0.08,

    shadowRadius: 25,

    elevation: 7,
  },


  /* =========================================================
     INPUT
  ========================================================= */

  inputLabel: {
    fontSize: 13,

    fontWeight: '800',

    color: COLORS.text,

    marginBottom: 8,
  },

  inputSpacing: {
    marginTop: 17,
  },

  inputContainer: {
    minHeight: 56,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 16,

    backgroundColor: '#FAFAFD',

    paddingHorizontal: 15,

    flexDirection: 'row',

    alignItems: 'center',
  },

  input: {
    flex: 1,

    marginLeft: 11,

    paddingVertical: 15,

    color: COLORS.text,

    fontSize: 14,

    fontWeight: '500',
  },

  eyeButton: {
    width: 38,
    height: 38,

    alignItems: 'center',

    justifyContent: 'center',
  },


  /* =========================================================
     OTP
  ========================================================= */

  otpSentText: {
    color: COLORS.muted,

    fontSize: 12,

    textAlign: 'center',
  },

  identifierText: {
    marginTop: 4,

    color: COLORS.primary,

    fontSize: 13,

    fontWeight: '800',

    textAlign: 'center',
  },

  otpLabel: {
    marginTop: 23,

    marginBottom: 13,

    color: COLORS.text,

    fontSize: 13,

    fontWeight: '800',

    textAlign: 'center',
  },

  otpContainer: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    position: 'relative',
  },

  otpBox: {
    width: 43,
    height: 53,

    borderRadius: 14,

    borderWidth: 1.5,

    borderColor: COLORS.border,

    backgroundColor: '#FAFAFD',

    alignItems: 'center',

    justifyContent: 'center',
  },

  activeOtpBox: {
    borderColor: COLORS.primary,

    backgroundColor: '#FAF8FF',
  },

  filledOtpBox: {
    borderColor: '#C4B5FD',

    backgroundColor:
      COLORS.primaryLight,
  },

  otpDigit: {
    color: COLORS.primaryDark,

    fontSize: 20,

    fontWeight: '900',
  },

  hiddenOtpInput: {
    position: 'absolute',

    width: 1,
    height: 1,

    opacity: 0,
  },

  resendButton: {
    alignSelf: 'center',

    marginTop: 17,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },

  resendText: {
    color: COLORS.primary,

    fontSize: 12,

    fontWeight: '800',
  },


  /* =========================================================
     BUTTONS
  ========================================================= */

  primaryButton: {
    height: 57,

    marginTop: 25,

    borderRadius: 17,

    backgroundColor: COLORS.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,

    shadowColor: COLORS.primary,

    shadowOffset: {
      width: 0,
      height: 9,
    },

    shadowOpacity: 0.25,

    shadowRadius: 16,

    elevation: 7,
  },

  primaryButtonText: {
    color: '#FFFFFF',

    fontSize: 14,

    fontWeight: '900',
  },

  buttonRow: {
    flexDirection: 'row',

    marginTop: 25,

    gap: 10,
  },

  secondaryButton: {
    height: 57,

    flex: 0.42,

    borderRadius: 17,

    borderWidth: 1.5,

    borderColor: '#DDD6FE',

    backgroundColor: '#FAF8FF',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,
  },

  secondaryButtonText: {
    color: COLORS.primary,

    fontSize: 13,

    fontWeight: '800',
  },

  rowPrimaryButton: {
    flex: 1,

    marginTop: 0,
  },

  buttonDisabled: {
    opacity: 0.65,
  },


  /* =========================================================
     PASSWORD STRENGTH
  ========================================================= */

  passwordStrengthContainer: {
    marginTop: 9,

    flexDirection: 'row',

    alignItems: 'center',
  },

  strengthBarsContainer: {
    flex: 1,

    flexDirection: 'row',

    gap: 5,
  },

  strengthBar: {
    flex: 1,

    height: 4,

    borderRadius: 2,
  },

  strengthText: {
    width: 48,

    marginLeft: 10,

    fontSize: 10,

    fontWeight: '800',

    textAlign: 'right',
  },


  /* =========================================================
     PASSWORD MATCH
  ========================================================= */

  matchContainer: {
    marginTop: 7,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },

  matchText: {
    fontSize: 10,

    fontWeight: '700',
  },


  /* =========================================================
     ERROR
  ========================================================= */

  errorMessage: {
    backgroundColor:
      COLORS.errorBackground,

    borderRadius: 13,

    paddingHorizontal: 13,

    paddingVertical: 11,

    marginBottom: 18,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    borderWidth: 1,

    borderColor: '#FECACA',
  },

  errorText: {
    flex: 1,

    color: COLORS.error,

    fontSize: 12,

    fontWeight: '600',
  },


  /* =========================================================
     INFO
  ========================================================= */

  infoMessage: {
    backgroundColor:
      COLORS.successBackground,

    borderRadius: 13,

    paddingHorizontal: 13,

    paddingVertical: 11,

    marginBottom: 18,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 9,

    borderWidth: 1,

    borderColor: '#A7F3D0',
  },

  infoIconContainer: {
    width: 27,
    height: 27,

    borderRadius: 14,

    backgroundColor: '#D1FAE5',

    alignItems: 'center',

    justifyContent: 'center',
  },

  infoText: {
    flex: 1,

    color: COLORS.success,

    fontSize: 12,

    fontWeight: '700',
  },


  /* =========================================================
     FOOTER
  ========================================================= */

  footer: {
    alignItems: 'center',

    marginTop: 24,
  },

  secureContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },

  secureText: {
    color: COLORS.muted,

    fontSize: 11,

    fontWeight: '600',
  },

  footerText: {
    marginTop: 8,

    color: COLORS.primary,

    fontSize: 11,

    fontWeight: '800',

    letterSpacing: 0.5,
  },
});