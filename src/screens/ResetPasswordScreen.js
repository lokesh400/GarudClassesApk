import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  setNewPasswordWithResetToken,
} from '../api/auth';

export default function ResetPasswordScreen({ navigation, route }) {
  const initialIdentifier = String(route?.params?.identifier || '').trim();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Request OTP';
    if (step === 2) return 'Verify OTP';
    return 'Set New Password';
  }, [step]);

  const handleRequestOtp = async () => {
    const value = identifier.trim();
    if (!value) {
      setError('Please enter username or email.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await requestPasswordResetOtp(value);
      setInfo(data?.message || 'OTP requested. Check backend console.');
      setStep(2);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to request OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const idValue = identifier.trim();
    const otpValue = otp.trim();
    if (!idValue || !otpValue) {
      setError('Identifier and OTP are required.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await verifyPasswordResetOtp(idValue, otpValue);
      const token = String(data?.resetToken || '');
      if (!token) {
        setError('OTP verification succeeded but reset token is missing.');
        return;
      }
      setResetToken(token);
      setInfo(data?.message || 'OTP verified.');
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    const pass = newPassword;
    if (pass.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (pass !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!resetToken) {
      setError('Reset token is missing. Please verify OTP again.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await setNewPasswordWithResetToken(resetToken, pass);
      setInfo(data?.message || 'Password changed successfully.');
      navigation.navigate('Login', { resetDone: true });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to set new password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#1D4ED8" />
            </TouchableOpacity>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subTitle}>{stepTitle}</Text>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {!!info && <Text style={styles.infoText}>{info}</Text>}

            {step === 1 && (
              <>
                <Text style={styles.label}>Username or Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username or email"
                  placeholderTextColor="#999"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  disabled={loading}
                  onPress={handleRequestOtp}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.label}>OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#999"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                    disabled={loading}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rowButton, loading && styles.buttonDisabled]}
                    disabled={loading}
                    onPress={handleVerifyOtp}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                    disabled={loading}
                    onPress={() => setStep(2)}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rowButton, loading && styles.buttonDisabled]}
                    disabled={loading}
                    onPress={handleSetNewPassword}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF2FF' },
  root: { flex: 1, backgroundColor: '#EEF2FF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  subTitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowButton: {
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorText: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    fontSize: 13,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 13,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
});
