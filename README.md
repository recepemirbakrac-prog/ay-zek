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
