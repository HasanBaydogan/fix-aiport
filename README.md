# FiX Ai Destek Formu

`fix.aiport.tr` için tek sayfalık destek ve talep formu. Form doldurulunca veriler ve ekler [SubmitKit](https://submitkit.dev) üzerinden sizin seçtiğiniz e-posta adresine gider. Ayrı bir backend yoktur.

## Neden SubmitKit?

Ücretsiz planda:
- Ayda 500 gönderim
- En fazla **5 dosya** / gönderim
- Dosya başına en fazla **5 MB**
- Dashboard + e-posta bildirimi
- AB barındırma (GDPR)

## Gereksinimler

- Node.js 20+
- Ücretsiz [SubmitKit](https://submitkit.dev) hesabı
- Vercel hesabı (deploy için)

## SubmitKit kurulumu

1. [submitkit.dev](https://submitkit.dev) üzerinden ücretsiz hesap oluşturun.
2. **New form** ile bir form açın; hedef e-posta adresinizi bağlayın.
3. Size verilen endpoint’teki Form ID’yi kopyalayın:
   `https://submitkit.dev/api/f/YOUR_FORM_ID`
4. İsterseniz panelden origin kısıtı olarak `fix.aiport.tr` ekleyin.

Form ID istemci tarafında kullanılır; yine de kendi ID’nizi herkese açık paylaşmayın.

## Yerel çalışma

```bash
cp .env.example .env.local
```

`.env.local` dosyasına Form ID’nizi yazın:

```env
NEXT_PUBLIC_SUBMITKIT_FORM_ID=YOUR_FORM_ID
```

Ardından:

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde açılır.

## Form alanları

- Ad Soyad
- Telefon
- E-posta
- Adres
- Açıklama
- Ekler (isteğe bağlı, en fazla 5 dosya, dosya başına en fazla 5 MB)

İzin verilen ek türleri: `jpg`, `jpeg`, `png`, `webp`, `gif`, `pdf`, `doc`, `docx`, `xls`, `xlsx`, `zip`, `txt`.

## Vercel deploy

1. Bu repoyu GitHub/GitLab/Bitbucket’e itin.
2. [Vercel](https://vercel.com) üzerinde **New Project** ile bağlayın. Framework olarak Next.js algılanır.
3. Project Settings → Environment Variables içine şunu ekleyin:
   - `NEXT_PUBLIC_SUBMITKIT_FORM_ID`
4. Production, Preview ve Development ortamlarına aynı değişkeni verin.
5. Deploy edin.
6. Domain olarak `fix.aiport.tr` ekleyin ve DNS kayıtlarını Vercel’in gösterdiği şekilde bağlayın.

Ortam değişkenini ekledikten sonra yeniden deploy etmeniz gerekir.

## Komutlar

```bash
npm run dev    # geliştirme sunucusu
npm run lint   # eslint
npm run build  # üretim derlemesi
npm start      # üretim sunucusu
```
