/**
 * 基础信息管理组的同学在这里封装个人中心相关接口。
 * 可继续补充获取个人信息、修改头像、修改联系方式、修改密码等请求方法。
 * 页面中不要直接写 axios，请统一从这个文件导出请求函数。
 */
import type { Profile } from "@/api/interface/profile";

const profileDetailMock: Profile.ProfileDetail = {
  id: "P-1001",
  name: "张晨",
  avatar: "file-avatar-1001",
  phone: "13800000001",
  email: "zhangchen@stss.edu.cn",
  department: "教务处",
  title: "教务管理员",
  roleName: "系统管理员",
  signature: "让流程更清晰，让数据更可靠。",
  lastLoginAt: "2026-05-28 08:30:00",
  loginCount: 128,
  twoFactorEnabled: true,
  campus: "主校区 A 楼"
};

const activityListMock: Profile.ActivityItem[] = [
  {
    id: "A-1001",
    title: "更新个人资料",
    description: "修改了手机号和邮箱信息",
    time: "2026-05-28 09:10:00",
    status: "已完成"
  },
  {
    id: "A-1002",
    title: "切换安全设置",
    description: "开启了双重验证",
    time: "2026-05-27 18:20:00",
    status: "已完成"
  },
  {
    id: "A-1003",
    title: "头像更新",
    description: "上传了新的头像文件",
    time: "2026-05-26 16:45:00",
    status: "已完成"
  }
];

let currentPassword = "123456";

const wait = <T>(value: T, timeout = 180) =>
  new Promise<T>(resolve => {
    window.setTimeout(() => resolve(value), timeout);
  });

export const getBaseInfoProfileDetailApi = () => {
  return wait({ ...profileDetailMock });
};

export const saveBaseInfoProfileApi = (params: Profile.UpdateProfileParams) => {
  profileDetailMock.name = params.name ?? profileDetailMock.name;
  profileDetailMock.avatar = params.avatar ?? profileDetailMock.avatar;
  profileDetailMock.phone = params.phone ?? profileDetailMock.phone;
  profileDetailMock.email = params.email ?? profileDetailMock.email;
  profileDetailMock.department = params.department ?? profileDetailMock.department;
  profileDetailMock.title = params.title ?? profileDetailMock.title;
  profileDetailMock.signature = params.signature ?? profileDetailMock.signature;

  return wait({ ...profileDetailMock });
};

export const updateBaseInfoProfileAvatarApi = (avatar: string) => {
  profileDetailMock.avatar = avatar;
  return wait({ avatar });
};

export const changeBaseInfoProfilePasswordApi = (params: Profile.ChangePasswordParams) => {
  if (params.oldPassword !== currentPassword) {
    return Promise.reject(new Error("原密码不正确"));
  }
  if (params.newPassword !== params.confirmPassword) {
    return Promise.reject(new Error("两次输入的新密码不一致"));
  }
  currentPassword = params.newPassword;
  return wait(true);
};

export const getBaseInfoProfileActivityListApi = () => {
  return wait(activityListMock.map(item => ({ ...item })));
};
