# Ay Zek

Türkçe yapay zekâ sohbet uygulaması. Next.js, Vercel AI SDK ve Google Gemini kullanır.

## Geliştirme

```bash
npm install
npm run dev
```

## Ücretsiz Gemini kurulumu

1. Google AI Studio üzerinden ücretsiz bir API anahtarı oluştur: https://aistudio.google.com/apikey
2. Vercel projesinde `GEMINI_API_KEY` adlı environment variable ekle.
3. Production, Preview ve Development ortamlarını seçip yeniden deploy et.

Kart veya ücretli AI Gateway gerekmez. Ücretsiz Gemini kullanım limitleri Google tarafından belirlenir.

## Uygulama

- `/` ana sayfası sohbet ekranına yönlendirir.
- `/chat` Ay Zek sohbet uygulamasıdır.


## Gerçek zamanlı sohbet kurulumu

`/internetsiz-sohbet` sayfası Supabase Realtime Broadcast ve Presence kullanır. Farklı cihazlardaki kişilerin aynı odada mesajlaşabilmesi için:

1. Supabase'de ücretsiz bir proje oluşturun: https://supabase.com/dashboard
2. Project Settings → API bölümünden Project URL ve publishable/anon public key değerlerini alın.
3. Vercel → ay-zek → Settings → Environment Variables bölümüne şu iki değişkeni ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. İkisini Production, Preview ve Development ortamlarına ekleyip yeniden deploy edin.
5. Supabase Realtime ayarlarında public Broadcast ve Presence kanallarına izin verin. Bu örnek odalar herkese açık oda kodları kullanır; özel/gizli sohbet için kimlik doğrulama ve kanal politikaları eklenmelidir.
6. Arkadaşlarınızla aynı oda kodunu paylaşın. İki taraf da çevrimiçi ve aynı odadayken mesajlar gerçek zamanlı iletilir.

Mesaj geçmişi cihazda saklanır; Realtime Broadcast mesajları sunucuda kalıcı bir veritabanına yazmaz. Sesli/görüntülü arama ve büyük dosya yükleme bu sürümde etkin değildir.
