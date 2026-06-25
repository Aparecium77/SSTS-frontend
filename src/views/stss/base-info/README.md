# 基础信息管理组工作区

## 工作区域

- `src/views/stss/base-info/**`
- `src/views/stss/base-info/menu.ts`
- `src/views/stss/base-info/profile/**`（当前作为公共“个人中心”菜单复用页面）
- `src/api/modules/baseInfo.ts`
- `src/api/interface/baseInfo.ts`
- 如需拆分个人中心，可新增 `src/api/modules/profile.ts`
- 如需拆分个人中心类型，可新增 `src/api/interface/profile.ts`

## 当前页面

当前基础信息组页面入口：

- 用户与档案：`src/views/stss/base-info/users/index.vue`
- 课程资源：`src/views/stss/base-info/resources/course/index.vue`
- 教师资源：`src/views/stss/base-info/resources/teacher/index.vue`
- 教室资源：`src/views/stss/base-info/resources/classroom/index.vue`
- 学期校历：`src/views/stss/base-info/resources/calendar/index.vue`
- 培养方案：`src/views/stss/base-info/resources/training-plans/index.vue`
- 基础信息字典与回收站：`src/views/stss/base-info/permissions/index.vue`

个人中心入口已从基础信息左侧栏移出，作为登录后所有角色可见的平级菜单 `/profile`；组件暂复用 `src/views/stss/base-info/profile/index.vue`。

页面层统一调用 `src/api/modules/baseInfo.ts` 和 `src/api/modules/profile.ts`，不直接写请求。

## 当前联调边界

- 所有列表、详情、新增、编辑、删除均对接 Gateway 后的 Info Service/Auth Service 真实接口。
- 页面字段以 `group1-base/info_service/schemas` 和 `auth_service/schemas` 为准，页面层使用 camelCase，API 层负责 snake_case 转换。
- 用户头像可走 `/api/v1/info/files/` 上传并展示下载地址；当前后端用户更新 schema 未开放 `avatar_file_id` 写回，不能把头像 ID 持久写入用户档案。
- 角色列表当前后端没有公开查询接口，前端使用种子数据中的固定角色 ID 映射；人员录入仅开放学生、教师、教务管理员三个固定业务角色，不实现自定义角色、权限矩阵或角色权限绑定。
