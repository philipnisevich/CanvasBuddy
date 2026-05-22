const MIN_PASSWORD_LENGTH = 6;

export function validateNewPasswordPair(
  newPassword: string,
  confirmPassword: string
): string | null {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (newPassword !== confirmPassword) {
    return "Passwords do not match. Please re-enter them.";
  }
  return null;
}
