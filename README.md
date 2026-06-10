# STSS Frontend

## 零、注意事项

1. 已新建6个分支，各组在自己分支内工作，可以新建分支（名称标注清晰），请勿直接在main中工作

## 一、项目定位

本仓库是 `STSS` 教务系统前端基础模板，目标是统一：

- 技术栈
- 布局壳层
- 角色权限
- 公共样式与品牌
- 各组并行开发目录

## 二、当前统一内容

- 框架：`Vue 3 + TypeScript + Vite`
- 状态管理：`Pinia`
- 路由：`Vue Router`
- UI：`Element Plus`
- 样式：`SCSS + Tailwind CSS`
- 代码规范：`ESLint + Prettier + Stylelint`
- 品牌：`STSS`
- 水印：`25-26春夏软工 刘玉生老师班软件工程`
- 本地角色登录：
  - 学生：`student / 123456`
  - 教师：`teacher / 123456`
  - 教务：`academic_admin / 123456`

## 三、环境

当前项目依赖的环境如下：

- 运行环境
  - `Node.js 18+`
  - 当前项目已验证版本：`24.14.1`
- 包管理环境
  - `pnpm`
  - 当前项目已验证版本：`10.33.4`
  - 推荐通过 `Corepack` 调用
- 前端构建环境
  - `Vite 5.3.2`
  - `TypeScript 5.5.2`
  - `Vue 3.4.31`
- 样式处理环境
  - `Sass 1.77.6`
  - `PostCSS 8.4.38`
  - `Tailwind CSS 3.4.17`
- 代码校验环境
  - `ESLint 8.57.0`
  - `Prettier 3.3.2`
  - `Stylelint 16.6.1`

已提供 PowerShell 脚本，可以直接安装前端依赖，并提示需要另外安装的系统环境（例如Node.js, Git）：

[`setup-frontend-env.ps1`](./setup-frontend-env.ps1)

推荐执行方式：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-frontend-env.ps1
```

说明：

- 脚本负责安装仓库内的前端依赖，即 `node_modules` 中的内容
- 脚本不负责安装操作系统级运行时，例如 `Node.js`
- 如果本机 `pnpm` 命令不可用，统一使用 `corepack pnpm`

## 四、启动方式

```bash
pnpm install
pnpm dev
```

## 五、统一网关与接口约定

前端公共分支参考第一组 `au12321ua/STSS-gateway`，统一约定所有后端请求先经过 STSS Gateway，不在页面或业务模块里直接写各组后端地址。

### 1. 开发环境

第一组 Gateway 默认监听：

```text
http://localhost:8000
```

前端开发环境保持同源请求，Vite 负责代理：

```env
VITE_API_URL = ""
VITE_PROXY = [["/api","http://localhost:8000",false],["/auth","http://localhost:8000",false]]
```

第三项 `false` 表示保留 `/api` 或 `/auth` 前缀。例如前端请求：

```text
/api/v1/grade/transcripts
```

实际会转发到：

```text
http://localhost:8000/api/v1/grade/transcripts
```

### 2. 公共接口前缀

所有业务组请从 `src/api/config/servicePort.ts` 引入自己的公共前缀，不要在页面中写死完整 URL：

```ts
export const AUTH_API = "/auth";
export const GATEWAY_HEALTH_API = "/api/v1/health";
export const BASE_INFO_API = "/api/v1/info";
export const SCHEDULE_API = "/api/v1/schedule";
export const COURSE_SELECTION_API = "/api/v1/course-selection";
export const FORUM_API = "/api/v1/forum";
export const ONLINE_TEST_API = "/api/v1/online-test";
export const GRADE_API = "/api/v1/grade";
```

示例：

```ts
import http from "@/api";
import { GRADE_API } from "@/api/config/servicePort";

export const getTranscript = (params: object) => {
  return http.get(`${GRADE_API}/transcripts`, params);
};
```

### 3. 当前 Gateway 状态

已从第一组 Gateway 仓库确认：

- 网关默认端口：`8000`
- 健康检查：`GET /api/v1/health`
- 鉴权入口：`/auth/login`、`/auth/logout`、`/auth/me`、`/auth/refresh`、`/auth/change-password`
- 已明确代理：`/api/v1/auth/*`、`/api/v1/info/*`
- `/api/v1/internal/*` 禁止外部访问
- 网关注入下游请求头：`X-User-Id`、`X-User-Role`、`X-User-Permissions`、`X-Request-ID`

目前第一组 Gateway 还没有明确配置以下业务路由，各组后端接入前需要和第一组确认并补齐：

```text
/api/v1/schedule/**
/api/v1/course-selection/**
/api/v1/forum/**
/api/v1/online-test/**
/api/v1/grade/**
```

建议第一组在 Gateway 中为每个业务组补独立 upstream、环境变量和 Nginx location，避免这些路径落到 `info_service` 或 404。

### 4. 各组接口开发要求

- 页面中不要直接写 `axios`，统一在 `src/api/modules/<group>.ts` 封装接口。
- 不要写死 `http://localhost:xxxx`、`http://127.0.0.1:xxxx` 或各组后端端口。
- 不要自行新增另一套请求封装；统一使用 `src/api/index.ts`。
- 业务成功码统一支持 `0`、`"0"`、`200`、`"200"`。
- 错误消息统一支持后端返回的 `msg`、`message`、`error` 字段。
- 如果某个接口返回值没有标准 `code`，可以在请求配置里使用 `{ skipCodeCheck: true }`，但需要在接口函数旁注明原因。

## 六、当前模板能力

- 统一登录页
- 三角色本地鉴权与菜单控制
- 顶部消息中心
- 统一页头、侧栏、页脚、水印
- 菜单未开发页面的占位页兜底
- 公共个人信息 / 修改密码入口

## 七、各组同学的开发边界参考

- 总原则：各组只改自己负责的业务页面目录、对应接口目录、对应类型目录，不改公共壳层。
- 每个业务组现在都可以在自己目录下维护本板块的菜单细分页面名称，具体文件为 `src/views/stss/<group>/menu.ts`。
- 页面相关的局部组件、局部 hooks、局部 mock 数据，优先放在自己业务目录下，不要直接往 `src/components/**` 和 `src/hooks/**` 塞公共代码。
- 如果需要新增页面，建议统一按下面结构创建：

```text
src/views/stss/<group>/<module>/index.vue
src/views/stss/<group>/<module>/components/**
src/views/stss/<group>/<module>/hooks/**
src/views/stss/<group>/<module>/types.ts
src/views/stss/<group>/<module>/mock.ts
src/views/stss/<group>/<module>/index.scss
```

- 目前已经在各组的文件夹中新建了一些空白文件，各组同学可以视需要进行增删

### 基础信息管理组 分支feat/base-info

- 负责边界：用户与档案、课程/教师/教室、学期校历、培养方案、权限与回收站，以及个人中心。
- 个人中心归这个组负责，包含个人资料、头像、联系方式、密码等“用户自己可维护”的信息页面。
- 允许改动：
  - `src/views/stss/base-info/**`
  - `src/views/stss/base-info/menu.ts`
  - `src/views/stss/base-info/profile/**`
  - `src/api/modules/baseInfo.ts`
  - `src/api/interface/baseInfo.ts`
  - 如需拆分个人中心接口，可新增 `src/api/modules/profile.ts`
  - 如需拆分个人中心类型，可新增 `src/api/interface/profile.ts`

### 排课管理组 分支feat/schedule

- 负责边界：教学资源、排课规则、自动排课、手工调课、课表发布、课表查询等页面。
- 允许改动：
  - `src/views/stss/schedule/**`
  - `src/views/stss/schedule/menu.ts`
  - `src/api/modules/schedule.ts`
  - `src/api/interface/schedule.ts`

### 智能选课组 分支feat/course-selection

- 负责边界：培养方案校验、课程检索、选课/退课、我的选课、我的课表、AI 选课助手、任课花名册、选课窗口、容量管理、选课监控等页面。
- 允许改动：
  - `src/views/stss/course-selection/**`
  - `src/views/stss/course-selection/menu.ts`
  - `src/api/modules/courseSelection.ts`
  - `src/api/interface/courseSelection.ts`

### 论坛交流组 分支feat/forum

- 负责边界：公告、课程论坛、发帖/回帖、内容审核、帖子检索等页面。
- 允许改动：
  - `src/views/stss/forum/**`
  - `src/views/stss/forum/menu.ts`
  - `src/api/modules/forum.ts`
  - `src/api/interface/forum.ts`

### 在线测试组 分支feat/online-test

- 负责边界：题库管理、组卷管理、考试入口、阅卷与发布、测试分析等页面。
- 允许改动：
  - `src/views/stss/online-test/**`
  - `src/views/stss/online-test/menu.ts`
  - `src/api/modules/onlineTest.ts`
  - `src/api/interface/onlineTest.ts`

### 成绩管理组 分支feat/score

- 负责边界：成绩录入、成绩查询、改分申请、改分审批、学分进展、个人成绩统计、课程成绩分析等页面。
- 允许改动：
  - `src/views/stss/score/**`
  - `src/views/stss/score/menu.ts`
  - `src/api/modules/score.ts`
  - `src/api/interface/score.ts`

### 默认不建议各组改动的模板演示目录

- `src/views/system/**`
- `src/views/auth/**`
- `src/views/dashboard/**`
- `src/views/dataScreen/**`
- `src/views/directives/**`
- `src/views/echarts/**`
- `src/views/form/**`
- `src/views/link/**`
- `src/views/menu/**`
- `src/views/proTable/**`
- `src/views/assembly/**`

## 八、前端协作约定

这部分除了`1. 不要随意改的公共文件`之外，仅供参考

在各组自己的开发范围内，不符合约定的改动可以尝试，只要最终成果ok并且不影响其他组功能，就可以使用。

2-6小点是AI给出的规定，可以视作**开发建议**。

### 1. 不要随意改的公共文件

- 以下内容由前端组长统一维护，不建议同学们直接改动；如果业务确实需要调整，请先沟通。
- `src/layouts/**`
- `src/layouts/components/**`
- `src/routers/**`
- `src/stores/**`
- `src/constants/mockAuth.ts`
- `src/components/**`
- `src/styles/**`
- `src/api/index.ts`
- `src/api/helper/**`
- `src/api/config/**`
- `src/config/**`
- `src/main.ts`
- `src/App.vue`
- `src/views/login/**`
- `src/views/home/**`
- `vite.config.ts`
- `tailwind.config.cjs`
- `postcss.config.cjs`
- `tsconfig.json`
- `.env*`
- `package.json`
- `README.md`
- `setup-frontend-env.ps1`

这些部分分别涉及：布局壳层、角色菜单、路由注入、登录态、公共组件、全局样式、请求封装、环境配置与协作规范。

### 2. 页面目录约定

每个页面保持如下结构：

```text
src/views/stss/<group>/<module>/index.vue
```

示例：

```text
src/views/stss/forum/notices/index.vue
src/views/stss/score/query/index.vue
```

### 3. 页面开发最低要求

每个业务页面至少包含：

- 页面标题
- 当前模块说明
- 基础筛选区或操作区
- 表格 / 卡片 / 表单主体
- 空状态或无数据状态

### 4. 样式约定

- 允许同时使用 `Element Plus` 和 `Tailwind`
- 布局优先用现有壳层，不重复造整体框架
- 页面局部样式优先写在当前页面内
- 全局变量和通用样式修改前先沟通

### 5. 接口约定

当前阶段默认允许：

- 先写静态页面
- 先写本地 mock 数据
- 后续再统一切换真实接口

建议每组接口文件放在：

```text
src/api/modules/<group>.ts
```

### 5.1 最终接后端的统一方式

- 前端只连统一网关，不直接连各组私有服务地址
- 环境基地址统一走 `VITE_API_URL`
- 开发环境统一通过 `VITE_PROXY` 转发
- 页面组件禁止直接写 `axios`
- 所有请求统一走 `src/api/index.ts`
- 所有业务请求统一封装在 `src/api/modules/*.ts`
- 所有返回类型统一写在 `src/api/interface/*.ts` 或 `src/api/interface/index.ts`

推荐接法：

```text
页面 -> src/api/modules/<group>.ts -> src/api/index.ts -> /auth 或 /api/v1/<module> -> STSS Gateway -> 后端各服务
```

推荐接口前缀：

- `/auth`
- `/api/v1/info`
- `/api/v1/schedule`
- `/api/v1/course-selection`
- `/api/v1/forum`
- `/api/v1/online-test`
- `/api/v1/grade`

### 5.2 前后端响应格式统一

如果后端还没完全定协议，建议直接按当前前端请求封装来统一：

对应前端公共类型文件：

- `src/api/interface/index.ts`

```ts
interface Result<T> {
  code: string;
  msg: string;
  data: T;
}
```

分页数据统一：

对应前端公共类型文件：

- `src/api/interface/index.ts`

```ts
interface PageResult<T> {
  list: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}
```

### 5.3 认证头统一

当前前端公共请求层已经兼容两种写法：

- `Authorization: Bearer <token>`
- `x-access-token: <token>`

最终建议后端统一收敛到标准写法：

```text
Authorization: Bearer <token>
```

这样后续如果接网关、鉴权中间件、Swagger、OpenAPI 都更方便。

### 5.4 每组接后端时的代码写法

禁止在页面里这样写：

错误示例所在位置：

- 任何业务页面文件，例如 `src/views/stss/forum/posts/index.vue`

```ts
axios.get("/api/v1/forum/posts");
```

应该统一写成：

接口封装文件位置：

- `src/api/modules/forum.ts`
- 其他业务组同理，统一写在 `src/api/modules/<group>.ts`

```ts
// src/api/modules/forum.ts
import http from "@/api";
import { FORUM_API } from "@/api/config/servicePort";

export const getForumPostListApi = (params: Forum.ReqPostList) => {
  return http.get<Forum.ResPostList>(`${FORUM_API}/posts`, params);
};
```

然后页面里只调用：

页面调用位置：

- 业务页面文件，例如 `src/views/stss/forum/posts/index.vue`

```ts
const { data } = await getForumPostListApi(params);
```

### 5.5 联调阶段建议

- 第一步：每组先用本地 mock 数据把页面跑通
- 第二步：后端给出接口文档和字段定义
- 第三步：只改 `src/api/modules/*.ts` 和类型定义，不大改页面
- 第四步：统一通过网关联调

这样做的目的就是让页面层尽量不感知后端切换。

### 6. 命名约定

- 组件名：大驼峰
- 路由名：小驼峰
- 目录名：短横线
- store 字段：小驼峰

## 九、开发流程建议

如果进入并行开发阶段，优先顺序建议是：

1. 每组先把自己所有页面壳子补齐
2. 再补表格、表单、详情抽屉
3. 再补本地 mock 数据
4. 最后统一联调接口
