import React, { useState, useEffect } from 'react';
import { getMyExams, getExamQuestions, updateQuestion, deleteQuestion, addQuestion } from '../../services/instructorService';

function QuestionManagement() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    points: 1.0,
    answer_options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadQuestions();
    }
  }, [selectedExam]);

  const loadExams = async () => {
    try {
      const data = await getMyExams();
      setExams(data);
    } catch (err) {
      setError('Sınavlar yüklenemedi');
    }
  };

  const loadQuestions = async () => {
    if (!selectedExam) return;
    setLoading(true);
    try {
      const data = await getExamQuestions(selectedExam.id);
      setQuestions(data.questions || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Sorular yüklenemedi');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = (examId) => {
    const exam = exams.find(e => e.id === examId);
    setSelectedExam(exam);
    setEditingQuestion(null);
    setShowAddForm(false);
  };

  const handleAddOption = () => {
    setQuestionForm({
      ...questionForm,
      answer_options: [...questionForm.answer_options, { option_text: '', is_correct: false }]
    });
  };

  const handleRemoveOption = (index) => {
    if (questionForm.answer_options.length <= 2) {
      setError('En az 2 cevap seçeneği gereklidir');
      return;
    }
    const newOptions = questionForm.answer_options.filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, answer_options: newOptions });
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowAddForm(false);
    setQuestionForm({
      question_text: question.question_text,
      points: question.points,
      answer_options: question.answer_options.map(opt => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct
      }))
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setShowAddForm(false);
    setQuestionForm({
      question_text: '',
      points: 1.0,
      answer_options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
    setError('');
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExam) {
      setError('Önce bir sınav seçin');
      return;
    }

    // Validasyon
    if (!questionForm.question_text.trim()) {
      setError('Soru metni gereklidir');
      return;
    }

    if (questionForm.answer_options.length < 2) {
      setError('En az 2 cevap seçeneği gereklidir');
      return;
    }

    const correctCount = questionForm.answer_options.filter(opt => opt.is_correct).length;
    if (correctCount === 0) {
      setError('En az bir doğru cevap seçeneği gereklidir');
      return;
    }

    const emptyOptions = questionForm.answer_options.filter(opt => !opt.option_text.trim());
    if (emptyOptions.length > 0) {
      setError('Tüm cevap seçenekleri doldurulmalıdır');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionForm);
        setSuccess('Soru başarıyla güncellendi');
      } else {
        await addQuestion(selectedExam.id, questionForm);
        setSuccess('Soru başarıyla eklendi');
      }
      
      handleCancelEdit();
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.error || (editingQuestion ? 'Soru güncellenemedi' : 'Soru eklenemedi'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteQuestion(questionId);
      setSuccess('Soru başarıyla silindi');
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.error || 'Soru silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { className: 'question-management' },
    React.createElement('h1', null, 'Soru Yönetimi'),
    
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Sınav Seçin'),
      React.createElement('select', {
        value: selectedExam?.id || '',
        onChange: (e) => handleExamSelect(parseInt(e.target.value)),
        className: 'form-control',
        style: { marginBottom: '1rem' }
      },
        React.createElement('option', { value: '' }, 'Sınav Seçin'),
        exams.map(exam =>
          React.createElement('option', { key: exam.id, value: exam.id },
            `${exam.course?.code || 'Bilinmeyen'} - ${exam.exam_type} (${new Date(exam.start_time).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })})`
          )
        )
      ),
      
      selectedExam && React.createElement('div', { className: 'exam-info' },
        React.createElement('p', null, `Ders: ${selectedExam.course?.code || 'Bilinmeyen'} - ${selectedExam.course?.name || ''}`),
        React.createElement('p', null, `Sınav Tipi: ${selectedExam.exam_type}`),
        React.createElement('p', null, `Toplam Soru: ${questions.length}`),
        questions.length < 5 && React.createElement('p', { className: 'warning-text' }, 
          `⚠ En az 5 soru gereklidir (Şu an: ${questions.length})`
        )
      )
    ),

    error && React.createElement('div', { className: 'error-message' }, error),
    success && React.createElement('div', { className: 'success-message' }, success),

    selectedExam && React.createElement('div', { className: 'card', style: { marginTop: '2rem' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } },
        React.createElement('h2', null, 'Sorular'),
        !editingQuestion && React.createElement('button', {
          className: 'btn btn-primary',
          onClick: () => {
            setShowAddForm(true);
            setEditingQuestion(null);
            setQuestionForm({
              question_text: '',
              points: 1.0,
              answer_options: [
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false }
              ]
            });
          }
        }, 'Yeni Soru Ekle')
      ),

      loading && !questions.length ? React.createElement('p', null, 'Yükleniyor...') :
      questions.length === 0 ? React.createElement('p', null, 'Henüz soru eklenmemiş') :
      React.createElement('div', { className: 'questions-list' },
        questions.map((question, index) =>
          React.createElement('div', { key: question.id, className: 'question-item' },
            React.createElement('div', { className: 'question-header' },
              React.createElement('h3', null, `Soru ${index + 1}`),
              React.createElement('span', { className: 'question-points' }, `${question.points} puan`),
              React.createElement('div', { className: 'question-actions' },
                React.createElement('button', {
                  className: 'btn btn-secondary',
                  onClick: () => handleEditQuestion(question),
                  style: { marginRight: '0.5rem' }
                }, 'Düzenle'),
                React.createElement('button', {
                  className: 'btn btn-danger',
                  onClick: () => handleDeleteQuestion(question.id),
                  disabled: questions.length <= 5
                }, 'Sil')
              )
            ),
            React.createElement('p', { className: 'question-text' }, question.question_text),
            React.createElement('div', { className: 'answer-options-display' },
              question.answer_options.map((option, optIndex) =>
                React.createElement('div', {
                  key: option.id,
                  className: `answer-option-display ${option.is_correct ? 'correct' : ''}`
                },
                  React.createElement('span', { className: 'option-number' }, `${optIndex + 1}.`),
                  React.createElement('span', null, option.option_text),
                  option.is_correct && React.createElement('span', { className: 'correct-badge' }, '✓ Doğru')
                )
              )
            )
          )
        )
      ),

      (showAddForm || editingQuestion) && React.createElement('div', { className: 'card', style: { marginTop: '2rem', backgroundColor: '#f9f9f9' } },
        React.createElement('h2', null, editingQuestion ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'),
        React.createElement('form', { onSubmit: handleQuestionSubmit },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Soru Metni *'),
            React.createElement('textarea', {
              value: questionForm.question_text,
              onChange: (e) => setQuestionForm({ ...questionForm, question_text: e.target.value }),
              rows: 4,
              required: true,
              placeholder: 'Soru metnini buraya yazın...'
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Puan *'),
            React.createElement('input', {
              type: 'number',
              value: questionForm.points,
              onChange: (e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) || 0 }),
              min: 0.1,
              step: 0.1,
              required: true
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', null, 'Cevap Seçenekleri *'),
            questionForm.answer_options.map((option, index) =>
              React.createElement('div', { key: index, className: 'answer-option-edit' },
                React.createElement('input', {
                  type: 'text',
                  value: option.option_text,
                  onChange: (e) => {
                    const newOptions = [...questionForm.answer_options];
                    newOptions[index].option_text = e.target.value;
                    setQuestionForm({ ...questionForm, answer_options: newOptions });
                  },
                  placeholder: `Seçenek ${index + 1}`,
                  required: true,
                  className: 'option-input'
                }),
                React.createElement('label', { className: 'checkbox-label' },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: option.is_correct,
                    onChange: (e) => {
                      const newOptions = [...questionForm.answer_options];
                      newOptions[index].is_correct = e.target.checked;
                      setQuestionForm({ ...questionForm, answer_options: newOptions });
                    }
                  }),
                  'Doğru'
                ),
                questionForm.answer_options.length > 2 && React.createElement('button', {
                  type: 'button',
                  className: 'btn btn-danger btn-small',
                  onClick: () => handleRemoveOption(index)
                }, '✕')
              )
            ),
            React.createElement('div', { style: { marginTop: '1rem' } },
              React.createElement('button', {
                type: 'button',
                className: 'btn btn-secondary',
                onClick: handleAddOption
              }, '+ Seçenek Ekle')
            )
          ),
          React.createElement('div', { className: 'form-actions', style: { marginTop: '1.5rem' } },
            React.createElement('button', {
              type: 'submit',
              className: 'btn btn-primary',
              disabled: loading
            }, loading ? 'Kaydediliyor...' : (editingQuestion ? 'Güncelle' : 'Ekle')),
            React.createElement('button', {
              type: 'button',
              className: 'btn btn-secondary',
              onClick: handleCancelEdit,
              style: { marginLeft: '1rem' }
            }, 'İptal')
          )
        )
      )
    )
  );
}

export default QuestionManagement;

