import React, { useState, useEffect } from 'react';
import { getStatistics, getCourseStatistics } from '../../services/departmentHeadService';

function StatisticsView() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const data = await getStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('İstatistikler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'statistics-view' },
      React.createElement('p', null, 'Yükleniyor...')
    );
  }

  if (!statistics) {
    return React.createElement('div', { className: 'statistics-view' },
      React.createElement('p', null, 'İstatistikler yüklenemedi')
    );
  }

  return React.createElement('div', { className: 'statistics-view' },
    React.createElement('h1', null, 'İstatistikler'),
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Genel İstatistikler'),
      React.createElement('div', { className: 'statistics-grid' },
        React.createElement('div', { className: 'stat-card' },
          React.createElement('h3', null, 'Toplam Öğrenci'),
          React.createElement('p', { className: 'stat-value' }, statistics.general_statistics.total_students)
        ),
        React.createElement('div', { className: 'stat-card' },
          React.createElement('h3', null, 'Toplam Öğretim Üyesi'),
          React.createElement('p', { className: 'stat-value' }, statistics.general_statistics.total_instructors)
        ),
        React.createElement('div', { className: 'stat-card' },
          React.createElement('h3', null, 'Toplam Ders'),
          React.createElement('p', { className: 'stat-value' }, statistics.general_statistics.total_courses)
        ),
        React.createElement('div', { className: 'stat-card' },
          React.createElement('h3', null, 'Genel Sınıf Ortalaması'),
          React.createElement('p', { className: 'stat-value' }, `${statistics.overall_class_average}%`)
        )
      )
    ),
    React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('h2', null, 'Ders İstatistikleri'),
      React.createElement('div', { className: 'course-statistics' },
        statistics.course_statistics.map(courseStat =>
          React.createElement('div', { key: courseStat.course.id, className: 'course-stat-card' },
            React.createElement('h3', null, `${courseStat.course.code} - ${courseStat.course.name}`),
            React.createElement('p', null, `Öğrenci Sayısı: ${courseStat.statistics.student_count}`),
            React.createElement('p', null, `Sınav Sayısı: ${courseStat.statistics.exam_count}`),
            courseStat.statistics.exams.length > 0 &&
            React.createElement('div', { className: 'exam-stats' },
              courseStat.statistics.exams.map(exam =>
                React.createElement('div', { key: exam.exam_id, className: 'exam-stat' },
                  React.createElement('strong', null, `${exam.exam_type}: `),
                  `Ortalama: ${exam.average_percentage}% (${exam.attempt_count} katılım)`
                )
              )
            )
          )
        )
      )
    ),
    statistics.student_grades.length > 0 &&
    React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('h2', null, 'Öğrenci Notları'),
      React.createElement('div', { className: 'student-grades' },
        statistics.student_grades.map(studentGrade =>
          React.createElement('div', { key: studentGrade.student.id, className: 'student-grade-card' },
            React.createElement('h3', null, studentGrade.student.email),
            React.createElement('p', null, `Genel Ortalama: ${studentGrade.overall_average}%`),
            studentGrade.courses.length > 0 &&
            React.createElement('div', { className: 'course-grades' },
              studentGrade.courses.map(courseGrade =>
                React.createElement('div', { key: courseGrade.course.id, className: 'course-grade' },
                  React.createElement('strong', null, `${courseGrade.course.code}: `),
                  `${courseGrade.grade.final_grade}%`
                )
              )
            )
          )
        )
      )
    )
  );
}

export default StatisticsView;

