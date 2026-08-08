// Shared across every DTO that collects a phone number (signup, admin user create/update,
// profile update) so the accepted format stays consistent in one place.
export const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,19}$/;
