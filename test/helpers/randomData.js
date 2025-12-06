export function randomString() {
  const randomString = Math.random().toString(36).substring(2, 12);
  return randomString;
}