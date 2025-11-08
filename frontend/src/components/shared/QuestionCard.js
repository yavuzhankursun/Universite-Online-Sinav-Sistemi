import React from 'react';

function QuestionCard({ question, selectedOptionId, onSelectOption, allowClear = false }) {
  const handleOptionChange = (optionId) => {
    if (selectedOptionId === optionId && allowClear) {
      // Aynı seçeneğe tekrar tıklanırsa temizle
      onSelectOption(question.id, null);
    } else {
      onSelectOption(question.id, optionId);
    }
  };

  return React.createElement('div', { className: 'question-card' },
    React.createElement('div', { className: 'question-header' },
      React.createElement('span', { className: 'question-points' }, `${question.points} puan`)
    ),
    React.createElement('p', { className: 'question-text' }, question.question_text),
    React.createElement('div', { className: 'answer-options' },
      question.answer_options.map(option =>
        React.createElement('label', {
          key: option.id,
          className: `answer-option ${selectedOptionId === option.id ? 'selected' : ''}`
        },
          React.createElement('input', {
            type: 'radio',
            name: `question-${question.id}`,
            value: option.id,
            checked: selectedOptionId === option.id,
            onChange: () => handleOptionChange(option.id)
          }),
          React.createElement('span', null, option.option_text)
        )
      )
    ),
    allowClear && selectedOptionId && React.createElement('button', {
      type: 'button',
      className: 'btn btn-secondary btn-small',
      onClick: () => onSelectOption(question.id, null),
      style: { marginTop: '1rem' }
    }, 'Cevabı Temizle')
  );
}

export default QuestionCard;

