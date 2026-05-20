/**
 * 成绩管理组的同学在这里补充成绩管理相关类型。
 * 建议把成绩项、改分申请、审批记录、统计结果等类型定义在这里。
 */
export namespace Score {
  export interface ListQuery {
    pageNum: number;
    pageSize: number;
    keyword?: string;
  }

  export interface ScoreItem {
    id: string;
    courseName: string;
    score?: number;
  }
}
