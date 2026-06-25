export interface LocalProfileAvatar {
  fileId: string;
  url: string;
  savedAt: number;
}

interface ProfileAvatarIdentity {
  userId?: string;
  username?: string;
}

export const PROFILE_AVATAR_CHANGED_EVENT = "base-info-local-avatar-updated";

const STORAGE_KEY = "base-info:profile-avatars";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeKey = (value?: string) => (value || "").trim();

const readAvatarMap = (): Record<string, LocalProfileAvatar> => {
  if (!canUseStorage()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
};

const notifyAvatarChanged = () => {
  window.dispatchEvent(new CustomEvent(PROFILE_AVATAR_CHANGED_EVENT));
};

const writeAvatarMap = (map: Record<string, LocalProfileAvatar>) => {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    notifyAvatarChanged();
    return true;
  } catch {
    notifyAvatarChanged();
    return false;
  }
};

const identityKeys = (identity: ProfileAvatarIdentity) =>
  Array.from(new Set([normalizeKey(identity.userId), normalizeKey(identity.username)].filter(Boolean)));

export const getLocalProfileAvatar = (identity: ProfileAvatarIdentity) => {
  const map = readAvatarMap();
  const keys = identityKeys(identity);
  for (const key of keys) {
    if (map[key]?.url) return map[key];
  }
  return undefined;
};

export const saveLocalProfileAvatar = (identity: ProfileAvatarIdentity, avatar: Omit<LocalProfileAvatar, "savedAt">) => {
  if (!avatar.url) return false;
  const keys = identityKeys(identity);
  if (!keys.length) return false;
  const map = readAvatarMap();
  const value: LocalProfileAvatar = { ...avatar, savedAt: Date.now() };
  keys.forEach(key => {
    map[key] = value;
  });
  return writeAvatarMap(map);
};

export const removeLocalProfileAvatar = (identity: ProfileAvatarIdentity) => {
  const keys = identityKeys(identity);
  if (!keys.length) return false;
  const map = readAvatarMap();
  keys.forEach(key => {
    delete map[key];
  });
  return writeAvatarMap(map);
};
