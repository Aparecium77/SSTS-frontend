import type { Score } from "@/api/interface/score";

/** 课程 + 学期联合选择值，避免仅 course_id 跨学期选错 */
export const COURSE_KEY_SEP = "\u001f";

export const toCourseKey = (courseId: string, semester: string) => `${courseId}${COURSE_KEY_SEP}${semester}`;

export const parseCourseKey = (key: string) => {
  const idx = key.indexOf(COURSE_KEY_SEP);
  if (idx < 0) return { courseId: key, semester: "" };
  return { courseId: key.slice(0, idx), semester: key.slice(idx + COURSE_KEY_SEP.length) };
};

export const courseOptionLabel = (course: Pick<Score.Course, "course_id" | "course_name" | "semester">) => {
  const name = course.course_name || course.course_id;
  return `${name} · ${course.semester}`;
};

export const findCourseByKey = (courses: Score.Course[], key: string) => {
  const { courseId, semester } = parseCourseKey(key);
  return courses.find(course => course.course_id === courseId && course.semester === semester);
};

export const syncCourseKey = (courses: Score.Course[], courseId: string, semester: string) => {
  if (!courseId || !semester) return "";
  const exists = courses.some(course => course.course_id === courseId && course.semester === semester);
  return exists ? toCourseKey(courseId, semester) : "";
};
