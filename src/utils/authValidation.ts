
export const validateRegistration = (
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: "Passwörter stimmen nicht überein"
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "Das Passwort muss mindestens 6 Zeichen lang sein."
    };
  }

  if (!username.trim()) {
    return {
      isValid: false,
      error: "Benutzername erforderlich"
    };
  }

  if (!email.trim() || !email.includes('@')) {
    return {
      isValid: false,
      error: "Ungültige E-Mail"
    };
  }

  return { isValid: true };
};
