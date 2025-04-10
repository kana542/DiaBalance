const tokenCache = new Map();

export function cacheToken(userId, token, expiration) {
  if (!userId || !token || !expiration) return;

  console.log(`Caching Kubios token for user ${userId}`);
  tokenCache.set(userId, token);

  // Aseta ajastin, joka poistaa tokenin välimuistista kun se vanhenee
  const timeUntilExpiry = new Date(expiration).getTime() - Date.now();
  if (timeUntilExpiry > 0) {
    setTimeout(() => {
      console.log(`Token cache expiring for user ${userId}`);
      tokenCache.delete(userId);
    }, timeUntilExpiry);
  }
}

export function getTokenFromCache(userId) {
  if (tokenCache.has(userId)) {
    console.log(`Token found in cache for user ${userId}`);
    return tokenCache.get(userId);
  }
  return null;
}

export function removeTokenFromCache(userId) {
  console.log(`Removing token from cache for user ${userId}`);
  tokenCache.delete(userId);
}
