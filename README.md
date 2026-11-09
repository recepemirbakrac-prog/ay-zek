# Ay Zek AI

Ay Zek; sohbet, öğrenme, yazı ve kod yardımı ile fikirlerden web uygulaması üretme özelliklerini tek bir arayüzde birleştiren Türkçe yapay zekâ çalışma alanıdır.

## Teknoloji

- Next.js ve React
- Vercel AI SDK + Vercel AI Gateway
- Supabase Realtime (cihazlar arası sohbet odaları)
- Vercel (yayınlama) ve GitHub (kaynak kodu)

## Geliştirme

```bash
npm install
npm run dev
```

## AI Gateway

Sohbet ve uygulama oluşturucu, `AI_GATEWAY_MODEL` ortam değişkenindeki modeli kullanır. Değişken tanımlı değilse `deepseek/deepseek-v4.1-flash` varsayılanı kullanılır.

Vercel üzerinde AI Gateway kimlik doğrulaması Vercel OIDC ile yapılır. Projeyi Vercel'e bağlayıp yerel geliştirme için Vercel ortam değişkenlerini çekin. AI Gateway kullanımı seçilen modelin fiyatlandırmasına ve hesabın bakiyesine/bütçesine bağlı olabilir; ücretsiz ve sınırsız kullanım garantisi yoktur.

## Uygulamalar

- `/` Ay Zek AI ana sayfası ve araç merkezi
- `/chat` genel amaçlı yapay zekâ sohbeti
- `/builder` metinden web uygulaması oluşturucu
- `/internetsiz-sohbet` Supabase Realtime ile oda tabanlı sohbet
- `/satranc`, `/sehir`, `/otogar-tycoon` ve diğer oyun/araç sayfaları

## Supabase Realtime sohbet kurulumu

`/internetsiz-sohbet` sayfası Supabase Realtime Broadcast ve Presence kullanır. Vercel projesinde şu değişkenler bulunmalıdır:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Bu örnek oda kodları herkese açık olabilir; özel sohbet için kimlik doğrulama ve kanal politikaları eklenmelidir. Mesaj geçmişi cihazda saklanır; Broadcast mesajları sunucuda kalıcı veritabanına yazılmaz. Sesli/görüntülü arama ve büyük dosya yükleme bu sürümde etkin değildir.
