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
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
  }
}
