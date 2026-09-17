const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export function validateUserInput({ name, email, address, password }, { requireProfile = true } = {}) {
  const errors = {};
  if (requireProfile && (!name || name.trim().length < 20 || name.trim().length > 60)) errors.name = 'Name must be between 20 and 60 characters.';
  if (email && !emailPattern.test(email)) errors.email = 'Enter a valid email address.';
  if (requireProfile && (!address || address.trim().length > 400)) errors.address = 'Address is required and may not exceed 400 characters.';
  if (password && !passwordPattern.test(password)) errors.password = 'Password must be 8–16 characters and include an uppercase letter and special character.';
  return errors;
}

