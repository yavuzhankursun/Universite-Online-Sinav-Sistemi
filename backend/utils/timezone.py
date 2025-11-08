"""
İstanbul saati (UTC+3) için timezone helper fonksiyonları
"""
from datetime import datetime, timezone, timedelta

# İstanbul timezone (UTC+3)
ISTANBUL_TZ = timezone(timedelta(hours=3))


def get_istanbul_time():
    """Şu anki İstanbul saatini döndür"""
    return datetime.now(ISTANBUL_TZ)


def utc_to_istanbul(utc_dt):
    """UTC datetime'ı İstanbul saatine çevir"""
    if utc_dt.tzinfo is None:
        # Naive datetime ise UTC olarak kabul et
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    return utc_dt.astimezone(ISTANBUL_TZ)


def istanbul_to_utc(istanbul_dt):
    """İstanbul datetime'ı UTC'ye çevir"""
    if istanbul_dt.tzinfo is None:
        # Naive datetime ise İstanbul saati olarak kabul et
        istanbul_dt = istanbul_dt.replace(tzinfo=ISTANBUL_TZ)
    return istanbul_dt.astimezone(timezone.utc)


def get_istanbul_now():
    """Şu anki İstanbul saatini UTC olarak döndür (veritabanı için)"""
    istanbul_now = get_istanbul_time()
    # Veritabanında UTC olarak saklamak için UTC'ye çevir
    return istanbul_now.astimezone(timezone.utc).replace(tzinfo=None)


def parse_istanbul_datetime(date_string):
    """İstanbul saatine göre datetime string'i parse et ve UTC olarak döndür
    
    datetime-local input'u tarayıcının yerel saatine göre çalışır, ama biz bunu
    İstanbul saati olarak kabul edip UTC'ye çevirmeliyiz.
    
    ÖNEMLİ: Frontend'den gelen "YYYY-MM-DDTHH:mm" formatındaki değer,
    kullanıcının tarayıcısının yerel saatine göre yorumlanır. Ama biz bunu
    İstanbul saati (UTC+3) olarak kabul edip UTC'ye çevireceğiz.
    
    Örnek: Frontend'den "2025-11-08T13:23" geldiğinde, bunu İstanbul saati
    olarak yorumlayıp UTC'ye çevireceğiz: 2025-11-08 10:23:00 UTC
    """
    if not date_string:
        raise ValueError("Boş tarih string'i")
    
    # datetime-local input formatı: "YYYY-MM-DDTHH:mm" (naive, tarayıcının yerel saatine göre)
    # ISO format: "YYYY-MM-DDTHH:mm:ss" veya "YYYY-MM-DDTHH:mm:ss+00:00"
    try:
        # Önce ISO formatını dene (timezone bilgisi varsa)
        if 'T' in date_string and ('+' in date_string or 'Z' in date_string):
            # ISO format with timezone
            dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            if dt.tzinfo == timezone.utc:
                # UTC ise İstanbul'a çevir, sonra tekrar UTC'ye çevir (veritabanı için)
                dt_istanbul = dt.astimezone(ISTANBUL_TZ)
                return dt_istanbul.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                # Zaten timezone'lu ise UTC'ye çevir
                return dt.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            # datetime-local format (YYYY-MM-DDTHH:mm) - naive datetime
            # Bu değer tarayıcının yerel saatine göre yorumlanır, ama biz bunu
            # İstanbul saati olarak kabul edeceğiz
            dt = datetime.fromisoformat(date_string)
            
            # DEBUG: Gelen değeri logla
            print(f"[DEBUG] parse_istanbul_datetime: Gelen değer: {date_string}")
            print(f"[DEBUG] parse_istanbul_datetime: Parse edilen naive datetime: {dt}")
            
            # Naive datetime'ı İstanbul saati olarak kabul et
            # ÖNEMLİ: datetime-local input'u kullanıcının tarayıcısının yerel saatine göre çalışır
            # Ama biz bu değeri İstanbul saati olarak kabul edip UTC'ye çevireceğiz
            dt_istanbul = dt.replace(tzinfo=ISTANBUL_TZ)
            print(f"[DEBUG] parse_istanbul_datetime: İstanbul saati olarak: {dt_istanbul}")
            
            # Veritabanında UTC olarak saklamak için UTC'ye çevir
            dt_utc = dt_istanbul.astimezone(timezone.utc).replace(tzinfo=None)
            print(f"[DEBUG] parse_istanbul_datetime: UTC'ye çevrilmiş: {dt_utc}")
            
            return dt_utc
    except ValueError as e:
        raise ValueError(f"Geçersiz tarih formatı: {date_string}, Hata: {str(e)}")

