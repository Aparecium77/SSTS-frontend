/**
 * 论坛交流组的同学在这里补充论坛交流相关类型。
 * 建议把公告、帖子、回复、审核记录、检索条件等类型定义在这里。
 */
export namespace Forum {
  export interface ListQuery {
    pageNum: number;
    pageSize: number;
    keyword?: string;
  }

  export interface PostItem {
    id: string;
    title: string;
  }
}
