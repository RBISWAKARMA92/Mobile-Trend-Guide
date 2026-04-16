const PROD_DOMAIN = "79b6c394-6b34-420d-8959-924615e0f36e-00-ymnvixgsbir1.kirk.replit.dev";

export function getApiBase(): string {
  const devDomain = process.env.EXPO_PUBLIC_DOMAIN;
  if (__DEV__ && devDomain && devDomain !== "undefined") {
    return `https://${devDomain}/api`;
  }
  return `https://${PROD_DOMAIN}/api`;
}
