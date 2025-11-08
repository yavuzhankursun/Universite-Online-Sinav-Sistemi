import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startExam, submitExam, getExamDetails } from '../../services/studentService';
import Timer from '../shared/Timer';
import QuestionCard from '../shared/QuestionCard';

function ExamTaking() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeExam();
  }, [examId]);

  const initializeExam = async () => {
    setLoading(true);
    setError('');
    try {
      // Önce sınava başlamayı dene
      // startExam zaten mevcut attempt varsa hata verir, o zaman getExamDetails çağır
      try {
        const data = await startExam(parseInt(examId));
        // Yeni sınav başlatıldı
        setExam(data.exam || { duration_minutes: data.duration_minutes || 10 });
        setQuestions(data.questions || []);
        setAttemptStarted(true);
      } catch (startErr) {
        // Eğer sınava zaten başlanmışsa, mevcut attempt'i yükle
        if (startErr.response?.status === 400 || startErr.response?.status === 409) {
          // Mevcut attempt var, detayları yükle
          const details = await getExamDetails(parseInt(examId));
          setExam(details.exam);
          setQuestions(details.questions);
          setAttemptStarted(true);
          // Mevcut cevapları yükle
          const existingAnswers = {};
          details.questions.forEach(q => {
            if (q.selected_option_id) {
              existingAnswers[q.id] = q.selected_option_id;
            }
          });
          setAnswers(existingAnswers);
        } else {
          // Başka bir hata
          throw startErr;
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sınav yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    const newAnswers = { ...answers };
    if (optionId === null) {
      delete newAnswers[questionId];
    } else {
      newAnswers[questionId] = optionId;
    }
    setAnswers(newAnswers);
    setWarning(''); // Uyarıyı temizle
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setWarning('');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setWarning('');
    }
  };

  const handleGoToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      setWarning('');
    }
  };

  const handleSubmit = async () => {
    // Cevaplanmamış soru kontrolü
    const unansweredCount = questions.length - Object.keys(answers).length;
    let confirmMessage = 'Sınavı göndermek istediğinize emin misiniz?';
    if (unansweredCount > 0) {
      confirmMessage = `${unansweredCount} soru cevaplanmamış. Yine de göndermek istiyor musunuz?`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSubmitting(true);
    setError('');
    setWarning('');

    try {
      // Tüm sorular için cevap dizisi oluştur
      const answersArray = questions.map(question => ({
        question_id: question.id,
        selected_option_id: answers[question.id] ? parseInt(answers[question.id]) : null
      }));

      await submitExam(parseInt(examId), answersArray);
      navigate(`/student/exams/${examId}/result`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Sınav gönderilemedi';
      setError(errorMsg);
      setSubmitting(false);
      // Hata durumunda submit butonunu tekrar aktif et
    }
  };

  const handleTimeUp = () => {
    setWarning('Süre doldu! Sınav otomatik olarak gönderiliyor...');
    handleSubmit();
  };

  // Cevaplanmış soru sayısı
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const currentQuestion = questions[currentQuestionIndex];

  if (!attemptStarted) {
    return React.createElement('div', { className: 'exam-taking' },
      error ? React.createElement('div', { className: 'error-message' }, error) :
      React.createElement('p', null, 'Sınav hazırlanıyor...')
    );
  }

  return React.createElement('div', { className: 'exam-taking' },
    React.createElement('div', { className: 'exam-header' },
      React.createElement('div', { className: 'exam-title' },
        React.createElement('h1', null, exam?.course?.code || 'Sınav'),
        React.createElement('p', { className: 'exam-info' }, `${questions.length} soru`)
      ),
      React.createElement('div', { className: 'exam-timer-section' },
        React.createElement(Timer, {
          durationMinutes: exam?.duration_minutes || 10,
          onTimeUp: handleTimeUp
        }),
        React.createElement('div', { className: 'answer-progress' },
          React.createElement('span', null, `Cevaplanan: ${answeredCount}/${questions.length}`),
          unansweredCount > 0 && React.createElement('span', { className: 'unanswered-warning' }, 
            ` (${unansweredCount} boş)`
          )
        )
      )
    ),

    error && React.createElement('div', { className: 'error-message' }, error),
    warning && React.createElement('div', { className: 'warning-message' }, warning),

    React.createElement('div', { className: 'exam-content-wrapper' },
      // Soru navigasyon sidebar'ı
      React.createElement('div', { className: 'question-navigation' },
        React.createElement('h3', null, 'Sorular'),
        React.createElement('div', { className: 'question-grid' },
          questions.map((question, index) => {
            const isAnswered = answers[question.id] !== undefined;
            const isCurrent = index === currentQuestionIndex;
            return React.createElement('button', {
              key: question.id,
              className: `question-nav-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : 'unanswered'}`,
              onClick: () => handleGoToQuestion(index),
              title: `Soru ${index + 1}${isAnswered ? ' (Cevaplandı)' : ' (Boş)'}`
            }, index + 1);
          })
        ),
        React.createElement('div', { className: 'question-legend', style: { marginTop: '1rem', fontSize: '0.85rem' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' } },
            React.createElement('span', { className: 'question-nav-btn answered', style: { marginRight: '0.5rem', cursor: 'default' } }, '1'),
            React.createElement('span', null, 'Cevaplanan')
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
            React.createElement('span', { className: 'question-nav-btn unanswered', style: { marginRight: '0.5rem', cursor: 'default' } }, '1'),
            React.createElement('span', null, 'Boş')
          )
        )
      ),

      // Ana soru alanı
      React.createElement('div', { className: 'question-main-area' },
        currentQuestion && React.createElement('div', { className: 'question-wrapper' },
          React.createElement('div', { className: 'question-header-bar' },
            React.createElement('h2', null, `Soru ${currentQuestionIndex + 1} / ${questions.length}`),
            React.createElement('span', { className: 'question-status' },
              answers[currentQuestion.id] ? '✓ Cevaplandı' : '○ Boş'
            )
          ),
          React.createElement(QuestionCard, {
            question: currentQuestion,
            selectedOptionId: answers[currentQuestion.id],
            onSelectOption: handleSelectOption,
            allowClear: true
          })
        ),

        // Navigasyon butonları
        React.createElement('div', { className: 'question-navigation-buttons' },
          React.createElement('button', {
            className: 'btn btn-secondary',
            onClick: handlePreviousQuestion,
            disabled: currentQuestionIndex === 0 || submitting
          }, '← Önceki Soru'),
          React.createElement('span', { className: 'question-counter' },
            `${currentQuestionIndex + 1} / ${questions.length}`
          ),
          React.createElement('button', {
            className: 'btn btn-secondary',
            onClick: handleNextQuestion,
            disabled: currentQuestionIndex === questions.length - 1 || submitting
          }, 'Sonraki Soru →')
        )
      )
    ),

    // Alt bilgi ve gönder butonu
    React.createElement('div', { className: 'exam-footer' },
      React.createElement('div', { className: 'exam-summary' },
        React.createElement('p', null, `Toplam Soru: ${questions.length}`),
        React.createElement('p', { className: answeredCount === questions.length ? 'all-answered' : '' },
          `Cevaplanan: ${answeredCount}`
        ),
        unansweredCount > 0 && React.createElement('p', { className: 'unanswered-warning' },
          `Cevaplanmayan: ${unansweredCount}`
        )
      ),
      React.createElement('button', {
        className: 'btn btn-primary btn-large',
        onClick: handleSubmit,
        disabled: submitting || loading
      }, submitting ? 'Gönderiliyor...' : 'Sınavı Gönder')
    )
  );
}

export default ExamTaking;

