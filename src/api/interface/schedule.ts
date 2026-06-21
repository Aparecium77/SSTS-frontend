/**
 * 排课管理组的同学在这里补充排课管理相关类型。
 * 建议把教学资源、排课规则、课表记录、发布记录等类型定义在这里。
 */
export namespace Schedule {
  export interface ListQuery {
    pageNum: number;
    pageSize: number;
    keyword?: string;
  }

  export interface ListItem {
    id: string;
    name: string;
  }
}
