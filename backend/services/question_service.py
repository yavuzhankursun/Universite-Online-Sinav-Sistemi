import random
from models import Question, AnswerOption


def shuffle_questions(questions):
    """Soruları rastgele sırala"""
    shuffled = list(questions)
    random.shuffle(shuffled)
    return shuffled


def shuffle_answer_options(question):
    """Bir sorunun cevap seçeneklerini rastgele sırala"""
    options = list(question.answer_options)
    random.shuffle(options)
    return options


def get_exam_questions_randomized(exam_id, include_correct=False):
    """Sınav sorularını ve cevaplarını rastgele sırala"""
    questions = Question.query.filter_by(exam_id=exam_id).all()
    shuffled_questions = shuffle_questions(questions)
    
    result = []
    for question in shuffled_questions:
        question_data = {
            'id': question.id,
            'question_text': question.question_text,
            'question_type': question.question_type,
            'points': question.points,
            'answer_options': []
        }
        
        # Cevap seçeneklerini rastgele sırala
        shuffled_options = shuffle_answer_options(question)
        for option in shuffled_options:
            option_data = {
                'id': option.id,
                'option_text': option.option_text
            }
            if include_correct:
                option_data['is_correct'] = option.is_correct
            question_data['answer_options'].append(option_data)
        
        result.append(question_data)
    
    return result

