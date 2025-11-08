-- Test verileri (opsiyonel)
-- Bu dosya test amaçlı örnek veriler içerir

-- Örnek departmanlar
INSERT INTO departments (name, code) VALUES
('Bilgisayar Mühendisliği', 'BM'),
('Yazılım Mühendisliği', 'YM')
ON CONFLICT (code) DO NOTHING;

-- Not: Gerçek kullanıcılar ve şifreler admin tarafından oluşturulmalıdır
-- Bu dosya sadece yapısal örnekler içerir

