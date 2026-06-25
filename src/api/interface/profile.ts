import type { UserGender, UserStatus } from "@/api/interface/baseInfo";

/**
 * 个人中心类型。Info Service 当前只持久化用户档案中的姓名、性别、
 * 邮箱、手机和状态；头像上传可返回文件访问地址，但后端用户更新接口
 * 暂未开放 avatar_file_id 写入。
 */
export namespace Profile {
  export interface ProfileDetail {
    id: string;
    userId: string;
    userNo: string;
    username: string;
    fullName: string;
    gender: UserGender;
    email: string;
    phone: string;
    status: UserStatus;
    avatarFileId: string;
    avatarUrl: string;
    roleNames: string[];
    roleName: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface UpdateProfileParams {
    id?: string;
    fullName: string;
    gender: UserGender;
    email: string;
    phone: string;
    status: UserStatus;
    avatarFileId?: string;
    avatarUrl?: string;
  }

  export interface ChangePasswordParams {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }

  export interface ActivityItem {
    id: string;
    title: string;
    description: string;
    status: string;
    time: string;
  }
}
