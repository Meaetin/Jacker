export function isDemoUser(email: string | undefined | null): boolean {
  return email === process.env.DEMO_USER_EMAIL;
}
