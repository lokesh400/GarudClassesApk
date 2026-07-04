import React, { useState } from 'react';

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

import { useAuth } from '../../auth/AuthContext';


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
   LOGIN SCREEN
============================================================ */

export default function LoginScreen({
  navigation,
  route,
}) {

  const { login } = useAuth();


  /* =========================================================
     STATE
  ========================================================= */

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');


  /* =========================================================
     ROUTE MESSAGES
  ========================================================= */

  const justRegistered =
    route?.params?.registered === true;

  const resetDone =
    route?.params?.resetDone === true;


  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = async () => {

    if (
      !username.trim() ||
      !password.trim()
    ) {

      setError(
        'Please enter both email and password'
      );

      return;
    }


    setError('');

    setLoading(true);


    try {

      await login(
        username.trim(),
        password
      );


      /*
       Navigation is automatic.

       AuthContext updates
       isAuthenticated.

       RootNavigator then renders
       AppTabs.
      */


    } catch (e) {

      const status =
        e.response?.status;


      if (status === 401) {

        setError(
          'Incorrect email or password'
        );

      } else {

        console.log(e);

        setError(
          'Something went wrong. Please try again.'
        );

      }

    } finally {

      setLoading(false);

    }

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
        backgroundColor={COLORS.background}
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
            BACKGROUND DECORATIONS
        =================================================== */}

        <View
          style={styles.topPurpleCircle}
        />

        <View
          style={styles.bottomPurpleCircle}
        />

        <View
          style={styles.smallCircle}
        />


        <ScrollView

          contentContainerStyle={
            styles.scrollContainer
          }

          keyboardShouldPersistTaps="handled"

          showsVerticalScrollIndicator={false}

        >


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
              TITLE
          ================================================= */}

          <View style={styles.headingContainer}>

            <Text style={styles.welcomeTitle}>
              Welcome Back !
            </Text>


            <Text style={styles.welcomeSubtitle}>

              Login to continue your learning journey

            </Text>

          </View>


          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <View style={styles.loginCard}>


            {/* ===============================================
                SUCCESS MESSAGE
            =============================================== */}

            {justRegistered && (

              <View
                style={styles.successMessage}
              >

                <View
                  style={
                    styles.successIconContainer
                  }
                >

                  <MaterialCommunityIcons

                    name="check"

                    size={17}

                    color={COLORS.success}

                  />

                </View>


                <Text style={styles.successText}>

                  Account created! Please login.

                </Text>

              </View>

            )}


            {resetDone && (

              <View
                style={styles.successMessage}
              >

                <View
                  style={
                    styles.successIconContainer
                  }
                >

                  <MaterialCommunityIcons

                    name="check"

                    size={17}

                    color={COLORS.success}

                  />

                </View>


                <Text style={styles.successText}>

                  Password updated successfully.

                </Text>

              </View>

            )}


            {/* ===============================================
                ERROR MESSAGE
            =============================================== */}

            {!!error && (

              <View style={styles.errorMessage}>

                <MaterialCommunityIcons

                  name="alert-circle-outline"

                  size={19}

                  color={COLORS.error}

                />


                <Text style={styles.errorText}>

                  {error}

                </Text>

              </View>

            )}


            {/* ===============================================
                EMAIL
            =============================================== */}

            <Text style={styles.inputLabel}>

              Email Address

            </Text>


            <View style={styles.inputContainer}>

              <MaterialCommunityIcons

                name="email-outline"

                size={21}

                color={COLORS.primary}

              />


              <TextInput

                style={styles.input}

                placeholder="Enter your email"

                placeholderTextColor="#9CA3AF"

                value={username}

                onChangeText={setUsername}

                keyboardType="email-address"

                autoCapitalize="none"

                autoCorrect={false}

                returnKeyType="next"

              />

            </View>


            {/* ===============================================
                PASSWORD HEADER
            =============================================== */}

            <View style={styles.passwordHeader}>

              <Text style={styles.inputLabel}>

                Password

              </Text>


              <TouchableOpacity

                onPress={() =>

                  navigation.navigate(
                    'ResetPassword',
                    {
                      identifier:
                        username.trim(),
                    }
                  )

                }

              >

                <Text
                  style={
                    styles.forgotPasswordText
                  }
                >

                  Forgot Password?

                </Text>

              </TouchableOpacity>

            </View>


            {/* ===============================================
                PASSWORD
            =============================================== */}

            <View style={styles.inputContainer}>

              <MaterialCommunityIcons

                name="lock-outline"

                size={21}

                color={COLORS.primary}

              />


              <TextInput

                style={styles.input}

                placeholder="Enter your password"

                placeholderTextColor="#9CA3AF"

                value={password}

                onChangeText={setPassword}

                secureTextEntry={!showPassword}

                autoCapitalize="none"

                returnKeyType="done"

                onSubmitEditing={handleLogin}

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


            {/* ===============================================
                LOGIN BUTTON
            =============================================== */}

            <TouchableOpacity

              style={[

                styles.loginButton,

                loading &&
                  styles.loginButtonDisabled,

              ]}

              onPress={handleLogin}

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
                      styles.loginButtonText
                    }
                  >

                    Login

                  </Text>


                  <MaterialCommunityIcons

                    name="arrow-right"

                    size={21}

                    color="#FFFFFF"

                  />

                </>

              )}

            </TouchableOpacity>


            {/* ===============================================
                DIVIDER
            =============================================== */}

            <View style={styles.dividerContainer}>

              <View style={styles.divider} />

              <Text style={styles.dividerText}>

                New to Garud Classes?

              </Text>

              <View style={styles.divider} />

            </View>


            {/* ===============================================
                SIGNUP
            =============================================== */}

            <TouchableOpacity

              style={styles.signupButton}

              onPress={() =>
                navigation.navigate('Signup')
              }

              activeOpacity={0.8}

            >

              <MaterialCommunityIcons

                name="account-plus-outline"

                size={20}

                color={COLORS.primary}

              />


              <Text style={styles.signupButtonText}>

                Create New Account

              </Text>

            </TouchableOpacity>


          </View>


          {/* =================================================
              FOOTER
          ================================================= */}

          <View style={styles.footer}>

            <View style={styles.secureContainer}>

              <MaterialCommunityIcons

                name="shield-check-outline"

                size={15}

                color={COLORS.primary}

              />


              <Text style={styles.secureText}>

                Secure Student Login

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

    top: '28%',

    left: -60,

    opacity: 0.35,

  },


  /* =========================================================
     SCROLL
  ========================================================= */

  scrollContainer: {

    flexGrow: 1,

    justifyContent: 'center',

    paddingHorizontal: 22,

    paddingVertical: 25,

  },


  /* =========================================================
     LOGO
  ========================================================= */

  logoContainer: {

    alignItems: 'center',

    marginBottom: 20,

  },


  logoCard: {

    width: 92,

    height: 92,

    borderRadius: 27,

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

    width: 76,

    height: 76,

  },


  /* =========================================================
     HEADING
  ========================================================= */

  headingContainer: {

    alignItems: 'center',

    marginBottom: 26,

  },


  welcomeTitle: {

    fontSize: 29,

    fontWeight: '900',

    color: COLORS.text,

    letterSpacing: -0.7,

    textAlign: 'center',

  },


  welcomeSubtitle: {

    marginTop: 7,

    fontSize: 14,

    color: COLORS.muted,

    textAlign: 'center',

    fontWeight: '500',

  },


  /* =========================================================
     CARD
  ========================================================= */

  loginCard: {

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
     LABEL
  ========================================================= */

  inputLabel: {

    fontSize: 13,

    fontWeight: '800',

    color: COLORS.text,

    marginBottom: 8,

  },


  passwordHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginTop: 17,

  },


  forgotPasswordText: {

    color: COLORS.primary,

    fontSize: 12,

    fontWeight: '800',

    marginBottom: 8,

  },


  /* =========================================================
     INPUT
  ========================================================= */

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
     LOGIN BUTTON
  ========================================================= */

  loginButton: {

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


  loginButtonDisabled: {

    opacity: 0.65,

  },


  loginButtonText: {

    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '900',

  },


  /* =========================================================
     DIVIDER
  ========================================================= */

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


  /* =========================================================
     SIGNUP
  ========================================================= */

  signupButton: {

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


  signupButtonText: {

    color: COLORS.primary,

    fontSize: 14,

    fontWeight: '800',

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
     SUCCESS
  ========================================================= */

  successMessage: {

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


  successIconContainer: {

    width: 27,

    height: 27,

    borderRadius: 14,

    backgroundColor: '#D1FAE5',

    alignItems: 'center',

    justifyContent: 'center',

  },


  successText: {

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