/**
 * 基础信息管理组的同学在这里补充个人中心相关类型。
 * 建议把个人资料、头像、联系方式、安全设置等类型定义在这里。
 */
export namespace Profile {
  export interface PersonalInfo {
    id: string;
    name: string;
    avatar: string;
    phone?: string;
    email?: string;
  }

  export interface UpdateProfileParams {
    id?: string;
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    department?: string;
    title?: string;
    signature?: string;
  }

  export interface ProfileDetail extends PersonalInfo {
    department: string;
    title: string;
    roleName: string;
    signature: string;
    lastLoginAt: string;
    loginCount: number;
    twoFactorEnabled: boolean;
    campus: string;
  }

  export interface ActivityItem {
    id: string;
    title: string;
    description: string;
    time: string;
    status: string;
  }

  export interface ChangePasswordParams {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
}
