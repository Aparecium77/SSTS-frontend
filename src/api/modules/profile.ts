/**
 * 个人中心接口，对接 info_service /users、/files 和 auth_service /change-password。
 */
import type { Profile } from "@/api/interface/profile";
import type { BaseInfo } from "@/api/interface/baseInfo";
import http from "@/api";
import { useUserStore } from "@/stores/modules/user";
import {
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
    const res = await http.get("/auth/me", {}, { cancel: false, loading: false });
    const body = ((res as any)?.data ?? res) as AuthIdentity;
    return {
      user_id: body.user_id ?? "",
      username: body.username ?? ""
    };
  } catch {
    return {};
  }
};

const resolveCurrentInfoUserId = async () => {
  const userStore = useUserStore();
  const identity = await getCurrentAuthIdentity();
  const authUserId = userStore.userId || identity.user_id || "";
  const username = userStore.userInfo.name || identity.username || "";

  if (/^\d+$/.test(authUserId || "")) return authUserId;

  const byAuthId = await getBaseInfoUserIdByAuthIdApi(authUserId);
  if (byAuthId) return byAuthId;

  const byUsername = await getBaseInfoUserListApi({ pageNum: 1, pageSize: 20, keyword: username });
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
  const id = userId || (await resolveCurrentInfoUserId());
  if (!id) throw new Error("无法定位当前用户的基础信息记录");
  const user = await enrichUserRoles(await getBaseInfoUserDetailApi(id));
  return toProfileDetail(user, getLocalProfileAvatar({ userId: user.id, username: user.username }));
};

export const saveBaseInfoProfileApi = async (params: Profile.UpdateProfileParams) => {
  const current = await enrichUserRoles(await getBaseInfoUserDetailApi(params.id || (await resolveCurrentInfoUserId())));
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
