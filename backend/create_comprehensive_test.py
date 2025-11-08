"""
Tam Teşekküllü Test Verileri Oluşturma Scripti
Bu script proje gereksinimlerine göre Türkçe isimlerle test verileri oluşturur.
"""
from app import create_app
from models import db, User, Department, Course, StudentCourse, Exam, Question, AnswerOption, ExamAttempt, StudentAnswer
from datetime import datetime, timedelta, timezone
from utils.timezone import get_istanbul_now, parse_istanbul_datetime, get_istanbul_time

def cleanup_data():
    """Mevcut tüm verileri temizle (admin hariç)"""
    print("Mevcut veriler temizleniyor...")
    
    # Admin kullanıcısını bul ve koru
    admin_user = User.query.filter_by(role='admin').first()
    admin_id = admin_user.id if admin_user else None
    
    # Tüm verileri sil
    StudentAnswer.query.delete()
    ExamAttempt.query.delete()
    AnswerOption.query.delete()
    Question.query.delete()
    Exam.query.delete()
    StudentCourse.query.delete()
    Course.query.delete()
    
    # Admin hariç tüm kullanıcıları sil
    User.query.filter(User.role != 'admin').delete()
    
    # Admin varsa name alanını güncelle
    if admin_user:
        admin_user.name = 'Sistem Yöneticisi'
        db.session.commit()
        print("✓ Admin kullanıcısı korundu ve isim güncellendi")
    
    db.session.commit()
    print("✓ Tüm veriler temizlendi\n")

def create_test_data():
    app = create_app()
    with app.app_context():
        # Verileri temizle
        cleanup_data()
        
        print("=" * 60)
        print("TEST VERİLERİ OLUŞTURULUYOR")
        print("=" * 60 + "\n")
        
        # 1. Departmanlar
        dept1 = Department.query.filter_by(code='BM').first()
        if not dept1:
            dept1 = Department(name='Bilgisayar Mühendisliği', code='BM')
            db.session.add(dept1)
            db.session.flush()
        print(f"✓ Departman: {dept1.name} ({dept1.code})")
        
        dept2 = Department.query.filter_by(code='YM').first()
        if not dept2:
            dept2 = Department(name='Yazılım Mühendisliği', code='YM')
            db.session.add(dept2)
            db.session.flush()
        print(f"✓ Departman: {dept2.name} ({dept2.code})")
        
        # 2. Admin (varsa güncelle, yoksa oluştur)
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            admin = User(email='admin@university.edu', role='admin', name='Sistem Yöneticisi')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.flush()
        else:
            admin.name = 'Sistem Yöneticisi'
            db.session.commit()
        print(f"✓ Admin: {admin.name} ({admin.email})")
        
        # 3. Bölüm Başkanı
        dept_head = User.query.filter_by(role='department_head').first()
        if not dept_head:
            dept_head = User(
                email='bolumbaskani@university.edu',
                role='department_head',
                name='Prof. Dr. Ahmet Yılmaz'
            )
            dept_head.set_password('bolumbaskani123')
            db.session.add(dept_head)
            db.session.flush()
        else:
            dept_head.name = 'Prof. Dr. Ahmet Yılmaz'
        print(f"✓ Bölüm Başkanı: {dept_head.name} ({dept_head.email})")
        
        # 4. Öğretim Üyeleri (Minimum 2)
        instructor_names = [
            'Doç. Dr. Mehmet Demir',
            'Dr. Öğr. Üyesi Ayşe Kaya'
        ]
        instructors = []
        for i, name in enumerate(instructor_names, 1):
            instructor = User.query.filter_by(email=f'ogretimuyesi{i}@university.edu').first()
            if not instructor:
                instructor = User(
                    email=f'ogretimuyesi{i}@university.edu',
                    role='instructor',
                    name=name
                )
                instructor.set_password('ogretimuyesi123')
                db.session.add(instructor)
                db.session.flush()
            else:
                instructor.name = name
            instructors.append(instructor)
            print(f"✓ Öğretim Üyesi {i}: {instructor.name} ({instructor.email})")
        
        # 5. Öğrenciler (Minimum 10)
        student_names = [
            'Ali Veli',
            'Fatma Yılmaz',
            'Mustafa Özkan',
            'Zeynep Şahin',
            'Emre Kaya',
            'Elif Demir',
            'Can Yıldız',
            'Seda Arslan',
            'Burak Çelik',
            'Ayşe Doğan'
        ]
        students = []
        for i, name in enumerate(student_names, 1):
            student = User.query.filter_by(email=f'ogrenci{i}@university.edu').first()
            if not student:
                student = User(
                    email=f'ogrenci{i}@university.edu',
                    role='student',
                    name=name
                )
                student.set_password('ogrenci123')
                db.session.add(student)
                db.session.flush()
            else:
                student.name = name
            students.append(student)
            print(f"✓ Öğrenci {i}: {student.name} ({student.email})")
        
        db.session.commit()
        
        # 6. Dersler (Minimum 4)
        course_data = [
            ('BM101', 'Programlama Temelleri', dept1.id, instructors[0].id),
            ('BM102', 'Veri Yapıları ve Algoritmalar', dept1.id, instructors[0].id),
            ('YM201', 'Yazılım Mühendisliği', dept2.id, instructors[1].id),
            ('YM202', 'Veritabanı Sistemleri', dept2.id, instructors[1].id)
        ]
        courses = []
        for code, name, dept_id, inst_id in course_data:
            course = Course.query.filter_by(code=code).first()
            if not course:
                course = Course(
                    code=code,
                    name=name,
                    department_id=dept_id,
                    instructor_id=inst_id
                )
                db.session.add(course)
                db.session.flush()
            courses.append(course)
            print(f"✓ Ders: {course.code} - {course.name}")
        
        db.session.commit()
        
        # 7. Öğrenci-Ders Atamaları (Her öğrenciye min 2 ders, her akademisyenden en az 1)
        print("\nÖğrenci-Ders Atamaları:")
        # Her öğrenciye her akademisyenden en az 1 ders garantisi
        # Instructor 0'ın dersleri: courses[0], courses[1]
        # Instructor 1'in dersleri: courses[2], courses[3]
        instructor0_courses = [c for c in courses if c.instructor_id == instructors[0].id]
        instructor1_courses = [c for c in courses if c.instructor_id == instructors[1].id]
        
        for i, student in enumerate(students):
            assigned_courses = []
            
            # Her öğrenciye her akademisyenden en az 1 ders ver
            # Öğrenci indeksine göre farklı kombinasyonlar
            if i < 5:
                # İlk 5 öğrenci: instructor0'dan ilk ders, instructor1'den ilk ders
                assigned_courses = [instructor0_courses[0], instructor1_courses[0]]
            elif i < 8:
                # Sonraki 3 öğrenci: instructor0'dan ikinci ders, instructor1'den ilk ders
                if len(instructor0_courses) > 1:
                    assigned_courses = [instructor0_courses[1], instructor1_courses[0]]
                else:
                    assigned_courses = [instructor0_courses[0], instructor1_courses[0]]
            else:
                # Son 2 öğrenci: instructor0'dan ilk ders, instructor1'den ikinci ders
                if len(instructor1_courses) > 1:
                    assigned_courses = [instructor0_courses[0], instructor1_courses[1]]
                else:
                    assigned_courses = [instructor0_courses[0], instructor1_courses[0]]
            
            for course in assigned_courses:
                if not StudentCourse.query.filter_by(student_id=student.id, course_id=course.id).first():
                    sc = StudentCourse(student_id=student.id, course_id=course.id)
                    db.session.add(sc)
            print(f"✓ {student.name}: {', '.join([c.code for c in assigned_courses])} (Her akademisyenden en az 1 ders)")
        
        db.session.commit()
        
        # Akademisyen ders kontrolü
        print("\nAkademisyen Ders Kontrolü:")
        for i, instructor in enumerate(instructors):
            instructor_courses = Course.query.filter_by(instructor_id=instructor.id).all()
            print(f"✓ {instructor.name}: {len(instructor_courses)} ders ({', '.join([c.code for c in instructor_courses])})")
            if len(instructor_courses) < 2:
                print(f"  ⚠ Uyarı: {instructor.name} için minimum 2 ders gereklidir!")
        
        # 8. Sınavlar ve Sorular
        print("\nSınavlar ve Sorular Oluşturuluyor:")
        
        # İstanbul saatine göre bugünün tarihini al (11:15-11:25)
        from utils.timezone import get_istanbul_time
        istanbul_now = get_istanbul_time()  # İstanbul saatini al (timezone'lu)
        # İstanbul saatine göre 11:15'i ayarla
        today_istanbul = istanbul_now.replace(hour=11, minute=15, second=0, microsecond=0)
        # Eğer saat 11:15'ten geçtiyse yarın için ayarla
        if istanbul_now.hour > 11 or (istanbul_now.hour == 11 and istanbul_now.minute >= 15):
            today_istanbul = today_istanbul + timedelta(days=1)
        
        # UTC'ye çevir (veritabanı için)
        today_istanbul_utc = today_istanbul.astimezone(timezone.utc).replace(tzinfo=None)
        test_exam_end_utc = (today_istanbul + timedelta(minutes=10)).astimezone(timezone.utc).replace(tzinfo=None)  # 11:15-11:25 İstanbul saati
        
        # Her ders için vize ve final
        for course in courses:
            # Vize sınavı
            vize = Exam.query.filter_by(course_id=course.id, exam_type='vize').first()
            if not vize:
                vize = Exam(
                    course_id=course.id,
                    instructor_id=course.instructor_id,
                    exam_type='vize',
                    start_time=today_istanbul_utc,
                    end_time=test_exam_end_utc,
                    duration_minutes=10,
                    weight_percentage=40.0
                )
                db.session.add(vize)
                db.session.flush()
            
            # Final sınavı (yarın aynı saatte - İstanbul saati)
            final = Exam.query.filter_by(course_id=course.id, exam_type='final').first()
            if not final:
                final_start_istanbul = today_istanbul + timedelta(days=1)
                final_end_istanbul = final_start_istanbul + timedelta(minutes=10)
                # UTC'ye çevir (veritabanı için)
                final_start_utc = final_start_istanbul.astimezone(timezone.utc).replace(tzinfo=None)
                final_end_utc = final_end_istanbul.astimezone(timezone.utc).replace(tzinfo=None)
                final = Exam(
                    course_id=course.id,
                    instructor_id=course.instructor_id,
                    exam_type='final',
                    start_time=final_start_utc,
                    end_time=final_end_utc,
                    duration_minutes=10,
                    weight_percentage=60.0
                )
                db.session.add(final)
                db.session.flush()
            
            # Her sınav için sorular
            for exam in [vize, final]:
                question_count = Question.query.filter_by(exam_id=exam.id).count()
                if question_count < 5:
                    # Türkçe sorular oluştur
                    questions_data = get_questions_for_course(course.code, exam.exam_type)
                    
                    for q_data in questions_data:
                        question = Question(
                            exam_id=exam.id,
                            question_text=q_data['question_text'],
                            question_type='multiple_choice',
                            points=1.0
                        )
                        db.session.add(question)
                        db.session.flush()
                        
                        # Cevap seçenekleri
                        for opt_idx, opt_text in enumerate(q_data['options']):
                            option = AnswerOption(
                                question_id=question.id,
                                option_text=opt_text,
                                is_correct=(opt_idx == q_data['correct_index'])
                            )
                            db.session.add(option)
                    
                    print(f"✓ {course.code} - {exam.exam_type.upper()}: 5 soru eklendi")
        
        db.session.commit()
        
        # Gereksinimleri doğrula
        print("\n" + "=" * 60)
        print("GEREKSİNİMLER DOĞRULANIYOR...")
        print("=" * 60)
        
        # 1. Minimum 10 öğrenci kontrolü
        student_count = User.query.filter_by(role='student').count()
        assert student_count >= 10, f"❌ HATA: Minimum 10 öğrenci gereklidir, şu anda {student_count} öğrenci var!"
        print(f"✅ Öğrenci sayısı: {student_count} (Minimum 10 - GEREKSİNİM KARŞILANDI)")
        
        # 2. En az 2 öğretim üyesi kontrolü
        instructor_count = User.query.filter_by(role='instructor').count()
        assert instructor_count >= 2, f"❌ HATA: En az 2 öğretim üyesi gereklidir, şu anda {instructor_count} öğretim üyesi var!"
        print(f"✅ Öğretim üyesi sayısı: {instructor_count} (Minimum 2 - GEREKSİNİM KARŞILANDI)")
        
        # 3. Minimum 4 ders kontrolü
        course_count = Course.query.count()
        assert course_count >= 4, f"❌ HATA: Minimum 4 ders gereklidir, şu anda {course_count} ders var!"
        print(f"✅ Ders sayısı: {course_count} (Minimum 4 - GEREKSİNİM KARŞILANDI)")
        
        # 4. Her öğretim üyesine minimum 2 ders kontrolü
        all_instructors = User.query.filter_by(role='instructor').all()
        for instructor in all_instructors:
            instructor_courses = Course.query.filter_by(instructor_id=instructor.id).count()
            assert instructor_courses >= 2, f"❌ HATA: {instructor.name} için minimum 2 ders gereklidir, şu anda {instructor_courses} ders var!"
            print(f"✅ {instructor.name}: {instructor_courses} ders (Minimum 2 - GEREKSİNİM KARŞILANDI)")
        
        # 5. Her öğrenciye min. 2 ders, her akademisyenden en az 1 ders kontrolü
        all_students = User.query.filter_by(role='student').all()
        for student in all_students:
            student_courses = StudentCourse.query.filter_by(student_id=student.id).all()
            course_ids = [sc.course_id for sc in student_courses]
            courses = Course.query.filter(Course.id.in_(course_ids)).all()
            
            # Öğrencinin aldığı ders sayısı kontrolü
            assert len(courses) >= 2, f"❌ HATA: {student.name} için minimum 2 ders gereklidir, şu anda {len(courses)} ders var!"
            
            # Her akademisyenden en az 1 ders kontrolü
            instructor_ids = set([c.instructor_id for c in courses])
            all_instructor_ids = set([inst.id for inst in all_instructors])
            assert instructor_ids == all_instructor_ids, f"❌ HATA: {student.name} her akademisyenden en az 1 ders almalıdır!"
            
            course_codes = [c.code for c in courses]
            print(f"✅ {student.name}: {len(courses)} ders ({', '.join(course_codes)}) - Her akademisyenden en az 1 ders (GEREKSİNİM KARŞILANDI)")
        
        # 6. Giriş bilgileri kontrolü
        admin_exists = User.query.filter_by(role='admin').first() is not None
        dept_head_exists = User.query.filter_by(role='department_head').first() is not None
        instructors_exist = User.query.filter_by(role='instructor').count() >= 2
        students_exist = User.query.filter_by(role='student').count() >= 10
        
        assert admin_exists, "❌ HATA: Admin kullanıcısı bulunamadı!"
        assert dept_head_exists, "❌ HATA: Bölüm başkanı kullanıcısı bulunamadı!"
        assert instructors_exist, "❌ HATA: Yeterli öğretim üyesi bulunamadı!"
        assert students_exist, "❌ HATA: Yeterli öğrenci bulunamadı!"
        
        print(f"\n✅ Giriş bilgileri:")
        print(f"  • Admin: ✓")
        print(f"  • Bölüm Başkanı: ✓")
        print(f"  • Öğretim Üyeleri: ✓ ({instructor_count} adet)")
        print(f"  • Öğrenciler: ✓ ({student_count} adet)")
        
        # Özet
        print("\n" + "=" * 60)
        print("TEST VERİLERİ BAŞARIYLA OLUŞTURULDU!")
        print("=" * 60)
        print(f"\n📊 Özet:")
        print(f"  • Departmanlar: {Department.query.count()}")
        print(f"  • Kullanıcılar: {User.query.count()}")
        print(f"  • Dersler: {Course.query.count()}")
        print(f"  • Sınavlar: {Exam.query.count()}")
        print(f"  • Sorular: {Question.query.count()}")
        print(f"  • Öğrenci-Ders Atamaları: {StudentCourse.query.count()}")
        
        print(f"\n🔐 GİRİŞ BİLGİLERİ:")
        print(f"  • Admin: admin@university.edu / admin123")
        print(f"  • Bölüm Başkanı: bolumbaskani@university.edu / bolumbaskani123")
        print(f"  • Öğretim Üyesi 1: ogretimuyesi1@university.edu / ogretimuyesi123")
        print(f"  • Öğretim Üyesi 2: ogretimuyesi2@university.edu / ogretimuyesi123")
        print(f"  • Öğrenciler: ogrenci1@university.edu - ogrenci10@university.edu / ogrenci123")
        
        print(f"\n⏰ TEST SINAVI:")
        print(f"  • Tarih: {today_istanbul.strftime('%Y-%m-%d')}")
        print(f"  • Saat: 11:15 - 11:25 İstanbul Saati (UTC+3)")
        print(f"  • Süre: 10 dakika")
        print(f"  • Tüm dersler için vize sınavları bu saatte!")
        print(f"  • Not: Sistem İstanbul saatine göre çalışmaktadır.")
        
        print(f"\n✅ Sistem kullanıma hazır!")

def get_questions_for_course(course_code, exam_type):
    """Ders koduna göre Türkçe sorular döndür"""
    
    if course_code.startswith('BM101'):
        return [
            {
                'question_text': 'Python programlama dilinde bir değişken tanımlamak için hangi anahtar kelime kullanılır?',
                'options': ['var', 'let', 'def', 'Değişken tanımlamak için özel anahtar kelime yoktur'],
                'correct_index': 3
            },
            {
                'question_text': 'Aşağıdakilerden hangisi Python\'da bir liste (list) oluşturma yöntemidir?',
                'options': ['list = []', 'list = {}', 'list = ()', 'list = <>'],
                'correct_index': 0
            },
            {
                'question_text': 'Python\'da bir fonksiyon tanımlamak için hangi anahtar kelime kullanılır?',
                'options': ['function', 'def', 'func', 'method'],
                'correct_index': 1
            },
            {
                'question_text': 'Python\'da bir döngü oluşturmak için hangi anahtar kelime kullanılır?',
                'options': ['loop', 'for', 'while', 'Hem for hem while'],
                'correct_index': 3
            },
            {
                'question_text': 'Python\'da bir string\'in uzunluğunu bulmak için hangi fonksiyon kullanılır?',
                'options': ['length()', 'len()', 'size()', 'count()'],
                'correct_index': 1
            }
        ]
    elif course_code.startswith('BM102'):
        return [
            {
                'question_text': 'Aşağıdakilerden hangisi bir veri yapısı değildir?',
                'options': ['Yığın (Stack)', 'Kuyruk (Queue)', 'Döngü (Loop)', 'Bağlı Liste (Linked List)'],
                'correct_index': 2
            },
            {
                'question_text': 'Yığın (Stack) veri yapısında son eklenen eleman ilk çıkar. Bu prensibe ne denir?',
                'options': ['FIFO', 'LIFO', 'FILO', 'LILO'],
                'correct_index': 1
            },
            {
                'question_text': 'Bir dizinin elemanlarına erişim zamanı nedir?',
                'options': ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
                'correct_index': 2
            },
            {
                'question_text': 'İkili arama (Binary Search) algoritmasının zaman karmaşıklığı nedir?',
                'options': ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
                'correct_index': 1
            },
            {
                'question_text': 'Bir ağaç (tree) veri yapısında en üstteki düğüme ne denir?',
                'options': ['Yaprak (Leaf)', 'Kök (Root)', 'Dal (Branch)', 'Gövde (Trunk)'],
                'correct_index': 1
            }
        ]
    elif course_code.startswith('YM201'):
        return [
            {
                'question_text': 'Yazılım geliştirme yaşam döngüsünde (SDLC) ilk aşama hangisidir?',
                'options': ['Tasarım', 'Geliştirme', 'Gereksinim Analizi', 'Test'],
                'correct_index': 2
            },
            {
                'question_text': 'Agile yazılım geliştirme metodolojisinde kullanılan kısa geliştirme döngülerine ne denir?',
                'options': ['Milestone', 'Sprint', 'Phase', 'Iteration'],
                'correct_index': 1
            },
            {
                'question_text': 'Aşağıdakilerden hangisi bir yazılım test türü değildir?',
                'options': ['Birim Testi (Unit Test)', 'Entegrasyon Testi', 'Kod Yazma Testi', 'Sistem Testi'],
                'correct_index': 2
            },
            {
                'question_text': 'Yazılım mimarisinde MVC (Model-View-Controller) deseninin amacı nedir?',
                'options': ['Performansı artırmak', 'Kodu organize etmek ve ayırmak', 'Güvenliği sağlamak', 'Veritabanını optimize etmek'],
                'correct_index': 1
            },
            {
                'question_text': 'Git versiyon kontrol sisteminde değişiklikleri geçici olarak saklamak için hangi komut kullanılır?',
                'options': ['git save', 'git stash', 'git store', 'git cache'],
                'correct_index': 1
            }
        ]
    elif course_code.startswith('YM202'):
        return [
            {
                'question_text': 'İlişkisel veritabanında bir tablodaki bir kaydı benzersiz olarak tanımlayan alana ne denir?',
                'options': ['Foreign Key', 'Primary Key', 'Unique Key', 'Index Key'],
                'correct_index': 1
            },
            {
                'question_text': 'SQL\'de veri seçmek için hangi komut kullanılır?',
                'options': ['GET', 'SELECT', 'FETCH', 'RETRIEVE'],
                'correct_index': 1
            },
            {
                'question_text': 'İki tablo arasındaki ilişkiyi tanımlayan anahtara ne denir?',
                'options': ['Primary Key', 'Foreign Key', 'Composite Key', 'Unique Key'],
                'correct_index': 1
            },
            {
                'question_text': 'SQL\'de bir tabloya yeni kayıt eklemek için hangi komut kullanılır?',
                'options': ['ADD', 'INSERT', 'CREATE', 'APPEND'],
                'correct_index': 1
            },
            {
                'question_text': 'Veritabanında veri bütünlüğünü sağlamak için kullanılan kurala ne denir?',
                'options': ['Constraint', 'Rule', 'Check', 'Validation'],
                'correct_index': 0
            }
        ]
    else:
        # Varsayılan sorular
        return [
            {
                'question_text': f'{course_code} dersi için {exam_type} sınavı soru 1?',
                'options': ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
                'correct_index': 0
            },
            {
                'question_text': f'{course_code} dersi için {exam_type} sınavı soru 2?',
                'options': ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
                'correct_index': 1
            },
            {
                'question_text': f'{course_code} dersi için {exam_type} sınavı soru 3?',
                'options': ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
                'correct_index': 2
            },
            {
                'question_text': f'{course_code} dersi için {exam_type} sınavı soru 4?',
                'options': ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
                'correct_index': 3
            },
            {
                'question_text': f'{course_code} dersi için {exam_type} sınavı soru 5?',
                'options': ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
                'correct_index': 0
            }
        ]

if __name__ == '__main__':
    create_test_data()

