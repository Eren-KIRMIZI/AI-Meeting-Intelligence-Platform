<!-- README.md ve README.tr.md dosyalarını eşitleyin: her yapısal veya içerik değişikliği iki dosyaya da yazılmalı. -->

<p align="center">
  <a href="README.md">🇬🇧 English</a> · <strong>🇹🇷 Türkçe</strong>
</p>

# Nova — AI Toplantı Zekâsı Platformu

Nova toplantıları yürütmeye dönüştürür: her görüşme; kararlar, sahipler, son tarihler ve takipler içeren bir özete dönüşür. Bu depo tam yığın temeli içerir: üretime hazır bir React ön yüzü, satır düzeyi güvenlik (RLS) içeren bir Supabase şeması ve ayrıcalıklı işlemler için Vercel sunucusuz fonksiyonları.

> **Demo modu varsayılandır.** Hiçbir kimlik bilgisi yapılandırılmadığında uygulama tamamen açıkça etiketlenmiş yerel demo verisiyle çalışır. Canlı veriye geçmek için Supabase anahtarlarını ekleyin; tek bir bileşeni değiştirmeniz gerekmez.

---

## Teknoloji yığını

| Katman | Seçim |
| --- | --- |
| Arayüz | React 18, TypeScript, Vite 7, Tailwind CSS, Radix UI temelleri |
| Yönlendirme | React Router 7 |
| Durum | Zustand (arayüz + kalıcı tercihler), TanStack Query (sunucu durumu) |
| Veri | Supabase (Postgres, Auth, Storage) ve RLS |
| Grafikler | Recharts |
| Sunucusuz | Vercel Functions (`api/`), `@vercel/node` |
| Hız sınırlama | Upstash Redis (isteğe bağlı, yapılandırılmadığında açık kalır) |
| Bildirimler | Sonner |
| Simgeler | Lucide |

---

## Proje yapısı

```
.
├─ frontend/
│  ├─ api/                     Vercel sunucusuz fonksiyonları
│  │  ├─ _lib/                 http + redis yardımcıları (yönlendirilmez)
│  │  ├─ health.ts             GET  /api/health
│  │  ├─ meetings/analyze.ts   POST /api/meetings/analyze
│  │  ├─ live/token.ts         POST /api/live/token (LiveKit, sunucu tarafı)
│  │  └─ team/invite.ts        POST /api/team/invite
│  ├─ src/
│  │  ├─ app/                  sağlayıcılar, yönlendirici, kök bileşen
│  │  ├─ components/           düzen, ortak bileşenler, UI temelleri
│  │  ├─ features/             modül başına bir klasör + kimlik doğrulama
│  │  ├─ hooks/                sorgu + mutasyon kancaları
│  │  ├─ i18n/                 yerel ayar durumu, sözlükler ve biçimlendiriciler
│  │  ├─ lib/                  ortam, supabase istemcileri, yardımcılar, yapılandırma
│  │  ├─ mocks/                demo tohum verisi + değiştirilebilir demo deposu
│  │  ├─ services/             demo yedeği olan canlı Supabase servisleri
│  │  ├─ stores/               Zustand depoları
│  │  ├─ styles/               genel CSS + tasarım belirteçleri
│  │  └─ types/                paylaşılan alan türleri
│  ├─ .env.example
│  └─ vercel.json
└─ supabase/
   ├─ migrations/0001_init.sql                 şema, trigger'lar, RLS, depolama, başlangıç
   ├─ migrations/0002_meeting_intelligence.sql transkript + analiz sütunları
   ├─ migrations/0003_workflow_runs.sql        iş akışı yürütme geçmişi
   ├─ migrations/0004_decision_events.sql      karar durumu denetim izi
   ├─ migrations/0005_live_meetings.sql        Nova Live oturumları, transkript ve sohbet
   ├─ migrations/0006_meeting_recordings.sql   kayıt arşivi + özel bucket
   ├─ migrations/0007_notifications_realtime.sql bildirimler, RPC ve Realtime
   ├─ migrations/0008_team_management.sql      roller, çıkarmalar ve proje erişimi
   ├─ migrations/0009_meeting_insights.sql     içgörü kuyruğu, inceleme RPC'leri ve Realtime
   └─ seed.sql                                 yinelenebilir demo çalışma alanı
```

Mock veriler canlı moda asla sızmaz: her servis `isSupabaseConfigured` kontrolü yapar ve yalnızca kimlik bilgileri yoksa `src/mocks/db.ts` dosyasına geri döner.

---

## Hızlı başlangıç (demo modu)

Gereksinimler: Node.js 20+.

```bash
cd frontend
npm install
npm run dev
```

Yazdırılan URL'yi açın (varsayılan `http://localhost:5173`). Giriş ekranında **Demo çalışma alanıyla devam et** seçeneğini kullanın. Kimlik bilgisi gerekmez.

### Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Vite geliştirme sunucusu |
| `npm run build` | Projeleri tür denetiminden geçirir ve üretim varlıklarını oluşturur |
| `npm run preview` | Üretim derlemesini önizler |
| `npm run lint` | ESLint |
| `npm run typecheck` | Yalnızca uygulamayı tür denetiminden geçirir |
| `npm run test` | Vitest paketini bir kez çalıştırır |
| `npm run test:watch` | Vitest'i izleme modunda çalıştırır |
| `npm run test:coverage` | Paketi V8 kapsam raporuyla çalıştırır |
| `npm run test:e2e` | Üretim varlıklarını oluşturur ve Playwright tarayıcı paketini çalıştırır |
| `npm run test:e2e:ui` | Playwright UI çalıştırıcısını açar |

### Testler ve CI

Testler Vitest, jsdom, Testing Library ve jest-dom kullanır. Paket; saf yardımcıları, metrik oluşturucuları, aralığa dayalı analitiği, enum koruyucularını, transkript analizcisini, canlı toplantı zekâsını ve Knowledge notunu, demo veri deposunu ve toplantı hattını (analiz → kaydet), Nova Live kalıcılığını, kayıt biçimlendirmesini ve arşiv depolamayı, bildirim tercihi filtrelemesini ve derin bağlantı güvenliğini, demo çalışma alanı olay veri yolunu, eylem odaklı bildirim teslimini, ekip rol hiyerarşisi kurallarını, üye çıkarma ve proje erişimi eşitlemesini, içgörü inceleme kuyruğunu ve görev/karar dönüşümünü, iş akışı çalıştırma günlüğünü, sparkline geometrisini ve canlı oda/konuşma/ortam yardımcılarını, kenar çubuğu erişilebilirliğini, rota meta verisini ve belge başlıklarını, hata sınırlarını, 404 sayfasını, yerel ayar değiştirmeyi ve yerel ayara duyarlı biçimlendirmeyi, çeviri kapsamını (AST tabanlı anahtar, yer tutucu ve JSX koruması) ve uçtan uca bir görev panosu etkileşimini kapsar.

```bash
cd frontend
npm run test
```

`src/test/setup.ts`, Radix ve Recharts'ın ihtiyaç duyduğu küçük tarayıcı API taklitlerini sağlar. Testler Supabase'e veya ağa asla çağrı yapmaz — demo modu onları deterministik tutar.

Playwright paketi gerçek uygulamayı Chromium'da çalıştırır: her çalışma alanı rotası, klavyeyle içeriğe atlama, 404 kurtarma, görev oluşturma, içgörü inceleme akışı, filtreler ve mobil gezinme çekmecesi. Tarayıcıyı bir kez kurun, ardından paketi çalıştırın:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

`e2e/a11y.spec.ts`, her rotada ve ayrıca içgörü ayrıntı penceresinde, görev oluşturma penceresinde, komut paletinde, bildirimler panelinde ve kullanıcı menüsünde WCAG 2.0/2.1/2.2 A ve AA kurallarına karşı bir axe-core denetimi (`@axe-core/playwright`) çalıştırır. Paket herhangi bir ihlalde başarısız olur; böylece erişilebilirlik gerilemeleri tıpkı bozuk bir test gibi CI'ı engeller.

Playwright önce üretim paketini oluşturur, ardından `127.0.0.1:4173` üzerinde bir Vite önizleme sunucusu başlatır; böylece testler geliştirme dönüşümleri yerine yayınlanan varlıkları çalıştırır ve geliştirme sunucusunun açık olması gerekmez. CI tarayıcı paketini ayrı bir işte çalıştırır ve başarısız olduğunda HTML raporunu yükler.

GitHub Actions her push ve `main` hedefli pull request'te `lint → typecheck → test → build` ile Playwright işini çalıştırır (`.github/workflows/ci.yml`). CI paketi `npm run test:coverage` ile çalıştırır ve kapsam tabanlarını zorunlu kılar (%38 ifade, %26 dal, %36 fonksiyon, %39 satır); böylece oran yalnızca yükselebilir. Ayrı bir `npm run check:readme` adımı derleme başlamadan önce iki README'yi karşılaştırır.

---

## Canlı mod — Supabase

### 1. Bir proje oluşturun

Bir Supabase projesi oluşturun, ardından API URL'sini ve **publishable (anon)** anahtarını kopyalayın.

### 2. Şemayı uygulayın

SQL düzenleyicisini açın ve sırasıyla çalıştırın:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_meeting_intelligence.sql`
3. `supabase/migrations/0003_workflow_runs.sql`
4. `supabase/migrations/0004_decision_events.sql`
5. `supabase/migrations/0005_live_meetings.sql`
6. `supabase/migrations/0006_meeting_recordings.sql`
7. `supabase/migrations/0007_notifications_realtime.sql`
8. `supabase/migrations/0008_team_management.sql`
9. `supabase/migrations/0009_meeting_insights.sql`
10. `supabase/seed.sql` — isteğe bağlı demo çalışma alanı. En az bir kimlik doğrulama kullanıcısı gerektirir; önce bir kez kaydolun.

Veya Supabase CLI ile:

```bash
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

Geçişler şunları oluşturur:

- `profiles`, `organizations`, `organization_members`
- `projects`, `project_members`, `tasks`
- `meetings`, `meeting_participants`, `decisions`
- `activities`, `knowledge_documents`, `workflows`, `integrations`, `notifications`
- İş akışı yürütme geçmişi için `workflow_runs` (`0003` içinde eklendi)
- Yalnızca ekleme yapılabilen karar durumu günlüğü için `decision_events` (`0004` içinde eklendi)
- Nova Live odaları için `meeting_sessions`, `meeting_transcript_segments` ve
  `meeting_chat_messages` (`0005` içinde eklendi) ile `nova_live` platform değeri
- Arşivlenen kayıtlar için `meeting_recordings` (`0006` içinde eklendi)
- Eylem odaklı, canlı bildirimler için `notifications.link`, `digest` türü,
  `notify_workspace()` ve Realtime yayını (`0007` içinde eklendi)
- Hiyerarşiye duyarlı ekip yönetimi için `update_member_role()`,
  `remove_workspace_member()` ve `set_member_projects()` (`0008` içinde eklendi)
- `handle_new_user` trigger'ı, `set_updated_at` trigger'ları, indeksler
- RLS yardımcıları: `is_org_member`, `is_org_admin`, `shares_org_with`
- İlk çalıştırma katılımı için `bootstrap_workspace()`
- Kuruluş kapsamlı politikalarla özel `meeting-assets` ve `meeting-recordings`
  depolama bucket'ları

İkinci geçiş, `meetings` tablosuna `transcript`, `analysis`, `analysis_error`, `analysis_confidence`, `analyzed_at` ve `analysis_model` sütunlarını ekler. Mevcut RLS bu sütunları zaten yalnızca aktif çalışma alanı üyeleriyle sınırlar.

Üçüncü geçiş, okumaları çalışma alanı üyeleriyle sınırlanan `workflow_runs` tablosunu ekler. Otomasyon yazmaları servis rolünde kalır; bu yüzden kimliği doğrulanmış hiçbir ekleme veya güncelleme politikası verilmez.

Dördüncü geçiş, karar günlüğü için yalnızca ekleme yapılabilen bir denetim izi olan `decision_events` tablosunu ekler. Üyeler kendi çalışma alanları için olay okuyabilir ve ekleyebilir; geçmiş asla güncellenmez veya silinmez.

Beşinci geçiş, `meetings.platform` kontrolünü `nova_live` ile genişletir ve oda düzeyindeki tabloları ekler: oda başına bir `meeting_sessions` satırı, sıralı `meeting_transcript_segments` ve oda `meeting_chat_messages` kayıtları. Üyeler kendi çalışma alanları için satır okuyabilir ve ekleyebilir. Demo modu aynı biçimleri bellekte korur.

Altıncı geçiş, `meeting_recordings` tablosunu ve özel `meeting-recordings` bucket'ını ekler (dosya başına 500 MB, yalnızca video/ses mime türleri). Üyeler kendi çalışma alanları için kayıt okuyabilir ve ekleyebilir; yükleyen veya bir çalışma alanı yöneticisi kayıtları silebilir. Oynatma bir saatlik imzalı URL ister; böylece kayıt dosyaları asla herkese açık olmaz.

Yedinci geçiş, `notifications.link` sütununu ve `digest` bildirim türünü ekler, ardından `notify_workspace()` security-definer RPC'sini oluşturur. RPC hedef kitleyi (`workspace`, `meeting` veya `assignee`) çözer, eylemi yapanı hariç tutar ve alıcı başına bir satır ekler; böylece istemci kodu başkaları için asla bildirim yazmaz. Ayrıca `notifications`, `tasks`, `decisions`, `decision_events`, `meetings`, `meeting_recordings` ve `knowledge_documents` tablolarını `full` replica identity ile `supabase_realtime` yayınına ekler.

Sekizinci geçiş ekip yönetimini açık hale getirir. `organization_members` tablosuna doğrudan yazma devre dışı bırakılır ve `project_members` yazmaları sahipler/yöneticilerle sınırlanır. Üç security-definer RPC hiyerarşiyi uygular: `update_member_role()` (sahip sabit, kendi rolünü değiştirme yok, yöneticiler yöneticileri yönetemez veya yönetici atayamaz), `remove_workspace_member()` (kendini çıkarma yok, sahibi çıkarma yok, proje üyeliklerini iptal eder) ve `set_member_projects()` (yalnızca aktif üyeler, proje sahipliğini doğrular ve proje sahiplerini kendi projelerinde tutar). Rol ve proje değişiklikleri bir etkinlik yazar ve etkilenen üyeye `/team?member=<id>` derin bağlantısıyla bildirim gönderir. Açık her sekmenin yenilenmesi için `organization_members` ve `project_members` Realtime'a eklenir.

### 3. Ortamı yapılandırın

```bash
cd frontend
cp .env.example .env
```

Tarayıcıda güvenle kullanılabilecek değerleri doldurun:

```dotenv
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

Geliştirme sunucusunu yeniden başlatın. Uygulama artık canlı verileri okuyup yazar ve giriş ekranı e-posta/parola kimlik doğrulamasına geçer.

### 4. Yalnızca sunucuda kullanılacak değişkenler

Bunlar Vercel proje ayarlarına (veya `vercel dev` için `.env` dosyasına) aittir ve istemciye asla açılmamalıdır:

```dotenv
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SECRET_KEY=<service-role-key>
UPSTASH_REDIS_REST_URL=<optional>
UPSTASH_REDIS_REST_TOKEN=<optional>
OPENAI_API_KEY=<optional, enables live transcript extraction>
OPENAI_MODEL=gpt-4o-mini
LIVEKIT_URL=wss://<project>.livekit.cloud
LIVEKIT_API_KEY=<server-side only>
LIVEKIT_API_SECRET=<server-side only>
VITE_APP_URL=https://your-app.vercel.app
```

İsteğe bağlı Nova Live medyası. `VITE_LIVEKIT_URL` tarayıcıda güvenlidir ve yalnızca oda taşımasını LiveKit'e geçirir; API anahtarı ve sırrı sunucuda kalır ve yalnızca `POST /api/live/token` tarafından okunur. Demo modunun kullandığı WebRTC mesh yapısını korumak için dördünü de boş bırakın.

> Yalnızca `VITE_` önekli değişkenler tarayıcı paketine dahil edilir. Bir sırrı asla `VITE_` ile öneklendirmeyin.

### 5. Kimlik doğrulama ayarları

Supabase → Authentication → URL configuration bölümünde:

- Site URL: dağıtılmış kaynağınız (origin)
- Redirect URLs: `http://localhost:5173/**`, `https://your-app.vercel.app/**`

Davetler, `/login` adresine yönlendirme ile `auth.admin.inviteUserByEmail` kullanır.

---

## API

### `GET /api/health`

Hazır olma (readiness) yoklaması. Değerleri açığa çıkarmadan modu ve bağımlılık durumunu bildirir.

```json
{
  "status": "ok",
  "service": "nova-api",
  "mode": "live",
  "checks": { "supabase": { "ok": true }, "redis": { "ok": true } },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### `POST /api/team/invite`

`Authorization: Bearer <access-token>` gerektirir.

```json
{ "email": "new.member@company.com", "role": "member", "organizationId": "<uuid>" }
```

Kontroller:

1. JWT'yi Supabase Auth ile doğrular.
2. Çağıranın kuruluşun **aktif sahibi/yöneticisi** olduğunu onaylar.
3. Yinelenenleri ve geçersiz rolleri (`admin | member | viewer`) reddeder.
4. Upstash üzerinden davet eden başına saatte 10 davetle sınırlar (yapılandırılmadığında açık kalır).
5. Admin API'siyle davet gönderir, ardından `invited` üyeliği oluşturur.

API rotalarını test ederken yerelde `vercel dev` kullanın; düz `vite` yalnızca ön yüzü sunar.

### `POST /api/meetings/analyze`

`Authorization: Bearer <access-token>` gerektirir. Bir transkripti demo analizcisinin ürettiği aynı analiz biçimine dönüştürür.

```json
{
  "meetingId": "<uuid>",
  "organizationId": "<uuid>",
  "transcript": "Ayşe: We agreed to ship the checklist.\nEmre: I will draft it by Tuesday."
}
```

Kontroller:

1. JWT'yi Supabase Auth ile doğrular.
2. Çağıranın kuruluşun **aktif sahibi/yöneticisi/üyesi** olduğunu onaylar.
3. Toplantının o kuruluşa ait olduğunu doğrular.
4. Sunucuda `OPENAI_API_KEY` gerektirir; yoksa `503` döner.
5. Upstash üzerinden kullanıcı başına saatte 20 analizle sınırlar (yapılandırılmadığında açık kalır).
6. Transkripti 20.000 karakterle sınırlar ve sağlayıcı JSON'unu döndürmeden önce doğrular.

Yanıt: `{ "ok": true, "analysis": { summary, keyPoints, risks, topics, confidence, transcript, actions, decisions, analyzedAt, model, steps } }`.

Tarayıcı bir sağlayıcıyı asla doğrudan çağırmaz. Demo modunda `src/lib/meeting-intelligence.ts` içindeki deterministik analizci yerelde çalışır ve uç nokta hiç çağrılmaz.

### `POST /api/live/token`

`Authorization: Bearer <access-token>` gerektirir. Nova Live odası için kısa ömürlü (2 saat) bir LiveKit katılım jetonu üretir.

```json
{ "room": "nova-abc123", "identity": "<user-or-peer-id>", "name": "Ayşe Yılmaz" }
```

Kontroller:

1. JWT'yi Supabase Auth ile doğrular.
2. `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` ve sunucu Supabase anahtarlarını gerektirir; tanımlı değilse `503` döner.
3. Oda ve kimlik biçimlerini doğrular ve 80 karakterle sınırlar.
4. Upstash üzerinden kullanıcı başına 10 dakikada 30 jeton isteğiyle sınırlar (yapılandırılmadığında açık kalır).
5. Yalnızca `{ token, url, room }` döner — API sırrını asla döndürmez.

---

## Takvim ve planlama

Takvim, Nova toplantılarını ve bağlı sağlayıcı etkinliklerini tek bir ajandada birleştirir; planlama çalışma alanından çıkmaz.

- **İki görünüm.** Hafta ve ay ızgaraları aynı etkinlik verisini kullanır ve Ayarlar'daki hafta başlangıcı tercihine uyar. Izgara hesapları (`weekDays`, `monthGrid`, `eventsInRange`) `src/lib/scheduling.ts` içinde olduğu için görünümler birbirinden kopamaz.
- **Çakışma tespiti.** `detectConflicts` çakışan her çifti karşılaştırır, çakışmayı dakika olarak bildirir ve tamamen kapsanan etkinliği `full`, kenarı kesilen etkinliği `partial` olarak işaretler. Çakışan kartlar gül rengi bir halka alır ve ajanda çakışma sayısını gösterir.
- **Hatırlatmalar.** Bir toplantı `reminderMinutes` saklar; `buildReminders` bunları önümüzdeki 72 saat için bekleyen veya gönderilmiş satırlara dönüştürür, böylece yan panel arka plan işçisi olmadan da doğru kalır.
- **Boş aralıklar.** `findFreeSlots` dolu etkinliklerin çevresinde çalışma saatleri içindeki boşlukları döndürür. **Bu aralığı kullan** planlama penceresini önerilen başlangıç saatiyle önceden doldurur.
- **Yerinde planlama.** `CreateMeetingDialog` başlık, tarih/saat, süre, platform, gündem, katılımcılar ve hatırlatma toplar. `createMeeting` katılımcı listesini ve hatırlatmayı kaydeder, ardından takvim ve toplantı sorgularını geçersiz kılar; yeni etkinlik hemen görünür.
- **Kaynaklar.** Nova toplantıları ve harici sağlayıcı etkinlikleri yan yana yaşar; her etkinlik `source` bilgisini (`nova`, `google_calendar`, `microsoft_outlook`) korur ve harici etkinlikler böyle etiketlenir.

---

## Merkezi arama

Arama, çalışma alanı üzerinde tek bir dizindir; yedi ayrı filtre değildir.

- **Tek dizin, yedi tür.** `buildSearchIndex` toplantıları, transkriptleri, kararları, görevleri, kişileri, projeleri ve bilgi belgelerini `SearchResult` kayıtlarına indirger. Her sonuç bir derin bağlantı taşır; transkript isabeti `/meetings/<id>?tab=transcript`, görev isabeti `/tasks?task=<id>` açar.
- **Türkçe farkındalıklı sıralama.** `normalizeText` `ç ğ ı İ ö ş ü` harflerini sadeleştirir, böylece `ayse` araması `Ayşe`yi bulur. Her sorgu kelimesi eşleşmek zorundadır, başlık eşleşmeleri gövde eşleşmelerinden daha ağır basar ve eşitlikte güncellik belirleyicidir.
- **Filtreler.** Tür çipleri, kişi, proje ve başlangıç/bitiş tarihi aynı sonuç kümesini daraltır; etkin filtre sayısı görünür ve tek tıkla temizlenir.
- **Özetler ve vurgular.** `snippetFor` özeti ilk eşleşen kelimenin çevresine ortalar ve arayüz eşleşen her kelimeyi işaretler; böylece uzun bir transkript neden eşleştiğini gizlemez.
- **Paylaşılabilir durum.** Sorgu `/search?q=` içinde saklanır ve boş sorgu boş sayfa yerine güncelliğe göre sıralanmış bir çalışma alanı akışı gösterir.

---

## Entegrasyon merkezi

Entegrasyon merkezi; takvimler, video platformları ve mesajlaşma araçları için bağlantı yüzeyidir.

- **Sağlayıcılar.** Google Calendar, Microsoft Outlook, Google Meet, Zoom, Microsoft Teams, Slack ve Google Drive. Her kart bağlantı durumunu, eşitleme yönünü, sağlığı, hesabı, eşitlenen öğe sayısını, son eşitlemeyi ve planlanan sonraki eşitlemeyi gösterir.
- **Bağlan ve eşitle.** Bir sağlayıcıyı bağlamak veya ayırmak tek bir anahtardır. **Şimdi eşitle** işçiyi çalıştırır ve yön, öğe sayısı, süre ve okunabilir bir özet içeren bir `IntegrationSyncEvent` ekler.
- **Canlı jetonlar sunucuda kalır.** Demo modu işçiyi `mocks/db.ts` içinde simüle eder; canlı mod `/api/integrations/sync` adresindeki sunucu işçisine istek atar, böylece sağlayıcı jetonları tarayıcıya hiç ulaşmaz. Bu işçi demo moduyla değil, canlı Supabase dağıtımıyla gelir.
- **Etkinlik günlüğü.** Günlük `success`, `partial` ve `failed` çalışmalarını göreli zaman damgalarıyla kaydeder; böylece jeton yenileme veya hâlâ işlenen bir transkript sessiz kalmak yerine görünür olur.
- **Zincirleme etkiler.** Başarılı bir eşitleme entegrasyonları, eşitleme olaylarını, takvimi ve toplantıları geçersiz kılar; içe aktarılan etkinlikler sayfa yenilenmeden `/calendar` üzerinde görünür.

---

## Toplantı şablonları ve oyun kitapları

Bir şablon, tekrarlayan bir toplantıyı işe yarar kılan gündemi ve soruları saklar; böylece bir sonraki toplantı aynı yapıyla başlar.

- **Kütüphane.** Altı hazır oyun kitabı ürün planlaması, bire bir görüşmeler, retrospektifler, müşteri keşfi, mülakatlar ve lansman incelemelerini kapsar. Her kart kategoriyi, süreyi, aşama ve soru sayısını, etiketleri, kullanımı ve son çalıştırılma zamanını gösterir.
- **Oyun kitabı detayı.** `playbookPrompts` her aşamayı sıralı bir kontrol listesine indirger ve pencere, toplantı başlamadan önce her aşamayı kendi süre bütçesiyle gösterir.
- **Yerinde oluşturma.** `CreateTemplateDialog` ad, açıklama, kategori, süre, etiketler ve her biri kendi dakikasına ve satır başına bir soruya sahip istediğiniz sayıda aşama toplar; süre boş bırakılırsa aşamalardan türetilir.
- **Şablondan başlama.** **Şablonu kullan** normal planlama penceresini şablon başlığı, süresi ve gündemiyle önceden doldurarak açar, ardından kullanımı kaydeder; böylece popülerlik sıralaması doğru kalır.
- **Türkçe farkındalıklı arama.** `filterTemplates` merkezi aramayla aynı sadeleştirmeyi kullanır; `ayse` araması `Ayşe`yi bulur ve kategori, favori ve sıralama filtreleri sunucuya gitmeden birleşir.

---

## Denetim ve uyum

Denetim yüzeyi iki soruyu tek yerde yanıtlar: ne oldu ve bunu kanıtlayabiliyor muyuz?

- **Denetim kaydı.** Erişim, veri, entegrasyon, güvenlik ve uyum olayları; aktör, hedef, IP adresi, önem düzeyi ve üst veriyle kaydedilir. `filterAuditEvents` sorgu, kategori, önem ve güncellik filtrelerini tek sıralı liste üzerinde birleştirir.
- **Özet ve önem.** Kritik olaylar, uyarılar ve son 24 saat ayrı ayrı sayılır; böylece engellenen bir oturum açma veya başarısız bir jeton yenileme uzun bir listede gizlenemez.
- **Uyum puanı.** `complianceScore` geçen kontrolleri tam, ilgi gerektiren kontrolleri yarım ve başarısız kontrolleri sıfır sayar; ardından aynı puanı GDPR, SOC 2, ISO 27001 ve HIPAA bazında gruplar.
- **Kontrol sahipliği.** Her kontrol bir sahip, son kontrol zamanı ve kanıt sayısı belirtir; durum geçmiyorsa bir iyileştirme notu görünür.
- **Dışa aktarma da denetlenir.** **CSV dışa aktar** filtrelenmiş kaydı `auditEventsToCsv` ile (tırnaklanmış, RFC 4180 uyumlu) yazar ve dışa aktarmayı hem demo hem canlı modda yeni bir veri olayı olarak kaydeder.

---

## Nova Live

Nova Live toplantıyı çalışma alanının içinde yürütür: video/ses, ekran paylaşımı, sohbet, canlı altyazılar, transkripte dayalı bir copilot ve görevlere, kararlara ve bir Knowledge notuna dönüşen bir rapor.

- **Yalıtılmış medya katmanı.** `src/lib/live/media/` tek bir `LiveMediaAdapter` sözleşmesi tanımlar. `mesh.ts`, demo modu için `BroadcastChannel` sinyalleşmesi kullanan bir WebRTC mesh yapısıdır; `livekit.ts` üretim SFU adaptörüdür. Oda arayüzü iki uygulamayı da doğrudan içe aktarmaz.
- **Demo modu kimlik bilgisi olmadan çalışır.** Odalar aynı tarayıcıdaki sekmeleri bağlar ve senaryolu `demo-dialogue.ts` mikrofon olmadan altyazıları ve AI hattını besler. Her demo segmenti transkriptte **Demo** olarak etiketlenir.
- **Canlı mod LiveKit Cloud kullanır.** Dört `*_LIVEKIT*` değişkenini ayarlayın; istemci `/api/live/token` üzerinden jeton ister ve Vercel'de hiçbir medya sunucusu çalışmaz. Mesh yapısı, kısıtlayıcı ağlarda TURN gerektirdiği için gerçek cihazlar arası aramalar için uygun değildir.
- **Altyazılar.** `use-live-captions.ts`, Web Speech API'sini (Chrome/Edge) sarar; konuşmacıyı, metni, zaman damgasını ve güveni kaydeder ve izin hatalarında temiz biçimde durur. Demo diyalogu her yerde kullanılabilir kalır.
- **Kayıt.** `use-local-recording.ts`, yerel kamera/mikrofonu `MediaRecorder` ile kaydeder. `.webm` dosyası, kullanıcı bitiş ekranında **Toplantıya kaydet** düğmesine basana kadar tarayıcıda kalır; bu işlem dosyayı özel çalışma alanı depolamasına yükler ve kaydedilen toplantıya ekler. Demo modu dosyayı tarayıcıda tutar ve **Yalnızca bu tarayıcıda** olarak etiketler; canlı mod imzalı URL'lerle oynatır.
- **Önce rıza.** Katılım öncesi ekran transkripti ve isteğe bağlı kaydı açıklar ve kimse katılmadan önce bir KVKK/GDPR onayı ister.
- **Kalıcılık.** Bir odayı bitirmek, analizi, transkripti, sohbeti ve katılımcılarıyla tamamlanmış bir `nova_live` toplantısı kaydeder, ardından bir Knowledge notu yazar. Takipler yalnızca mevcut `commitMeetingAnalysis` adımı üzerinden incelemeden sonra oluşturulur.
- **Rotalar.** `/live` uygulama kabuğu içindeki lobidir; `/live/:roomId` tam ekran çalışır. Mesh yapısını iki katılımcı olarak test etmek için bir sekmede oda başlatın ve davet bağlantısını başka bir sekmede açın.
- **Türkçe sorular.** Deterministik copilot Türkçe niyetleri (kararlar, aksiyon maddeleri, tarihler, riskler, konuşma süresi, özetler) anlar ve aktif arayüz dilinde yanıtlar; böylece Türkçe bir oda İngilizceye düşmez.

---

## AI Intelligence

AI Intelligence ikinci bir toplantı özeti değil, incelenen bir kuyruktur. Her sinyal geldiği toplantıyı, bir sahibi, bir güven puanını ve isteğe bağlı bir kaynak alıntısını korur.

- **Tek kuyruk, dört tür.** `summary`, `decision`, `action` ve `risk` içgörüleri `/intelligence` sayfasına düşer. Sayfada KPI sayıları, tür ve durum filtreleri, başlık, sahip, toplantı ve proje genelinde arama ve `/intelligence?insight=<id>` üzerinden açılan bir ayrıntı paneli vardır; böylece bildirimler ve bağlantılar tam sinyale iner.
- **İnceleme eylemleri.** Sahipler, yöneticiler ve üyeler bir sinyali isteğe bağlı bir notla kabul edebilir, reddedebilir veya yeniden açabilir. İzleyiciler kuyruğu okuyabilir ancak yazma kontrolleri gizlenir ve RPC'ler değişikliği reddeder.
- **İşe dönüştürme.** Kabul edilen bir sinyal bir göreve (proje, öncelik, bitiş tarihi, atanan kişi) veya önerilen bir karara (etki) dönüşebilir. İçgörü `converted` olur, yeni kayda derin bağlantı korur ve görev veya karar karttan ya da ayrıntı panelinden açılır.
- **Demo ve canlı eşliği.** Her iki yol da adayları `src/lib/insights.ts` içindeki `buildInsightCandidates` ile oluşturur. Demo modu kuralları `mocks/db.ts` içinde uygular; canlı mod aynı adayları üyeliği doğrulayan ve izleyici korumasını uygulayan `0009` security-definer RPC'lerine gönderir. Yeniden analiz, kabul edilen, reddedilen ve dönüştürülen sinyalleri korur ve yalnızca oluşturulmuş açık sinyalleri yeniden kurar.
- **Bildirimler.** Kabul/red/yeniden açma, `/intelligence?insight=<id>` bağlantısıyla `mentions` tercihini kullanır. Göreve dönüştürme atanan kişiye bildirim gönderir; karara dönüştürme ise mevcut bildirim hedef kitleleri üzerinden çalışma alanına bildirim gönderir.
- **Gerçek zamanlı.** `meeting_insights` Supabase Realtime'a eklenir; böylece bir sekmedeki inceleme başka bir sekmedeki kuyruğu yeniler. Demo modu uygulamanın geri kalanıyla aynı çalışma alanı olay veri yolunu kullanır.

---

## AI toplantı hazırlığı

Brif toplantı başlamadan önce gelir ve boş bir istemden değil, çalışma alanından oluşturulur.

- **Deterministik brif.** `src/lib/preparation.ts` içindeki `buildMeetingPreparation`; gündemi, katılımcıları, aynı projedeki önceki toplantıları, açık risk içgörülerini ve atanmış görevleri okur; ardından bir hedef, sorulacak sorular, bağlam, riskler ve katılımcı bazında odak üretir.
- **Açıklanan hazırlık.** `preparationReadiness`; gündem, katılımcı sayısı, önceki bağlam, açık riskler ve açık takiplerden 0–100 arası bir puan hesaplar; kart belirsiz bir güven yerine puanı, başlığı ve tam eksikleri gösterir.
- **Bağlantılı bağlam.** Her bağlam öğesi kaynak toplantısını korur; **Toplantıyı aç** doğrudan gündemi şekillendiren transkripte ve kararlara gider.
- **Nerede görünür.** Planlanmış ve işlenen toplantılar brifi kaydın üstünde gösterir; analiz edilmiş toplantılar brifi geri plana atar ve sonuçla başlar.
- **Demo ve canlı eşliği.** Demo modu brifi bellekteki çalışma alanından oluşturur. Canlı mod `meeting_preparations` tablosunu aynı şekille okur; böylece kart moda göre dallanmaz.

---

## AI takip otomasyonu

Takipler otomatik bir yağmur değil, incelenen bir pakettir: bir özet e-postası, bir sorumlu hatırlatması ve bir görev özeti.

- **Tek plan, üç mesaj.** `src/lib/follow-up.ts` içindeki `buildFollowUpPlan`; analizi (veya saklanan özeti) tüm katılımcılara e-posta, ilk sorumluya sohbet hatırlatması ve projeye görev özeti olarak dönüştürür.
- **Açık durum makinesi.** `nextFollowUpStatus` yalnızca `draft → queued → sent` geçişine izin verir; gönderildi son durumdur, böylece bir mesaj yeniden gönderilemez veya sessizce geri alınamaz. `followUpCompletion` çalışma alanından gerçekten çıkan payı bildirir.
- **Her adım görünür.** Toplantı kaydı kanalı, alıcıyı, konuyu, gövdeyi, durumu ve gönderim zamanını gösterir; **Kuyruğa al** ve **Gönder** kaydı günceller ve bir etkinlik girdisi yazar.
- **Bilinçli yeniden oluşturma.** Paketi yeniden kurmak, toplantının mesajlarını yalnızca kullanıcı istedikten sonra değiştirir; böylece eski bir özet gönderilmiş bir mesajın üzerine yazmaz.
- **Demo ve canlı eşliği.** Demo modu `mocks/db.ts` üzerinde değişiklik yapar; canlı mod aynı oluşturucuyu çalıştırır ve paketi `follow_up_messages` tablosuna yazar.

---

## Organizasyon zekası

Organizasyon zekası çalışma alanını toplantı listesi olarak değil, bir sistem olarak okur.

- **Açıklanabilir puan.** `src/lib/org-intelligence.ts` içindeki `buildOrgIntelligence`; açık riskleri, önerilen kararları, analiz edilmemiş toplantıları ve takip tamamlanmasını ağırlıklandırır. Yöntem kartı, puanın kullandığı kuralın aynısını gösterir.
- **Beş sinyal.** Açık riskler, karar kuyruğu, iş yükü yoğunlaşması, analiz edilmemiş toplantılar ve toplantı büyüklüğü; her biri Nova'nın geri kalanının okuduğu aynı kayıtlardan türetilen bir metrik ve ton taşır.
- **Tekrarlayan temalar.** Analiz edilen konular sadeleştirilir, gruplanır ve yeni ile eski pencere arasında karşılaştırılır; böylece tekrar eden tema, geçiş sayısıyla birlikte en üste çıkar.
- **Karar hızı ve yük.** Karar gecikmesi, karar geçmişinden öneriden kabule süreyi ölçer; toplantı yükü son 30 günün planlanmış dakikalarını toplar.
- **Demo ve canlı eşliği.** Canlı mod toplantıları, kararları, görevleri ve içgörüleri mevcut servisler üzerinden yükler ve aynı saf oluşturucuyu çalıştırır; böylece rapor modlar arasında kayamaz.

---

## Bildirimler ve gerçek zamanlı akış

Bildirimler, ne olduğunu tahmin eden zamanlanmış bir iş tarafından değil, çalışma alanı eylemleri tarafından üretilir. Başlıktaki zil, filtrelenmiş ve derin bağlantılı bir gelen kutusudur.

- **Eylem odaklı.** Bir görevi tamamlamak veya güncellemek, karar durumunu değiştirmek, bir toplantıyı kaydetmek ya da analiz etmek, takip oluşturmak ve bir kaydı arşivlemek `dispatchWorkspaceNotification` üzerinden bildirim üretir. Demo modu bunu `mocks/db.ts` içinde yansıtır; böylece akış kimlik bilgisi olmadan test edilebilir.
- **Hedef kitleler.** Karar değişiklikleri eylemi yapan hariç tüm aktif üyelere; toplantı olayları toplantının katılımcılarına; görev olayları atanan kişiye gider. Hedef kitleyi `notify_workspace()` RPC'si çözer; böylece istemci başka bir kullanıcı için asla satır yazmaz.
- **Tercihler gerçekten filtreler.** Her bildirim türü **Ayarlar → Bildirimler** bölümündeki bir anahtarla eşlenir (`meetingBriefs`, `actionItems`, `decisionReviews`, `weeklyDigest`, `mentions`). Eşleme `src/lib/notifications.ts` içinde yaşar; böylece zil rozeti, liste ve ayarlar sayfası birbirinden kopamaz. Bir türü kapatmak onu menüden ve okunmamış sayısından hemen gizler; menü kaç öğenin gizlendiğini söyler ve ayarlar sekmesine bağlantı verir.
- **Derin bağlantılar.** Her bildirim, onu üreten nesneye bir `link` taşır; örneğin `/decisions?decision=d-03`, `/tasks?task=<id>` veya `/meetings/<id>`. Bağlantılar arayüzde ve bir veritabanı kontrol kısıtıyla doğrulanır: yalnızca tek eğik çizgiyle başlayan iç yollar kabul edilir, diğer her şey modülün giriş sayfasına geri döner.
- **Canlı teslim.** `use-workspace-realtime.ts`, `notifications`, `tasks`, `decisions`, `meetings`, `meeting_recordings`, `meeting_insights`, `knowledge_documents`, `organization_members` ve `project_members` için Supabase Realtime'a abone olur. Bildirim eklemeleri bir bildirim gösterir ve zili yeniler; diğer tablolar eşleşen TanStack Query anahtarlarını geçersiz kılar. Bildirim ve görev kanalları `user_id` / `organization_id` ile filtrelenir ve RLS her yükte hâlâ geçerlidir.
- **Demo teslim.** Kimlik bilgisi olmadan aynı kanca `src/lib/workspace-events.ts` içindeki `BroadcastChannel` veri yoluna abone olur. Uygulamayı iki sekmede açın: bir sekmedeki eylem diğerinde bildirim gösterir, zili günceller ve listeyi yeniler. Sekmeler arasında yalnızca bildirimler yüklerini taşır; diğer demo kaynakları sorguları geçersiz kılar çünkü her sekme kendi bellek içi deposunu tutar.
- **Ayarlar derin bağlantısı.** Ayarlar sekmeleri URL ile kontrol edilir (`/settings?tab=notifications`); böylece zil altbilgisi ve boş durum ipucu doğru panele iner.

---

## Ekip yönetimi ve roller

Ekip dizini çalışan bir izin yüzeyidir. Bir üye kartına tıklamak `/team?member=<id>` adresinde bir ayrıntı paneli açar; böylece ekip bildirimleri doğrudan değişen kişiye derin bağlantı verir.

- **Üye ayrıntısı.** Rol, durum, iş yükü, üyelik başlangıcı, açık atamalar ve proje erişimini gösterir. Aynı panel izleyiciler ve üyeler için salt okunurdur.
- **Roller.** Rolleri yalnızca sahipler ve yöneticiler değiştirebilir. Sahip rolü sabittir; yöneticiler `member` ve `viewer` atayabilir, bir yöneticiyi yalnızca sahip terfi ettirebilir veya düşürebilir. Kimse kendi rolünü değiştiremez. Her değişiklik bir etkinlik yazar ve üyeye `mentions` tercihi üzerinden bildirim gönderir.
- **Çıkarma.** Bir üyeyi çıkarmak proje üyeliklerini iptal eder ancak görev geçmişini korur. Bekleyen davetler aynı panelden iptal edilir. Sahipler çıkarılamaz, yöneticiler diğer yöneticileri çıkaramaz ve kimse kendini çıkaramaz.
- **Proje erişimi.** Sahipler ve yöneticiler ayrıntı panelinden proje atar. Erişim kabul edilmiş üyelerle sınırlıdır, proje sahipleri her zaman kendi projelerinde kalır ve projenin üye listesi aynı eylemde güncellenir.
- **Demo ve canlı eşliği.** Demo modu aynı kuralları `mocks/db.ts` içinde uygular; canlı mod `0008` security-definer RPC'lerini çağırır. Her iki yol da etkinlik, bildirim ve çalışma alanı olayları yazar; böylece başka bir sekme elle yenileme olmadan yenilenir.
- **Davet kapısı.** Davet eylemi yalnızca sahipler ve yöneticiler için gösterilir; API rotası bir şey göndermeden önce çağıranın aktif rolünü yeniden kontrol eder.

---

## Uluslararasılaştırma

- İngilizce kaynak dil ve varsayılandır; Türkçe **Ayarlar → Profil → Arayüz dili** bölümünden kullanılabilir.
- Katman bilinçli olarak küçüktür (`src/i18n/`): İngilizce metinler anahtardır, `messages/tr.ts` bunları Türkçeye eşler ve eksik bir kayıt ham anahtar yerine okunabilir İngilizceye geri döner.
- `I18nProvider`, kalıcı yerel ayarı `usePreferencesStore` üzerinden okur, `<html lang>` değerini eşitler ve tarihler, saatler, sayılar, göreli zaman, bitiş tarihleri ve selamlamalar için `t`, `plural` ve yerel ayara duyarlı `Intl` biçimlendiricilerini sunar.
- Tercih `nova-preferences` altında saklanır; böylece seçim yeniden yüklemelerde korunur. Sağlayıcı olmadan render edilen bileşenler (yalıtılmış birim testleri) her zaman İngilizceye geri döner.
- Arayüz metinleri çevrilir; toplantı başlıkları, proje adları ve AI yanıtları gibi çalışma alanı verileri özgün dillerinde kalır. CSV dışa aktarma başlıkları ve değerleri taşınabilirlik için İngilizce kalır; iş akışı tetikleyici/adım değerleri kanonik depolama anahtarları olarak İngilizce kalırken etiketleri çevrilir.
- `e2e/a11y.spec.ts` varsayılan İngilizce yerel ayarda çalışır; böylece axe kapısı gönderilen varsayılan deneyimi kapsar.

### Çeviri kapsamı koruması

`src/i18n/translation-coverage.test.ts` TypeScript AST'sinde gezer (regex değil) ve şu durumlarda CI'ı başarısız kılar:

- literal bir `t('…')`, `translate('…')`, `translateFor('en' | 'tr', '…')` veya `plural(…, '…', '…')` anahtarının `messages/tr.ts` içinde karşılığı yoksa;
- bir Türkçe kayıt `{{interpolation}}` yer tutucusunu eksiltiyor, ekliyor veya yeniden adlandırıyorsa;
- bir Türkçe kayıt boşsa;
- görünür JSX metni veya literal bir UI özelliği (`placeholder`, `title`, `aria-label`, `label`, `alt`, …) `t()` içine alınmamışsa.

Tek başına `npm run test -- src/i18n/translation-coverage.test.ts` ile çalıştırın. `t(roleLabel)` gibi dinamik anahtarlar statik olarak doğrulanamaz; bu etiketler veri katmanında kanonik İngilizce metin olarak kalır ve render sırasında çevrilir. Ek güvence olarak, geliştirme derlemeleri Türkçe sözlükte dinamik bir kayıt bulunamadığında anahtar adıyla birlikte bir kez `console.warn` yazar.

### Yeni sayfa veya bileşen ekleme

1. Kullanıcıya görünen her metni `t('English source string')` içine alın ve sayımlar için `plural()` kullanın.
2. Türkçe karşılığı `messages/tr.ts` dosyasına ekleyin ve her `{{placeholder}}` ifadesini koruyun.
3. Çalışma alanı verilerini (adlar, başlıklar, AI yanıtları, CSV değerleri) çevrilmemiş bırakın; yalnızca etrafındaki etiketi çevirin.
4. Aynı kalması gereken marka adları, klavye ipuçları ve saat dilimi tanımlayıcıları, nedeni açıklayan bir yorumla korumadaki `UNTRANSLATED_TEXT` (özellikler için `UNTRANSLATED_ATTRIBUTES`) listesine aittir.
5. Push etmeden önce korumayı çalıştırın; eksik bir kayıt, İngilizceyi sessizce yayınlamak yerine birim test işini başarısız kılar.

---

## Performans

- Kabuk, kimlik doğrulama koruması ve giriş ekranı hemen yüklenir; her çalışma alanı sayfası ilk ziyarette gelen bir `React.lazy` rota parçasıdır.
- `AppLayout`, `PageSkeleton` içeren tek bir `Suspense` sınırına sahiptir; böylece gezinme sırasında kenar çubuğu ve başlık bağlı kalırken sonraki sayfa akar. Nova Live'ın kendi tam ekran yedeği vardır.
- Pano istatistik kartları ilk boyamada Recharts yerine saf bir SVG sparkline (`src/lib/sparkline.ts`) kullanır. Recharts yalnızca gecikmeli `/analytics` sayfası tarafından içe aktarılır; grafik parçası (~409 kB, ≈118 kB gzip) yalnızca gerektiğinde yüklenir ve başlangıç HTML'si yalnızca react/data/ui parçalarını ön yükler. Çoğu sayfa parçası ~30 kB altında kalır, giriş paketi ~410 kB (≈120 kB gzip) civarındadır ve Vite 500 kB uyarısı vermez.

---

## Dayanıklılık ve erişilebilirlik

- Rota düzeyinde bir `ErrorBoundary` sayfa çıkışını sarar; böylece bir render hatası kenar çubuğunu, başlığı ve gezinmeyi kullanılabilir tutar. Başarısız rota parçaları tanınır ve yeniden deneme döngüsü yerine yeniden yükleme önerir; uygulama düzeyinde bir sınır son çare olarak kabuğu kapsar.
- Gezinme odağı `<main>` yer işaretine taşır ve kaydırmayı sıfırlar; ilk yükleme odağa dokunmaz.
- Bir atlama bağlantısı doğrudan `#main-content` hedefine gider ve her rota anlamlı bir belge başlığı belirler (`Tasks — Nova`, `Meeting detail — Nova`, …). Ayrıntı rotaları, sayfa yolunu Overview'a geri düşürmek yerine sahip olduğu modüle çözer.
- Bilinmeyen yollar hem sayfa yolunda hem sekme başlığında "Bulunamadı" olarak etiketlenir.
- **WCAG 2.2 AA CI'da zorunludur.** `e2e/a11y.spec.ts`, 14 çalışma alanı rotasını ve ana katmanları axe ile denetler ve herhangi bir ihlalde başarısız olur.
- Dolu birincil düğmeler, rozetler ve bildirim eylemleri, beyaz metnin 4.5:1 oranını geçmesi için `--primary-strong` kullanır; `--primary` koyu yüzeylerde bağlantılar ve simgeler için kalır. Soluk başlıklar azaltılmış saydamlık yerine tam `--muted-foreground` belirtecini kullanır.
- Kaydırılabilir transkript ve bildirim bölgeleri klavyeyle odaklanabilir, her `Progress` çubuğunun erişilebilir bir adı vardır, `aria-hidden` sarmalayıcıları içindeki grafikler Recharts erişilebilirlik katmanını devre dışı bırakır ve toplantı zaman çizelgesi filtresi, paneli olmayan sekmeler yerine etiketli bir geçiş grubudur (`aria-pressed`).

---

## Dağıtım

1. Depoyu içe aktarın.
2. **Root Directory** değerini `frontend` yapın.
3. Framework ön ayarı: Vite. Build: `npm run build`. Output: `dist`.
4. Yukarıdaki ortam değişkenlerini ekleyin (production + preview).
5. Dağıtın.

`frontend/vercel.json`, API olmayan rotaları `index.html` dosyasına yönlendirir (SPA yönlendirmesi) ve `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` ve `Permissions-Policy` başlıklarını ayarlar.

---

## Güvenlik modeli

- **Her yerde RLS.** Her kiracı tablosu `organization_members` üzerinden kapsamlanır; yardımcılar sabitlenmiş bir `search_path` ile `security definer`'dır.
- **En az ayrıcalık.** Davetler ve yönetici işlemleri yalnızca servis rolü anahtarına sahip sunucusuz fonksiyonlarda çalışır; tarayıcı publishable anahtarı kullanır.
- **Sır sızıntısı yok.** `.env` git tarafından yok sayılır; `.env.example` adları boş değerlerle listeler; istemciye yalnızca `VITE_*` değişkenleri ulaşır.
- **Depolama yalıtımı.** `meeting-assets` ve `meeting-recordings` bucket'ları özeldir ve kuruluş klasörüne göre anahtarlanır (`<org-uuid>/<file>`). Kayıtlar bir saatlik imzalı URL'lerle sunulur ve asla herkese açık bağlantılarla sunulmaz.
- **Sunucu tarafı dağıtım.** `notify_workspace()` sabitlenmiş bir `search_path` ile `security definer`'dır, çağıranın aktif üye olduğunu doğrular, türü ve bağlantıyı doğrular, hedef kitleyi kendisi çözer ve eylemi yapanı hariç tutar. Mevcut `notifications_insert` politikası yalnızca yöneticiye açık kalır; böylece üyeler birbirleri için bildirim uyduramaz.
- **Realtime RLS'e uyar.** Yayınlanan tablolar satır düzeyi güvenliği korur; bildirim abonelikleri oturum açmış kullanıcı ve çalışma alanına göre filtrelenir ve `full` replica identity yalnızca bir satırın ne kadarının yansıtıldığını değiştirir, kimin okuyabileceğini değil.
- **Ekip hiyerarşisi.** Üyelik yazmaları sabitlenmiş bir `search_path` ile `security definer` RPC'lerinden geçer; `organization_members` tablosuna doğrudan kimliği doğrulanmış yazmalar devre dışıdır ve `project_members` yazmaları sahipler/yöneticilerle sınırlıdır. RPC'ler sahip düşürmeyi/çıkarmayı, kendi üzerinde değişikliği, yöneticinin yönetici üzerindeki değişikliklerini ve sahip rolü atamayı reddeder; böylece arayüz kuralları sunucu tarafında da uygulanır.
- **İçgörü incelemesi.** `meeting_insights` kimliği doğrulanmış istemciler için yalnızca okunabilir. Kabul etme, reddetme, dönüştürme ve eşitleme işlemlerinin tümü, aktif üyeliği doğrulayan, izleyicileri reddeden, dönüştürülen bağlantıları tutarlı tutan ve etkinlik ile bildirimi aynı işlemde yazan `0009` security-definer RPC'lerinden geçer.
- **Girdi doğrulama.** API rotaları e-posta, rol ve UUID biçimlerini doğrular ve istek gövdelerini sınırlar.
- **Kötüye kullanım kontrolü.** Davetlerde isteğe bağlı Upstash hız sınırlama.

### Veri saklama ve silme

- **Medyadan önce onay.** Katılım öncesi ekran transkripti ve isteğe bağlı kaydı açıklar ve katılımcı onaylayana kadar odaya girişi engeller. Nova bir transkripti veya kaydı sessizce başlatmaz.
- **Medya varsayılan olarak özeldir.** Kayıtlar kuruluşa göre anahtarlanmış özel `meeting-recordings` bucket'ında durur ve bir saatlik imzalı URL'lerle sunulur.
- **Veritabanı silmeleri zincirleme çalışır.** Toplantıya ait satırlar (katılımcılar, transkript bölümleri, sohbet mesajları, kayıtlar, içgörüler) `on delete cascade` kullanır; toplantı silindiğinde ilişkili veriler de silinir. Depolama nesneleri veritabanı tarafından silinmez: dosyaları aynı işlemde Storage API'si üzerinden kaldırın.
- **Saklama süresini işletme belirler.** Transkriptlerin, kayıtların ve Bilgi notlarının ne kadar süre tutulacağına karar verin, bunu gizlilik bildiriminizde belirtin ve silmeleri planlayın. Demo verisi bellekte kalır ve sekmeden çıkmaz; tam sayfa yenileme tohum çalışma alanını geri yükler.
- **Erişim ve silme talepleri.** RLS her kiracı tablosunu aktif kuruluşla sınırladığı için dışa aktarma kapsamlı bir seçim, silme talebi ise üyenin ürettiği içeriğin ve üyelik satırlarının kapsamlı silinmesidir. Üretim dışa aktarımlarını asla demo moduna kopyalamayın.

Anahtarları döndürürseniz Vercel ortam değişkenlerini güncelleyin ve yeniden dağıtın. Gerçek kimlik bilgilerini asla commit etmeyin.

---

## Tasarım sistemi

- 68px sabit simge kenar çubuğu (`#111315`), 40×40 mavi aktif döşemeler ve sağ taraf ipuçları
- Sayfa yolu, ortalanmış arama, bildirimler ve avatar menüsü içeren sabit başlık
- Tercihe göre filtrelenmiş liste, okunmamış rozeti, güvenli derin bağlantılar ve eşleşen ayarlar sekmesini açan altbilgi içeren bildirim zili
- Mobil çekmece gezinmesi, erişilebilir etiketler ve klavye desteği
- Ayarlar içinde yerel dil adları, `aria-pressed` durumu ve kalıcı seçim içeren dil değiştirici
- Koyu yüzeyler, Manrope/Inter tipografisi, ölçülü mavi vurgu — gradyan veya parlama efekti yok
- Modüller: Overview, Projects, Tasks, Meetings, Nova Live, Decisions, Knowledge, Workflows, Intelligence, Analytics, Team, Settings
- Nova Live; cihazlar, görünen ad ve rıza içeren bir katılım öncesi kontrolü, altyazılar, sohbet, copilot ve kişiler panelleri olan tam ekran bir odayı, ardından rapor ve isteğe bağlı kayıt arşivi içeren bitmiş toplantı özetini açar
- Toplantı ayrıntısı, arşivlenen kayıtları satır içi oynatıcı, boyut, süre ve indirme eylemiyle gösterir
- Workflows, durum, tetikleyici, adım sonuçları ve süre içeren satır içi çalıştırma günlüğü sunar
- Analytics; KPI'ları, karar dağılımını, iş yükünü ve proje sağlığını 7, 14 veya 30 günlük pencereler için yeniden hesaplar
- Decisions; kabul et, reddet, yerine geç ve yeniden aç eylemleri, neden notu ve yalnızca ekleme yapılabilen durum geçmişi içeren bir ayrıntı paneli açar
- Knowledge; bölüm ayrıştırma, arama vurgulama, ilgili notlar ve kaynak toplantı bağlantıları içeren tam belge okuyucusu açar
- Ekip kartları, çağıranın rolüne göre kapılanan rol değişiklikleri, proje erişimi, açık atamalar ve üye çıkarma için bir yönetim paneli açar

- SVG favicon ve bir web uygulaması manifesti `public/` içinden gelir; böylece tarayıcı sekmeleri ve kurulu pencereler Nova işaretini koyu tema rengiyle taşır

Tüm etkileşimli kontroller bağlıdır: oluşturma pencereleri, görev durumu değişiklikleri, filtreler, dışa aktarmalar, ayar kalıcılığı, komut paleti (`Ctrl/⌘ + K`) ve bildirimler.
