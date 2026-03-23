import apiClient from './client';

export async function requestPasswordResetOtp(identifier) {
  const res = await apiClient.post('/auth/password-reset', {
    step: 'request_otp',
    identifier,
  });
  return res.data;
}

export async function verifyPasswordResetOtp(identifier, otp) {
  const res = await apiClient.post('/auth/password-reset', {
    step: 'verify_otp',
    identifier,
    otp,
  });
  return res.data;
}

export async function setNewPasswordWithResetToken(resetToken, newPassword) {
  const res = await apiClient.post('/auth/password-reset', {
    step: 'set_new_password',
    resetToken,
    newPassword,
  });
  return res.data;
}
