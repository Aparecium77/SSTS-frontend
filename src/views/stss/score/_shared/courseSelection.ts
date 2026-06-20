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
  const name = course.course_name || "未同步课程名";
  return `${course.course_id} ｜ ${name}`;
};

export const courseDisplayName = (course?: Pick<Score.Course, "course_id" | "course_name"> | null) => {
  if (!course) return "未选择";
  return course.course_name ? `${course.course_id} ｜ ${course.course_name}` : `${course.course_id} ｜ 未同步课程名`;
};

export const uniqueCourseOptions = (courses: Score.Course[]) => {
  const seen = new Set<string>();
  return courses.filter(course => {
    if (!course.course_id || seen.has(course.course_id)) return false;
    seen.add(course.course_id);
    return true;
  });
};

export const semesterOptionsForCourse = (courses: Score.Course[], courseId: string) => {
  const semesters = courses
    .filter(course => !courseId || course.course_id === courseId)
    .map(course => course.semester)
    .filter(Boolean);
  return Array.from(new Set(semesters)).sort((a, b) => b.localeCompare(a));
};

export const findCourseOffering = (courses: Score.Course[], courseId: string, semester: string) => {
  return courses.find(course => course.course_id === courseId && course.semester === semester);
};

export const firstCourseOffering = (courses: Score.Course[], courseId?: string) => {
  return courses.find(course => course.course_id && course.semester && (!courseId || course.course_id === courseId));
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
