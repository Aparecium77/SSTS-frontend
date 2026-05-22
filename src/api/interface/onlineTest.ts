/**
 * 在线测试组的同学在这里补充在线测试相关类型。
 * 建议把题目、试卷、考试记录、阅卷结果、统计结果等类型定义在这里。
 */
export namespace OnlineTest {
  export interface ListQuery {
    pageNum: number;
    pageSize: number;
    keyword?: string;
  }

  export interface PaperItem {
    id: string;
    title: string;
  }
}
