import type { Score } from "@/api/interface/score";

export const pivotGradeRecords = (students: Score.CourseStudent[], records: Score.GradeRecord[]): Score.GradeRecordRow[] => {
  const byStudent = new Map<string, Score.GradeRecordRow>();

  students.forEach(student => {
    byStudent.set(student.student_id, {
      student_id: student.student_id,
      student_no: student.student_no,
      student_name: student.student_name,
      major: student.major,
      records: {}
    });
  });

  records.forEach(record => {
    const row = byStudent.get(record.student_id);
    if (row) row.records[record.component_config_id] = record;
  });

  return Array.from(byStudent.values());
};
