/**
 * 个人中心接口，对接 info_service /users、/files 和 auth_service /change-password。
 */
import type { Profile } from "@/api/interface/profile";
import type { BaseInfo } from "@/api/interface/baseInfo";
import http from "@/api";
import { useUserStore } from "@/stores/modules/user";
import {
  BASE_INFO_ROLE_OPTIONS,
  enrichBaseInfoUserFromCurrentAuthApi,
  getBaseInfoUserDetailApi,
  getBaseInfoUserIdByAuthIdApi,
  getBaseInfoUserListApi,
  parseBaseInfoRoleIds,
  saveBaseInfoUserApi,
  uploadBaseInfoFileApi
} from "@/api/modules/baseInfo";
import { getLocalProfileAvatar, saveLocalProfileAvatar } from "@/utils/profileAvatar";

type AuthIdentity = {
  user_id?: string;
  username?: string;
  role?: string;
  status?: string;
  created_at?: string;
};

type ProfileAvatarSource = Partial<BaseInfo.UploadedFile> & {
  fileId?: string;
  url?: string;
};

const toProfileDetail = (
  user: Awaited<ReturnType<typeof getBaseInfoUserDetailApi>>,
  avatar?: ProfileAvatarSource
): Profile.ProfileDetail => ({
  id: user.id,
  userId: user.id,
  userNo: user.userNo,
  username: user.username,
  fullName: user.fullName || user.username,
  gender: user.gender,
  email: user.email,
  phone: user.phone,
  status: user.status,
  avatarFileId: avatar?.id ?? avatar?.fileId ?? user.avatarFileId,
  avatarUrl: avatar?.accessUrl ?? avatar?.url ?? "",
  roleNames: user.roleNames,
  roleName: user.roleNames[0] ?? "",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const getCurrentAuthIdentity = async (): Promise<AuthIdentity> => {
  try {
    const res = await http.get("/auth/me", {}, { cancel: false, loading: false, authRedirect: false });
    const body = ((res as any)?.data ?? res) as AuthIdentity;
    return {
      user_id: body.user_id ?? "",
      username: body.username ?? "",
      role: body.role ?? "",
      status: body.status ?? "",
      created_at: body.created_at ?? ""
    };
  } catch {
    return {};
  }
};

const roleNameFromAuthRole = (role?: string) => {
  const normalized = role?.trim().toUpperCase();
  return BASE_INFO_ROLE_OPTIONS.find(option => option.code === normalized || option.label === role)?.label ?? role ?? "";
};

const toAuthProfileDetail = (identity: AuthIdentity, avatar?: ProfileAvatarSource): Profile.ProfileDetail => ({
  id: "",
  userId: identity.user_id ?? "",
  userNo: identity.user_id ?? "",
  username: identity.username ?? "",
  fullName: identity.username ?? identity.user_id ?? "",
  gender: "",
  email: "",
  phone: "",
  status: identity.status === "DISABLED" || identity.status === "INACTIVE" ? "DISABLED" : "ACTIVE",
  avatarFileId: avatar?.id ?? avatar?.fileId ?? "",
  avatarUrl: avatar?.accessUrl ?? avatar?.url ?? "",
  roleNames: roleNameFromAuthRole(identity.role) ? [roleNameFromAuthRole(identity.role)] : [],
  roleName: roleNameFromAuthRole(identity.role),
  createdAt: identity.created_at ?? "",
  updatedAt: ""
});

const resolveCurrentInfoUserId = async () => {
  const userStore = useUserStore();
  const identity = await getCurrentAuthIdentity();
  const authUserId = userStore.userId || identity.user_id || "";
  const username = userStore.userInfo.name || identity.username || "";

  if (/^\d+$/.test(authUserId || "")) return authUserId;

  const byAuthId = await getBaseInfoUserIdByAuthIdApi(authUserId).catch(() => "");
  if (byAuthId) return byAuthId;

  const byUsername = await getBaseInfoUserListApi({ pageNum: 1, pageSize: 20, keyword: username }).catch(() => ({ list: [] }));
  return byUsername.list.find(item => item.username === username || item.userNo === username)?.id ?? "";
};

const enrichUserRoles = async (user: Awaited<ReturnType<typeof getBaseInfoUserDetailApi>>) => {
  const currentAuthUser = await enrichBaseInfoUserFromCurrentAuthApi(user);
  if (currentAuthUser.roleNames.length || !currentAuthUser.username) return currentAuthUser;
  const res = await getBaseInfoUserListApi({ pageNum: 1, pageSize: 20, keyword: user.username });
  const item = res.list.find(
    row => row.id === currentAuthUser.id || row.username === currentAuthUser.username || row.userNo === currentAuthUser.userNo
  );
  return item
    ? { ...currentAuthUser, roleIds: currentAuthUser.roleIds || item.roleIds, roleNames: item.roleNames }
    : currentAuthUser;
};

export const getBaseInfoProfileDetailApi = async (userId?: string) => {
  const identity = await getCurrentAuthIdentity();
  const avatar = getLocalProfileAvatar({ userId: identity.user_id, username: identity.username });
  const id = userId || (await resolveCurrentInfoUserId());
  if (!id) return toAuthProfileDetail(identity, avatar);
  try {
    const user = await enrichUserRoles(await getBaseInfoUserDetailApi(id));
    return toProfileDetail(user, getLocalProfileAvatar({ userId: user.id, username: user.username }) || avatar);
  } catch {
    return toAuthProfileDetail(identity, avatar);
  }
};

export const saveBaseInfoProfileApi = async (params: Profile.UpdateProfileParams) => {
  const infoUserId = params.id || (await resolveCurrentInfoUserId());
  if (!infoUserId) throw new Error("当前账号暂无可编辑的基础信息档案，请联系基础信息组补齐用户档案映射");
  const current = await enrichUserRoles(await getBaseInfoUserDetailApi(infoUserId));
  const saved = await saveBaseInfoUserApi({
    id: current.id,
    userNo: current.userNo,
    username: current.username,
    roleIds: parseBaseInfoRoleIds(current.roleIds),
    fullName: params.fullName,
    gender: params.gender,
    email: params.email,
    phone: params.phone,
    status: params.status,
    syncRoleIds: false,
    avatarFileId: current.avatarFileId
  });
  const enrichedSaved = await enrichUserRoles(saved);
  if (params.avatarFileId && params.avatarUrl) {
    saveLocalProfileAvatar(
      { userId: enrichedSaved.id, username: enrichedSaved.username },
      { fileId: params.avatarFileId, url: params.avatarUrl }
    );
  }
  return toProfileDetail(
    enrichedSaved,
    params.avatarFileId && params.avatarUrl
      ? {
          id: params.avatarFileId,
          fileName: "",
          fileType: "",
          fileSize: 0,
          accessUrl: params.avatarUrl
        }
      : undefined
  );
};

export const uploadBaseInfoProfileAvatarApi = async (file: File) => uploadBaseInfoFileApi(file);

export const changeBaseInfoProfilePasswordApi = async (params: Profile.ChangePasswordParams) => {
  return http.post("/auth/change-password", {
    old_password: params.oldPassword,
    new_password: params.newPassword
  });
};
