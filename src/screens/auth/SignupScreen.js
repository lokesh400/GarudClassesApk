import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

import apiClient from '../../api/client';


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
};


export default function SignupScreen({
  navigation,
}) {
  const [fullName, setFullName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

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


  /* =========================================================
     PASSWORD STRENGTH
  ========================================================= */

  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        level: 0,
        label: '',
      };
    }

    let score = 0;

    if (password.length >= 8) {
      score += 1;
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    }

    if (
      /[^A-Za-z0-9]/.test(password)
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
  }, [password]);


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
     VALIDATION
  ========================================================= */

  const validate = () => {
    if (!fullName.trim()) {
      return 'Full name is required';
    }

    if (!email.trim()) {
      return 'Email is required';
    }

    if (
      !/\S+@\S+\.\S+/.test(
        email.trim()
      )
    ) {
      return 'Enter a valid email address';
    }

    if (!password) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (
      password !== confirmPassword
    ) {
      return 'Passwords do not match';
    }

    return null;
  };


  /* =========================================================
     SIGNUP
  ========================================================= */

  const handleSignup = async () => {
    const validationError =
      validate();

    if (validationError) {
      setError(validationError);

      return;
    }

    setError('');

    setLoading(true);

    try {
      await apiClient.post(
        '/auth/register',
        {
          name: fullName.trim(),

          email: email
            .trim()
            .toLowerCase(),

          password,
        }
      );

      navigation.navigate(
        'Login',
        {
          registered: true,
        }
      );
    } catch (e) {
      const status =
        e.response?.status;

      if (status === 400) {
        const msg =
          e.response?.data?.message;

        setError(
          msg ||
            'Invalid details. Please check your input.'
        );
      } else {
        setError(
          'Something went wrong. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };


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
        {/* BACKGROUND */}

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
          {/* LOGO */}

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


          {/* HEADING */}

          <View
            style={styles.headingContainer}
          >
            <Text style={styles.title}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Start your learning journey
              with Garud Classes
            </Text>
          </View>


          {/* SIGNUP CARD */}

          <View style={styles.signupCard}>
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


            {/* FULL NAME */}

            <Text style={styles.inputLabel}>
              Full Name
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
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>


            {/* EMAIL */}

            <Text
              style={[
                styles.inputLabel,
                styles.inputSpacing,
              ]}
            >
              Email Address
            </Text>

            <View
              style={styles.inputContainer}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={21}
                color={COLORS.primary}
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>


            {/* PASSWORD */}

            <Text
              style={[
                styles.inputLabel,
                styles.inputSpacing,
              ]}
            >
              Password
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
                value={password}
                onChangeText={setPassword}
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                returnKeyType="next"
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

            {password.length > 0 && (
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
                  {passwordStrength.label}
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

                confirmPassword.length > 0 &&
                  password ===
                    confirmPassword && {
                    borderColor: '#A7F3D0',
                  },

                confirmPassword.length > 0 &&
                  password !==
                    confirmPassword && {
                    borderColor: '#FECACA',
                  },
              ]}
            >
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={21}
                color={
                  confirmPassword.length >
                    0 &&
                  password ===
                    confirmPassword
                    ? COLORS.success
                    : COLORS.primary
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
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
                  handleSignup
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


            {/* PASSWORD MATCH MESSAGE */}

            {confirmPassword.length > 0 && (
              <View
                style={styles.matchContainer}
              >
                <MaterialCommunityIcons
                  name={
                    password ===
                    confirmPassword
                      ? 'check-circle'
                      : 'alert-circle'
                  }
                  size={14}
                  color={
                    password ===
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
                        password ===
                        confirmPassword
                          ? COLORS.success
                          : COLORS.error,
                    },
                  ]}
                >
                  {password ===
                  confirmPassword
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </Text>
              </View>
            )}


            {/* CREATE ACCOUNT */}

            <TouchableOpacity
              style={[
                styles.createButton,

                loading &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading}
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
                      styles.createButtonText
                    }
                  >
                    Create Account
                  </Text>

                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={21}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>


            {/* DIVIDER */}

            <View
              style={styles.dividerContainer}
            >
              <View style={styles.divider} />

              <Text style={styles.dividerText}>
                Already a student?
              </Text>

              <View style={styles.divider} />
            </View>


            {/* LOGIN */}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() =>
                navigation.navigate('Login')
              }
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="login"
                size={20}
                color={COLORS.primary}
              />

              <Text
                style={
                  styles.loginButtonText
                }
              >
                Login to Your Account
              </Text>
            </TouchableOpacity>
          </View>


          {/* FOOTER */}

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
                Your information is secure
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


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

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

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 25,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },

  logoCard: {
    width: 86,
    height: 86,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEAFB',

    shadowColor: '#4C1D95',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },

  logo: {
    width: 70,
    height: 70,
  },

  headingContainer: {
    alignItems: 'center',
    marginBottom: 23,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.7,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    fontWeight: '500',
  },

  signupCard: {
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

  createButton: {
    height: 57,
    marginTop: 25,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 9,
    },
    shadowOpacity: 0.27,
    shadowRadius: 16,
    elevation: 7,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  dividerContainer: {
    marginTop: 27,
    flexDirection: 'row',
    alignItems: 'center',
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  dividerText: {
    marginHorizontal: 11,
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },

  loginButton: {
    height: 54,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  loginButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },

  errorMessage: {
    backgroundColor: COLORS.errorBackground,
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