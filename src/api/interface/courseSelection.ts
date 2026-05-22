/**
 * 选课中心组的同学在这里补充选课中心相关类型。
 * 建议把课程列表、选课记录、课表项、花名册、窗口配置等类型定义在这里。
 */
export namespace CourseSelection {
  export interface ListQuery {
    pageNum: number;
    pageSize: number;
    keyword?: string;
  }

  export interface CourseItem {
    id: string;
    courseName: string;
  }
}
