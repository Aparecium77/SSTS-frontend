/**
 * 基础信息管理组的同学在这里补充基础信息管理相关类型。
 * 建议把页面查询参数、表格行、详情对象、表单对象都定义在这里。
 */
export namespace BaseInfo {
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
