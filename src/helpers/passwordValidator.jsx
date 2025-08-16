// utils/validatePassword.js
export const validatePassword = (password) => {
  const hasNumber = /\d/.test(password); // al menos 1 número
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-\\[\];'/`~]/.test(password); // al menos 1 caracter especial
  const hasUpperCase = /[A-Z]/.test(password); // al menos 1 mayúscula
  const hasLowerCase = /[a-z]/.test(password); // al menos 1 minúscula
  const minLength = password.length >= 8; // mínimo 8 caracteres
  return {
    isValid: hasNumber && hasSpecialChar && hasUpperCase && hasLowerCase && minLength,
    errors: {
      number: hasNumber,
      specialChar: hasSpecialChar,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      minLength: minLength
    },
  };
};
