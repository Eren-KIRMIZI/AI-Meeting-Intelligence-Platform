/**
 * Turkish interface dictionary.
 *
 * English source strings are the keys (see `translate.ts`), so a missing entry
 * falls back to readable English instead of a broken key. Add entries as UI
 * strings are migrated; data coming from the workspace (project names, meeting
 * titles, user content) is intentionally not translated.
 */
export const tr: Record<string, string> = {
  // Brand & shell
  'Nova — Meeting Intelligence Workspace': 'Nova — Toplantı Zekâsı Çalışma Alanı',
  'Meeting intelligence': 'Toplantı zekâsı',
  'Nova home': 'Nova ana sayfa',
  'Workspace navigation': 'Çalışma alanı gezinmesi',
  'Navigate between Nova workspace modules.':
    'Nova çalışma alanı modülleri arasında gezinin.',
  'Primary navigation': 'Ana gezinme',
  'Mobile navigation': 'Mobil gezinme',
  'Open navigation': 'Gezinmeyi aç',
  Breadcrumb: 'Sayfa yolu',
  'Skip to content': 'İçeriğe geç',
  'Workspace': 'Çalışma Alanı',
  'Workspace member': 'Çalışma alanı üyesi',
  'Workspace settings': 'Çalışma alanı ayarları',
  'Nova workspace': 'Nova çalışma alanı',
  '{{name}} account menu': '{{name}} hesap menüsü',
  'Product Lead': 'Ürün Lideri',
  'your workspace': 'çalışma alanınız',
  Tasks: 'Görevler',
  Integrations: 'Entegrasyonlar',
  'No email': 'E-posta yok',
  'No email on this account': 'Bu hesapta e-posta yok',
  Demo: 'Demo',
  Live: 'Canlı',
  'Log out': 'Çıkış yap',
  'Sign out': 'Çıkış yap',
  'Demo session ended': 'Demo oturumu sona erdi',
  'Signed out': 'Çıkış yapıldı',
  'Profile': 'Profil',
  'Command menu': 'Komut menüsü',
  'Search for tasks, projects, meetings, or team members...':
    'Görev, proje, toplantı veya ekip üyesi arayın...',
  'Search workspace...': 'Çalışma alanında ara...',
  'Search workspace': 'Çalışma alanında ara',
  'Search workspace or jump to...': 'Çalışma alanında arayın veya bir modüle gidin...',
  'Search for projects, tasks, meetings and team members, or jump to a workspace module.':
    'Proje, görev, toplantı ve ekip üyelerinde arayın veya bir çalışma alanı modülüne gidin.',
  'Workspace results': 'Çalışma alanı sonuçları',
  'No results': 'Sonuç yok',
  'Try a project name, task, meeting or team member.':
    'Bir proje adı, görev, toplantı veya ekip üyesi deneyin.',
  Navigate: 'Gezin',
  'to navigate': 'gezinmek için',
  'to open': 'açmak için',

  // Navigation
  Overview: 'Genel Bakış',
  Projects: 'Projeler',
  'My Tasks': 'Görevlerim',
  Meetings: 'Toplantılar',
  Decisions: 'Kararlar',
  Knowledge: 'Bilgi Bankası',
  Workflows: 'İş Akışları',
  'AI Intelligence': 'AI Zekâsı',
  Analytics: 'Analizler',
  Team: 'Ekip',
  Settings: 'Ayarlar',
  'Workspace pulse, projects and activity':
    'Çalışma alanı nabzı, projeler ve etkinlik',
  'Portfolio health and delivery': 'Portföy sağlığı ve teslimat',
  'Everything assigned to you': 'Size atanan her şey',
  'Schedule, briefs and recordings': 'Takvim, özetler ve kayıtlar',
  'Run a meeting with live captions and AI follow-ups':
    'Canlı altyazı ve AI takipleriyle toplantı yönetin',
  'The decision log and its owners': 'Karar günlüğü ve sahipleri',
  'Meeting notes and company memory': 'Toplantı notları ve kurumsal hafıza',
  'Automations from signal to action': 'Sinyalden aksiyona otomasyonlar',
  'Extracted summaries, decisions and actions':
    'Çıkarılan özetler, kararlar ve aksiyonlar',
  'Execution velocity and team capacity': 'Uygulama hızı ve ekip kapasitesi',
  'Members, roles and workload': 'Üyeler, roller ve iş yükü',
  'Profile, workspace and integrations': 'Profil, çalışma alanı ve entegrasyonlar',
  'Meeting detail': 'Toplantı detayı',
  'Project detail': 'Proje detayı',
  'Live room': 'Canlı oturum',
  'Not found': 'Bulunamadı',
  'Page not found': 'Sayfa bulunamadı',
  'Sign in': 'Giriş yap',

  // Notifications
  Notifications: 'Bildirimler',
  'Mark all read': 'Tümünü okundu işaretle',
  'All notifications marked as read': 'Tüm bildirimler okundu olarak işaretlendi',
  'You are all caught up.': 'Tüm bildirimleri gördünüz.',
  'No notifications match your preferences.':
    'Tercihlerinizle eşleşen bildirim yok.',
  'Review notification settings': 'Bildirim ayarlarını gözden geçir',
  'Notification settings': 'Bildirim ayarları',
  'View workspace activity': 'Çalışma alanı etkinliğini gör',
  '{{count}} new': '{{count}} yeni',
  'Notifications, {{count}} unread': 'Bildirimler, {{count}} okunmamış',
  '{{count}} notification hidden by your preferences':
    '{{count}} bildirim tercihleriniz nedeniyle gizlendi',
  '{{count}} notifications hidden by your preferences':
    '{{count}} bildirim tercihleriniz nedeniyle gizlendi',
  'just now': 'az önce',
  '{{count}}m ago': '{{count}} dk önce',
  '{{count}}h ago': '{{count}} sa önce',
  '{{count}}d ago': '{{count}} gün önce',

  // Auth
  'Welcome back': 'Tekrar hoş geldiniz',
  'Demo workspace': 'Demo çalışma alanı',
  'Live workspace': 'Canlı çalışma alanı',
  'Step into Nova': 'Nova’ya adım atın',
  'Sign in to Nova': 'Nova’ya giriş yapın',
  'Explore the full workspace with a prepared demo team, projects and meeting history.':
    'Hazır bir demo ekibi, projeler ve toplantı geçmişiyle çalışma alanının tamamını keşfedin.',
  'Use your workspace credentials to open the meeting intelligence hub.':
    'Toplantı zekâsı merkezini açmak için çalışma alanı kimlik bilgilerinizi kullanın.',
  'Enter demo workspace': 'Demo çalışma alanına gir',
  'No credentials are required. Demo records live in this browser and reset when you reload the app.':
    'Kimlik bilgisi gerekmez. Demo kayıtları bu tarayıcıda yaşar ve uygulamayı yenilediğinizde sıfırlanır.',
  'Work email': 'İş e-postası',
  Password: 'Parola',
  'Enter your email and password to continue.':
    'Devam etmek için e-posta ve parolanızı girin.',
  'Sign in failed. Check your credentials and try again.':
    'Giriş başarısız. Kimlik bilgilerinizi kontrol edip tekrar deneyin.',
  'Access is managed by your organization. Ask a workspace admin if you need an invitation.':
    'Erişim kuruluşunuz tarafından yönetilir. Davet gerekiyorsa çalışma alanı yöneticinize başvurun.',
  'Connect Supabase credentials to enable live email sign-in and shared workspace data.':
    'Canlı e-posta girişini ve paylaşılan çalışma alanı verilerini etkinleştirmek için Supabase kimlik bilgilerini bağlayın.',
  'Sessions are protected by Supabase Auth. Workspace data is isolated with row-level security.':
    'Oturumlar Supabase Auth ile korunur. Çalışma alanı verileri satır düzeyi güvenlikle izole edilir.',
  'Turn every conversation into work that actually moves.':
    'Her konuşmayı gerçekten ilerleyen işe dönüştürün.',
  'Nova connects meeting briefs, decisions, projects and the people who own them — so the signal survives the call.':
    'Nova; toplantı özetlerini, kararları, projeleri ve bunların sahiplerini birbirine bağlar — böylece sinyal görüşmeden sonra da yaşar.',
  'Meeting-to-execution workspace': 'Toplantıdan uygulamaya çalışma alanı',
  'Every meeting becomes a brief with owners and next steps.':
    'Her toplantı, sahipleri ve sonraki adımlarıyla bir özete dönüşür.',
  'Decisions stay in one log instead of scattered across calls.':
    'Kararlar görüşmelere dağılmak yerine tek bir günlükte kalır.',
  'Delivery, capacity and meeting output share one workspace.':
    'Teslimat, kapasite ve toplantı çıktısı aynı çalışma alanını paylaşır.',
  'Nova Labs · Workspace intelligence': 'Nova Labs · Çalışma alanı zekâsı',
  'Private by design': 'Tasarımı gereği gizli',
  'Pro plan · 7 members · 5 projects': 'Pro plan · 7 üye · 5 proje',

  // 404 & errors
  'Error 404': 'Hata 404',
  'This page is not on the map': 'Bu sayfa haritada yok',
  'The link may be outdated, or the workspace module moved. Head back to the overview to keep working.':
    'Bağlantı eski olabilir veya çalışma alanı modülü taşınmış olabilir. Çalışmaya devam etmek için genel bakışa dönün.',
  'Back to overview': 'Genel bakışa dön',
  'Browse meetings': 'Toplantılara göz at',
  'This page could not be downloaded': 'Bu sayfa indirilemedi',
  'This page hit a snag': 'Bu sayfada bir sorun oluştu',
  'A part of the workspace did not arrive. Your data is safe — reload to fetch the latest version of this page.':
    'Çalışma alanının bir bölümü ulaşmadı. Verileriniz güvende — bu sayfanın son sürümünü almak için yenileyin.',
  'Something unexpected interrupted this view. The rest of the workspace is still available, so you can retry or head back to the overview.':
    'Beklenmedik bir durum bu görünümü kesti. Çalışma alanının geri kalanı kullanılabilir; tekrar deneyebilir veya genel bakışa dönebilirsiniz.',
  'Reload page': 'Sayfayı yenile',
  'Try again': 'Tekrar dene',
  'Nova needs a moment': 'Nova’nın bir anlık molaya ihtiyacı var',
  'The workspace could not render this view. Your meetings, tasks and decisions are safe — reload to reconnect.':
    'Çalışma alanı bu görünümü oluşturamadı. Toplantılarınız, görevleriniz ve kararlarınız güvende — yeniden bağlanmak için sayfayı yenileyin.',
  'Reload Nova': 'Nova’yı yenile',
  'Could not load this view': 'Bu görünüm yüklenemedi',
  'The workspace data did not arrive. Check your connection and try again.':
    'Çalışma alanı verileri ulaşmadı. Bağlantınızı kontrol edip tekrar deneyin.',
  'The workspace did not load.': 'Çalışma alanı yüklenemedi.',

  // Status labels
  Planning: 'Planlanıyor',
  'On track': 'Yolunda',
  'At risk': 'Risk altında',
  'Off track': 'Yolundan çıktı',
  Completed: 'Tamamlandı',
  Backlog: 'Birikim',
  'To do': 'Yapılacak',
  'In progress': 'Devam ediyor',
  'In review': 'İncelemede',
  Done: 'Bitti',
  Low: 'Düşük',
  Medium: 'Orta',
  High: 'Yüksek',
  Urgent: 'Acil',
  Proposed: 'Önerildi',
  Accepted: 'Kabul edildi',
  Rejected: 'Reddedildi',
  Superseded: 'Geçersiz kılındı',
  Scheduled: 'Planlandı',
  Processing: 'İşleniyor',
  Cancelled: 'İptal edildi',
  Connected: 'Bağlı',
  Available: 'Kullanılabilir',
  'Needs attention': 'İlgi gerekiyor',

  // Dates & common
  'No due date': 'Bitiş tarihi yok',
  Today: 'Bugün',
  Tomorrow: 'Yarın',
  Yesterday: 'Dün',
  'Good morning': 'Günaydın',
  'Good afternoon': 'İyi günler',
  'Good evening': 'İyi akşamlar',
  'Demo data': 'Demo verisi',

  // Dashboard stats
  'Active projects': 'Aktif projeler',
  'Completed tasks': 'Tamamlanan görevler',
  'Upcoming tasks': 'Yaklaşan görevler',
  'Overdue tasks': 'Geciken görevler',
  'vs last month': 'geçen aya göre',
  'vs last week': 'geçen haftaya göre',
  'next 14 days': 'önümüzdeki 14 gün',
  '12 due': '12 görev var',

  // Overview
  'Here is what is moving across {{workspace}} today — projects, decisions and the meetings that connect them.':
    'Bugün {{workspace}} genelinde neler oluyor — projeler, kararlar ve onları birbirine bağlayan toplantılar.',
  'Schedule meeting': 'Toplantı planla',
  'New project': 'Yeni proje',
  'Board preview': 'Pano önizlemesi',
  Board: 'Pano',
  List: 'Liste',
  'Workspace data is refreshed automatically.':
    'Çalışma alanı verileri otomatik olarak yenilenir.',
  Refresh: 'Yenile',
  'Recent activity': 'Son etkinlik',
  'What changed across the workspace': 'Çalışma alanında neler değişti',
  'No activity yet. New work will appear here.':
    'Henüz etkinlik yok. Yeni işler burada görünecek.',
  'AI brief': 'AI özeti',
  'The latest meeting, distilled': 'En son toplantının özeti',
  Open: 'Aç',
  'Summary ready': 'Özet hazır',
  'Updated {{time}}': '{{time}} güncellendi',
  '{{connected}} of {{total}} tools connected':
    '{{total}} araçtan {{connected}} tanesi bağlı',
  Manage: 'Yönet',
  'No integrations available yet.': 'Henüz kullanılabilir entegrasyon yok.',
  'Connections are simulated in demo mode.':
    'Bağlantılar demo modunda simüle edilir.',
  'Project overview': 'Proje özeti',
  'Portfolio health across active work': 'Aktif işlerde portföy sağlığı',
  'View all': 'Tümünü gör',
  'No projects match this filter': 'Bu filtreyle eşleşen proje yok',
  'Try a different status filter or create a new project.':
    'Farklı bir durum filtresi deneyin veya yeni bir proje oluşturun.',
  Due: 'Bitiş',
  '{{priority}} priority': '{{priority}} öncelik',
  'Execution board': 'Uygulama panosu',
  'Tasks moving through the current cycle':
    'Mevcut döngüde ilerleyen görevler',
  'Add task': 'Görev ekle',
  'Open board': 'Panoyu aç',
  'No tasks': 'Görev yok',
  '{{count}} open tasks': '{{count}} açık görev',
  '{{count}} completed': '{{count}} tamamlandı',
  'Upcoming meetings': 'Yaklaşan toplantılar',
  'Agendas and briefs for the next conversations':
    'Sonraki görüşmeler için gündemler ve özetler',
  'No meetings scheduled': 'Planlanmış toplantı yok',
  'Put the next conversation on the calendar.':
    'Bir sonraki görüşmeyi takvime ekleyin.',
  'Schedule another meeting': 'Başka bir toplantı planla',
  '{{count}} min': '{{count}} dk',
  'In person': 'Yüz yüze',

  // Tasks
  'Tasks could not be loaded.': 'Görevler yüklenemedi.',
  'There are no tasks to export': 'Dışa aktarılacak görev yok',
  'Tasks exported': 'Görevler dışa aktarıldı',
  'Open tasks': 'Açık görevler',
  Overdue: 'Geciken',
  'Due soon': 'Yakında bitiyor',
  'Every commitment in one place — filter by project, priority or status and keep work moving.':
    'Tüm taahhütler tek yerde — proje, öncelik veya duruma göre filtreleyin ve işi ilerletin.',
  '{{count}} open': '{{count}} açık',
  Export: 'Dışa aktar',
  'New task': 'Yeni görev',
  'Search tasks, projects, people or tags...':
    'Görev, proje, kişi veya etiket arayın...',
  'Search tasks': 'Görevlerde ara',
  'Filter by project': 'Projeye göre filtrele',
  'All projects': 'Tüm projeler',
  'Filter by status': 'Duruma göre filtrele',
  'All statuses': 'Tüm durumlar',
  'Filter by priority': 'Önceliğe göre filtrele',
  'All priorities': 'Tüm öncelikler',
  'Showing {{shown}} of {{total}} tasks':
    '{{total}} görevden {{shown}} tanesi gösteriliyor',
  'Clear filters': 'Filtreleri temizle',
  'No tasks match these filters': 'Bu filtrelerle eşleşen görev yok',
  'Clear the filters to see the whole board, or add a new task to get started.':
    'Tüm panoyu görmek için filtreleri temizleyin veya başlamak için yeni bir görev ekleyin.',
  Task: 'Görev',
  Assignee: 'Atanan',
  Priority: 'Öncelik',
  Status: 'Durum',
  Unassigned: 'Atanmamış',
  'A task title is required': 'Görev başlığı gerekli',
  '“{{title}}” added to {{project}}': '“{{title}}” {{project}} projesine eklendi',
  'Could not create task': 'Görev oluşturulamadı',
  'Create a task': 'Görev oluştur',
  'Turn the next commitment into a clear, owned piece of work.':
    'Sıradaki taahhüdü net ve sahipli bir işe dönüştürün.',
  'Task title': 'Görev başlığı',
  'e.g. Finalize the launch cohort list':
    'örn. Lansman kohort listesini tamamla',
  Project: 'Proje',
  'No project': 'Proje yok',
  'Due date': 'Bitiş tarihi',
  Cancel: 'İptal',
  'Create task': 'Görev oluştur',
  '“{{title}}” updated': '“{{title}}” güncellendi',
  'Could not update the task': 'Görev güncellenemedi',
  '“{{title}}” completed': '“{{title}}” tamamlandı',
  '“{{title}}” reopened': '“{{title}}” yeniden açıldı',
  'Task details': 'Görev detayları',
  Description: 'Açıklama',
  'Add context, links or acceptance criteria...':
    'Bağlam, bağlantı veya kabul kriterleri ekleyin...',
  'Created {{time}}': '{{time}} oluşturuldu',
  'From a meeting': 'Bir toplantıdan',
  'Open source meeting': 'Kaynak toplantıyı aç',
  'Reopen task': 'Görevi yeniden aç',
  'Mark done': 'Tamamlandı işaretle',
  'Save changes': 'Değişiklikleri kaydet',
  'Mark “{{title}}” as {{state}}': '“{{title}}” görevini {{state}} olarak işaretle',
  open: 'açık',
  done: 'tamamlandı',

  // Projects
  'Projects could not be loaded.': 'Projeler yüklenemedi.',
  Active: 'Aktif',
  'There are no projects to export': 'Dışa aktarılacak proje yok',
  'Projects exported': 'Projeler dışa aktarıldı',
  '{{count}} total': 'toplam {{count}}',
  'Portfolio health, ownership and delivery across every active initiative.':
    'Tüm aktif girişimlerde portföy sağlığı, sahiplik ve teslimat.',
  'Try another status or create the next project your team needs.':
    'Başka bir durum deneyin veya ekibinizin ihtiyaç duyduğu sıradaki projeyi oluşturun.',
  'No description yet.': 'Henüz açıklama yok.',
  Progress: 'İlerleme',
  '{{count}} tasks': '{{count}} görev',
  '{{count}} done': '{{count}} tamamlandı',
  'Due {{date}}': 'Bitiş {{date}}',
  'Open project': 'Projeyi aç',
  'Back to projects': 'Projelere dön',
  'Project not found': 'Proje bulunamadı',
  'This project may have been removed, or the link is out of date.':
    'Bu proje kaldırılmış olabilir veya bağlantı güncel değil.',
  '{{count}} members': '{{count}} üye',
  'All tasks': 'Tüm görevler',
  'Delivery progress': 'Teslimat ilerlemesi',
  Activity: 'Etkinlik',
  'No tasks in this project': 'Bu projede görev yok',
  'Create the first task or turn a meeting action item into owned work.':
    'İlk görevi oluşturun veya bir toplantı aksiyon maddesini sahipli işe dönüştürün.',
  'No description': 'Açıklama yok',
  'No meetings linked to this project': 'Bu projeye bağlı toplantı yok',
  'Meetings scheduled with this project will appear here with their briefs and extracted follow-ups.':
    'Bu projeyle planlanan toplantılar, özetleri ve çıkarılan takipleriyle burada görünecek.',
  Analyzed: 'Analiz edildi',
  'No brief yet.': 'Henüz özet yok.',
  '{{count}} participants': '{{count}} katılımcı',
  'Open workspace': 'Çalışma alanını aç',
  'No decisions recorded yet': 'Henüz kayıtlı karar yok',
  "Confirm a decision from a meeting workspace and it will join this project's decision log.":
    'Bir toplantı çalışma alanından kararı onaylayın; bu projenin karar günlüğüne eklenecek.',
  '{{impact}} impact': '{{impact}} etki',
  '{{analyzed}} of {{total}} meetings have an intelligence brief.':
    '{{total}} toplantıdan {{analyzed}} tanesinin zekâ özeti var.',
  'A project name is required': 'Proje adı gerekli',
  '“{{name}}” created': '“{{name}}” oluşturuldu',
  'Could not create project': 'Proje oluşturulamadı',
  'Create a project': 'Proje oluştur',
  'Start a focused space for the work that follows your next meeting.':
    'Bir sonraki toplantınızdan doğan işler için odaklı bir alan başlatın.',
  'Project name': 'Proje adı',
  'e.g. Customer insight hub': 'örn. Müşteri içgörü merkezi',
  'What outcome should this project create?':
    'Bu proje hangi sonucu yaratmalı?',
  Category: 'Kategori',
  Product: 'Ürün',
  Research: 'Araştırma',
  Marketing: 'Pazarlama',
  Operations: 'Operasyon',
  Engineering: 'Mühendislik',
  'Target date': 'Hedef tarih',
  'Create project': 'Proje oluştur',

  // Settings
  'Your profile, workspace defaults and the controls that keep work predictable.':
    'Profiliniz, çalışma alanı varsayılanları ve işi öngörülebilir tutan kontroller.',
  'How you appear across meetings, projects and the decision log.':
    'Toplantılarda, projelerde ve karar günlüğünde nasıl göründüğünüz.',
  'Demo profile': 'Demo profili',
  'Display name': 'Görünen ad',
  'Your name': 'Adınız',
  'Job title': 'İş unvanı',
  'Email is managed by your authentication provider and cannot be changed here.':
    'E-posta, kimlik doğrulama sağlayıcınız tarafından yönetilir ve burada değiştirilemez.',
  'Save profile': 'Profili kaydet',
  'Enter a display name with at least 2 characters':
    'En az 2 karakterlik bir görünen ad girin',
  'Profile preferences saved': 'Profil tercihleri kaydedildi',
  'Organization defaults for dates, planning and reporting.':
    'Tarihler, planlama ve raporlama için kuruluş varsayılanları.',
  'Pro plan · {{count}} members': 'Pro plan · {{count}} üye',
  Timezone: 'Saat dilimi',
  'Week starts on': 'Hafta başlangıcı',
  Monday: 'Pazartesi',
  Sunday: 'Pazar',
  'Workspace data': 'Çalışma alanı verileri',
  'Download a JSON snapshot of projects, tasks, meetings and decisions.':
    'Projeler, görevler, toplantılar ve kararlar için bir JSON anlık görüntüsü indirin.',
  'Export data': 'Verileri dışa aktar',
  'Save workspace': 'Çalışma alanını kaydet',
  'Workspace preferences saved': 'Çalışma alanı tercihleri kaydedildi',
  'Workspace export downloaded': 'Çalışma alanı dışa aktarımı indirildi',
  'Choose which meeting and delivery signals reach you.':
    'Hangi toplantı ve teslimat sinyallerinin size ulaşacağını seçin.',
  'Meeting briefs': 'Toplantı özetleri',
  'Notify me when a meeting summary and action items are ready.':
    'Bir toplantı özeti ve aksiyon maddeleri hazır olduğunda beni bilgilendir.',
  'Action item updates': 'Aksiyon maddesi güncellemeleri',
  'Tell me when an action item I own is assigned or becomes overdue.':
    'Sahip olduğum bir aksiyon maddesi atandığında veya geciktiğinde bana bildir.',
  'Decision reviews': 'Karar incelemeleri',
  'Send a reminder when a decision is waiting for my input.':
    'Bir karar benim girdimi beklediğinde hatırlatma gönder.',
  'Weekly digest': 'Haftalık özet',
  'A Friday summary of delivery, decisions and meeting output.':
    'Teslimat, kararlar ve toplantı çıktısının cuma özeti.',
  'Mentions and account updates': 'Bahsetmeler ve hesap güncellemeleri',
  'Notify me when a teammate mentions me or my role and project access change.':
    'Bir ekip arkadaşım benden bahsettiğinde veya rolüm ve proje erişimim değiştiğinde beni bilgilendir.',
  'Toggle {{label}}': '{{label}} aç/kapat',
  'These switches filter the notification menu immediately and are stored in this browser. Email delivery is configured when a live workspace is connected.':
    'Bu anahtarlar bildirim menüsünü hemen filtreler ve bu tarayıcıda saklanır. E-posta gönderimi, canlı bir çalışma alanı bağlandığında yapılandırılır.',
  'Connect the tools where your meetings and follow-ups already live.':
    'Toplantılarınızın ve takiplerinizin zaten yaşadığı araçları bağlayın.',
  '{{count}} connected': '{{count}} bağlı',
  'No integrations are available yet.': 'Henüz kullanılabilir entegrasyon yok.',
  '{{category}} integration': '{{category}} entegrasyonu',
  'Disconnect {{name}}': '{{name}} bağlantısını kes',
  'Connect {{name}}': '{{name}} bağla',
  'Connections are simulated in demo mode and never store provider secrets in the browser.':
    'Bağlantılar demo modunda simüle edilir ve sağlayıcı sırları hiçbir zaman tarayıcıda saklanmaz.',
  'Access and sessions': 'Erişim ve oturumlar',
  'Controls for account protection and workspace data.':
    'Hesap koruması ve çalışma alanı verileri için kontroller.',
  'Require two-factor for admins': 'Yöneticiler için iki faktör zorunlu olsun',
  'Enforce a second factor before an admin can manage members or integrations.':
    'Bir yönetici üyeleri veya entegrasyonları yönetmeden önce ikinci faktörü zorunlu kıl.',
  'Session alerts': 'Oturum uyarıları',
  'Email me when a new device signs in to this workspace.':
    'Bu çalışma alanına yeni bir cihaz giriş yaptığında bana e-posta gönder.',
  'Download workspace data': 'Çalışma alanı verilerini indir',
  'A portable snapshot of the records you can already see.':
    'Zaten görebildiğiniz kayıtların taşınabilir bir anlık görüntüsü.',
  Download: 'İndir',
  'Current session': 'Mevcut oturum',
  'This browser': 'Bu tarayıcı',
  'Signed in': 'Giriş yapıldı',
  'Demo session': 'Demo oturumu',
  'Supabase session': 'Supabase oturumu',
  'Security toggles are stored locally in this build. They are ready to be wired to server-side policy enforcement before production use.':
    'Güvenlik anahtarları bu sürümde yerel olarak saklanır. Üretim kullanımından önce sunucu tarafı politika uygulamasına bağlanmaya hazırdır.',
  'Signing out clears this browser session.':
    'Çıkış yapmak bu tarayıcı oturumunu temizler.',
  '{{label}} preference updated': '{{label}} tercihi güncellendi',
  'Could not update the integration': 'Entegrasyon güncellenemedi',
  '{{name}} connected': '{{name}} bağlandı',
  '{{name}} disconnected': '{{name}} bağlantısı kesildi',
  'Two-factor requirement': 'İki faktör zorunluluğu',
  'Toggle two-factor requirement': 'İki faktör zorunluluğunu aç/kapat',
  'Toggle session alerts': 'Oturum uyarılarını aç/kapat',

  // Meetings
  'Meetings could not be loaded.': 'Toplantılar yüklenemedi.',
  Upcoming: 'Yaklaşan',
  'Action items': 'Aksiyon maddeleri',
  'Schedule the conversation, capture the signal and leave with an owned brief.':
    'Görüşmeyi planlayın, sinyali yakalayın ve sahipli bir özetle ayrılın.',
  'Meeting timeline': 'Toplantı zaman çizelgesi',
  'Past briefs': 'Geçmiş özetler',
  'Search meetings or agenda...': 'Toplantı veya gündem arayın...',
  'Search meetings': 'Toplantılarda ara',
  'No meetings match this search': 'Bu aramayla eşleşen toplantı yok',
  'No meetings here yet': 'Burada henüz toplantı yok',
  'Try another title, project or agenda item.':
    'Başka bir başlık, proje veya gündem maddesi deneyin.',
  'Schedule the next conversation to start building the brief.':
    'Özeti oluşturmaya başlamak için sıradaki görüşmeyi planlayın.',
  'Completed meetings and their briefs will appear here.':
    'Tamamlanan toplantılar ve özetleri burada görünecek.',
  Transcript: 'Transkript',
  'Agenda: {{items}}': 'Gündem: {{items}}',
  'View details': 'Detayları gör',
  'Back to meetings': 'Toplantılara dön',
  'Meeting not found': 'Toplantı bulunamadı',
  'This meeting may have been removed, or the link is out of date.':
    'Bu toplantı kaldırılmış olabilir veya bağlantı güncel değil.',
  'Select at least one action item or decision.':
    'En az bir aksiyon maddesi veya karar seçin.',
  '{{count}} task': '{{count}} görev',
  '{{count}} decision': '{{count}} karar',
  '{{count}} decisions': '{{count}} karar',
  'Created {{items}} from this meeting.':
    'Bu toplantıdan {{items}} oluşturuldu.',
  and: 've',
  'Follow-ups were already created.': 'Takipler zaten oluşturulmuş.',
  'Could not create the follow-ups.': 'Takipler oluşturulamadı.',
  'Analyze transcript': 'Transkripti analiz et',
  'Project tasks': 'Proje görevleri',
  Summary: 'Özet',
  'Key points': 'Önemli noktalar',
  '{{count}} extracted': '{{count}} çıkarıldı',
  'No action items were detected in this transcript.':
    'Bu transkriptte aksiyon maddesi tespit edilmedi.',
  'Select action: {{text}}': 'Aksiyon seç: {{text}}',
  'Task created': 'Görev oluşturuldu',
  '{{count}} detected': '{{count}} tespit edildi',
  'No explicit decisions were detected. Add one from the transcript when the team confirms it.':
    'Açık bir karar tespit edilmedi. Ekip onayladığında transkriptten bir karar ekleyin.',
  'Select decision: {{title}}': 'Karar seç: {{title}}',
  'In decision log': 'Karar günlüğünde',
  'Risks to watch': 'İzlenecek riskler',
  '{{count}} lines': '{{count}} satır',
  'Follow-through': 'Takip',
  'Extraction confidence': 'Çıkarım güveni',
  Actions: 'Aksiyonlar',
  Risks: 'Riskler',
  Pipeline: 'İşlem hattı',
  'Selected follow-ups': 'Seçilen takipler',
  'Select actions or decisions to write them into the workspace.':
    'Çalışma alanına yazmak için aksiyon veya karar seçin.',
  '{{count}} item ready to create.': '{{count}} öğe oluşturulmaya hazır.',
  'Creating…': 'Oluşturuluyor…',
  'Create follow-ups': 'Takipleri oluştur',
  'Tasks land in the project. Decisions go to the decision log. Nothing is written until you confirm.':
    'Görevler projeye eklenir. Kararlar karar günlüğüne gider. Siz onaylayana kadar hiçbir şey yazılmaz.',
  'Meeting context': 'Toplantı bağlamı',
  Agenda: 'Gündem',
  'No agenda was added.': 'Gündem eklenmedi.',
  Participants: 'Katılımcılar',
  'Transcript is ready for analysis': 'Transkript analiz için hazır',
  'No analysis yet': 'Henüz analiz yok',
  'This meeting finished recording. Run the extractor to turn the transcript into a summary, decisions and owned action items.':
    'Bu toplantının kaydı tamamlandı. Transkripti özete, kararlara ve sahipli aksiyon maddelerine dönüştürmek için çıkarıcıyı çalıştırın.',
  'Paste a transcript to preview the full intelligence flow. Nothing is written to the workspace until you confirm the extracted follow-ups.':
    'Tüm zekâ akışını önizlemek için bir transkript yapıştırın. Çıkarılan takipleri onaylayana kadar çalışma alanına hiçbir şey yazılmaz.',
  Normalize: 'Normalleştir',
  'Speakers and timestamps': 'Konuşmacılar ve zaman damgaları',
  Extract: 'Çıkar',
  'Summary, risks, decisions': 'Özet, riskler, kararlar',
  Commit: 'Kaydet',
  'Tasks and decision log': 'Görevler ve karar günlüğü',
  'A meeting title is required': 'Toplantı başlığı gerekli',
  'Choose a valid date and time': 'Geçerli bir tarih ve saat seçin',
  '“{{title}}” scheduled': '“{{title}}” planlandı',
  'Could not schedule the meeting': 'Toplantı planlanamadı',
  'Schedule a meeting': 'Toplantı planla',
  'Add the conversation and agenda so Nova can prepare the brief.':
    'Nova özeti hazırlayabilsin diye görüşmeyi ve gündemi ekleyin.',
  'Meeting title': 'Toplantı başlığı',
  'e.g. Weekly product sync': 'örn. Haftalık ürün senkronizasyonu',
  Date: 'Tarih',
  Time: 'Saat',
  Minutes: 'Dakika',
  Platform: 'Platform',
  'One agenda item per line. Nova uses these to prepare the brief.':
    'Her satıra bir gündem maddesi. Nova bunları özeti hazırlamak için kullanır.',
  'Launch readiness\nOpen decisions\nNext steps':
    'Lansman hazırlığı\nAçık kararlar\nSonraki adımlar',
  'Paste a transcript with at least a few lines.':
    'En az birkaç satırlık bir transkript yapıştırın.',
  'Analysis ready — review the extracted signal.':
    'Analiz hazır — çıkarılan sinyali inceleyin.',
  'Could not analyze this meeting.': 'Bu toplantı analiz edilemedi.',
  'Turn “{{title}}” into a summary, decisions, risks and owned action items.':
    '“{{title}}” toplantısını özete, kararlara, risklere ve sahipli aksiyon maddelerine dönüştürün.',
  'Paste a transcript to extract the meeting signal.':
    'Toplantı sinyalini çıkarmak için bir transkript yapıştırın.',
  'What runs': 'Neler çalışır',
  'Normalize transcript': 'Transkripti normalleştir',
  'Speakers, timestamps and line breaks':
    'Konuşmacılar, zaman damgaları ve satır sonları',
  'Extract signal': 'Sinyali çıkar',
  'Summary, decisions, risks and action items':
    'Özet, kararlar, riskler ve aksiyon maddeleri',
  'Prepare follow-through': 'Takibi hazırla',
  'Owners, due dates and confidence': 'Sahipler, bitiş tarihleri ve güven',
  'Demo mode uses the same deterministic extractor as the sample data, so you can try the full flow without a provider.':
    'Demo modu, örnek verilerle aynı deterministik çıkarıcıyı kullanır; böylece tüm akışı sağlayıcı olmadan deneyebilirsiniz.',
  "Ayşe: Let's review the launch plan...":
    'Ayşe: Lansman planını gözden geçirelim...',
  'Reset to sample transcript': 'Örnek transkripte sıfırla',
  '{{count}} words': '{{count}} kelime',
  'Analyzing…': 'Analiz ediliyor…',
  'Run analysis': 'Analizi çalıştır',
  'Transcript ready': 'Transkript hazır',
  'Transcript pending': 'Transkript bekliyor',
  '{{count}} minutes': '{{count}} dakika',
  'No participants yet': 'Henüz katılımcı yok',
  'Linked to {{project}}': '{{project}} projesine bağlı',
  'No agenda was added for this meeting.':
    'Bu toplantı için gündem eklenmedi.',
  'The brief appears after the meeting is processed.':
    'Özet, toplantı işlendikten sonra görünür.',
  'Decisions captured': 'Kaydedilen kararlar',
  Recording: 'Kayıt',
  '{{count}} files': '{{count}} dosya',
  'Workspace storage': 'Çalışma alanı depolaması',
  'This browser only': 'Yalnızca bu tarayıcı',
  'Recording {{filename}}': '{{filename}} kaydı',
  'The playback link has expired. Reload the page to request a fresh signed link.':
    'Oynatma bağlantısının süresi doldu. Yeni bir imzalı bağlantı istemek için sayfayı yenileyin.',

  // Decisions
  'Decisions could not be loaded.': 'Kararlar yüklenemedi.',
  'Total decisions': 'Toplam karar',
  'Awaiting review': 'İnceleme bekliyor',
  'High impact': 'Yüksek etki',
  'There are no decisions to export': 'Dışa aktarılacak karar yok',
  'Decision log exported': 'Karar günlüğü dışa aktarıldı',
  'A durable log of what was decided, who owns it and which conversation it came from. Open a decision to change its status.':
    'Neyin kararlaştırıldığının, kimin sahiplendiğinin ve hangi görüşmeden çıktığının kalıcı kaydı. Durumunu değiştirmek için bir kararı açın.',
  '{{count}} logged': '{{count}} kayıtlı',
  'Export CSV': 'CSV dışa aktar',
  All: 'Tümü',
  'Search decisions...': 'Karar arayın...',
  'Search decisions': 'Kararlarda ara',
  'No decisions match this view': 'Bu görünümle eşleşen karar yok',
  'Try another status or search term. Accepted decisions from meetings appear here automatically.':
    'Başka bir durum veya arama terimi deneyin. Toplantılardan kabul edilen kararlar burada otomatik olarak görünür.',
  Decision: 'Karar',
  Impact: 'Etki',
  Owner: 'Sahip',
  Source: 'Kaynak',
  Decided: 'Karar tarihi',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
  'Decision could not be updated': 'Karar güncellenemedi',
  'Try again in a moment.': 'Birazdan tekrar deneyin.',
  Logged: 'Kaydedildi',
  Updates: 'Güncellemeler',
  'Decision status history': 'Karar durumu geçmişi',
  'Status history': 'Durum geçmişi',
  'No status changes have been recorded yet.':
    'Henüz durum değişikliği kaydedilmedi.',
  'Reason for the change': 'Değişiklik nedeni',
  'Optional, but useful when someone reads this decision later.':
    'İsteğe bağlı, ancak biri bu kararı sonra okuduğunda faydalı olur.',
  Accept: 'Kabul et',
  'Close the decision and make it the working plan.':
    'Kararı kapat ve çalışma planı haline getir.',
  Reject: 'Reddet',
  'Record that this option was not chosen.':
    'Bu seçeneğin seçilmediğini kaydet.',
  Supersede: 'Geçersiz kıl',
  'Mark it as replaced by a newer decision.':
    'Daha yeni bir kararla değiştirildiğini işaretle.',
  Reopen: 'Yeniden aç',
  'Send it back for another review.': 'Tekrar incelemeye geri gönder.',
  'Decision reopened': 'Karar yeniden açıldı',
  'Decision accepted': 'Karar kabul edildi',
  'Decision rejected': 'Karar reddedildi',
  'Decision superseded': 'Karar geçersiz kılındı',

  // Knowledge
  'Knowledge documents could not be loaded.': 'Bilgi belgeleri yüklenemedi.',
  'The searchable memory of the workspace — meeting notes, transcripts and the playbooks that follow.':
    'Çalışma alanının aranabilir hafızası — toplantı notları, transkriptler ve ardından gelen oyun kitapları.',
  '{{documents}} documents · {{minutes}} min read':
    '{{documents}} belge · {{minutes}} dk okuma',
  'Search notes, transcripts, tags...': 'Not, transkript veya etiket arayın...',
  'Search knowledge': 'Bilgi tabanında ara',
  'No documents match this view': 'Bu görünümle eşleşen belge yok',
  'Try another type or search term. Meeting notes and transcripts appear here after a call is processed.':
    'Başka bir tür veya arama terimi deneyin. Toplantı notları ve transkriptler bir görüşme işlendikten sonra burada görünür.',
  'Meeting note': 'Toplantı notu',
  'Meeting notes': 'Toplantı notları',
  Transcripts: 'Transkriptler',
  Playbook: 'Oyun kitabı',
  Playbooks: 'Oyun kitapları',
  Insight: 'İçgörü',
  Insights: 'İçgörüler',
  Document: 'Belge',
  Documents: 'Belgeler',
  '{{minutes}} min read · {{time}}': '{{minutes}} dk okuma · {{time}}',
  '{{kind}} by {{author}}, updated {{date}}.':
    '{{kind}} · {{author}} tarafından, {{date}} güncellendi.',
  'Could not copy this document': 'Bu belge kopyalanamadı',
  'Document copied to clipboard': 'Belge panoya kopyalandı',
  'Updated {{date}}': '{{date}} güncellendi',
  '{{count}} min read': '{{count}} dk okuma',
  'No matches for “{{query}}” in this document':
    'Bu belgede “{{query}}” için eşleşme yok',
  '{{count}} match for “{{query}}”': '“{{query}}” için {{count}} eşleşme',
  '{{count}} matches for “{{query}}”': '“{{query}}” için {{count}} eşleşme',
  'Full document · {{count}} words': 'Tam belge · {{count}} kelime',
  'Open meeting': 'Toplantıyı aç',
  Copied: 'Kopyalandı',
  Copy: 'Kopyala',
  'This document has no content yet.': 'Bu belgenin henüz içeriği yok.',
  'Filed under': 'Şu altında dosyalanmış',
  'Related documents': 'İlgili belgeler',
  'Open related document {{title}}': 'İlgili belgeyi aç: {{title}}',
  '{{kind}} · updated {{time}}': '{{kind}} · {{time}} güncellendi',

  // Workflows
  'Workflows could not be loaded.': 'Akışlar yüklenemedi.',
  'Total workflows': 'Toplam akış',
  'Total runs': 'Toplam çalıştırma',
  '{{count}} active': '{{count}} etkin',
  'New workflow': 'Yeni akış',
  'No workflows yet': 'Henüz akış yok',
  'Create an automation that turns meeting outcomes into consistent follow-through.':
    'Toplantı çıktılarını tutarlı bir takibe dönüştüren bir otomasyon oluşturun.',
  'Automations that move a meeting signal into a summary, a decision or an owned action.':
    'Toplantı sinyalini özete, karara veya sahipli bir aksiyona taşıyan otomasyonlar.',
  'A workflow name is required': 'Akış adı gerekli',
  'Add at least one action': 'En az bir eylem ekleyin',
  '“{{name}}” is now active': '“{{name}}” artık etkin',
  '“{{name}}” paused': '“{{name}}” duraklatıldı',
  'Could not create workflow': 'Akış oluşturulamadı',
  'Could not update workflow': 'Akış güncellenemedi',
  'Create a workflow': 'Akış oluştur',
  'Connect a workspace signal to the actions that should follow it.':
    'Bir çalışma alanı sinyalini ardından gelmesi gereken eylemlere bağlayın.',
  'Workflow name': 'Akış adı',
  'e.g. Decision → project update': 'örn. Karar → proje güncellemesi',
  'What should this automation keep in sync?':
    'Bu otomasyon neyi senkron tutmalı?',
  Trigger: 'Tetikleyici',
  'One action per line. They run in the order shown.':
    'Her satıra bir eylem. Gösterilen sırayla çalışırlar.',
  'Summarize transcript\nCreate action item drafts':
    'Transkripti özetle\nAksiyon maddesi taslakları oluştur',
  'Create workflow': 'Akış oluştur',
  'Run history could not be loaded.': 'Çalıştırma geçmişi yüklenemedi.',
  'No runs recorded yet. The next trigger will appear here.':
    'Henüz çalıştırma kaydedilmedi. Bir sonraki tetikleyici burada görünecek.',
  'Last {{count}} runs': 'Son {{count}} çalıştırma',
  '{{succeeded}}/{{total}} succeeded': '{{succeeded}}/{{total}} başarılı',
  Succeeded: 'Başarılı',
  Failed: 'Başarısız',
  Skipped: 'Atlandı',
  'Last run {{time}}': 'Son çalıştırma {{time}}',
  'Not run yet': 'Henüz çalıştırılmadı',
  '{{count}} runs': '{{count}} çalıştırma',
  '{{action}} run history for {{name}}':
    '{{name}} için çalıştırma geçmişini {{action}}',
  '{{action}} {{name}}': '{{name}} {{action}}',
  Hide: 'Gizle',
  Show: 'Göster',
  Pause: 'Duraklat',
  Activate: 'Etkinleştir',
  Paused: 'Duraklatıldı',
  History: 'Geçmiş',
  'Meeting completed': 'Toplantı tamamlandı',
  'Task overdue 48h': 'Görev 48 saatten fazla gecikti',
  'On a schedule': 'Zamanlanmış',
  'Every Friday · 16:00': 'Her Cuma · 16:00',
  'Summarize transcript': 'Transkripti özetle',
  'Create action item drafts': 'Aksiyon maddesi taslakları oluştur',
  'Update project brief': 'Proje özetini güncelle',
  'Notify decision owner': 'Karar sahibini bilgilendir',
  'Notify assignee': 'Atanan kişiyi bilgilendir',
  'Post in #delivery': "#delivery kanalına gönder",
  'Compile workspace metrics': 'Çalışma alanı metriklerini derle',
  'Email leadership': 'Liderliğe e-posta gönder',
  'Create knowledge document': 'Bilgi belgesi oluştur',
  'Link related decisions': 'İlgili kararları bağla',

  // Intelligence
  'Intelligence could not be loaded.': 'Zekâ verileri yüklenemedi.',
  'Open latest brief': 'Son özeti aç',
  'Open queue': 'Açık kuyruk',
  'Avg confidence': 'Ort. güven',
  'Latest brief': 'Son özet',
  'Analysis ready': 'Analiz hazır',
  'Sample brief': 'Örnek özet',
  'Review source': 'Kaynağı incele',
  'Extraction quality': 'Çıkarım kalitesi',
  'Average confidence': 'Ortalama güven',
  'Average insight confidence': 'Ortalama içgörü güveni',
  'Insight queue': 'İçgörü kuyruğu',
  '{{shown}} of {{total}} signals': '{{total}} sinyalden {{shown}} tanesi',
  'Search title, owner, meeting or project':
    'Başlık, sahip, toplantı veya proje arayın',
  'Search insights': 'İçgörülerde ara',
  'Filter by kind': 'Türe göre filtrele',
  Clear: 'Temizle',
  'No insights yet': 'Henüz içgörü yok',
  'No insights match these filters':
    'Bu filtrelerle eşleşen içgörü yok',
  'Analyze a meeting and its summary, decisions, actions and risks will land here for review.':
    'Bir toplantıyı analiz edin; özeti, kararları, aksiyonları ve riskleri incelenmek üzere burada görünecek.',
  'Clear the search or pick another kind or status to see the rest of the queue.':
    'Kuyruğun geri kalanını görmek için aramayı temizleyin veya başka bir tür ya da durum seçin.',
  'Analyzed meetings': 'Analiz edilen toplantılar',
  '{{count}} ready': '{{count}} hazır',
  'No analyzed meetings yet': 'Henüz analiz edilen toplantı yok',
  'Once a meeting finishes processing, its brief and extracted signal will appear here.':
    'Bir toplantının işlenmesi tamamlandığında özeti ve çıkarılan sinyali burada görünecek.',
  'Processing — the brief will appear when extraction finishes.':
    'İşleniyor — çıkarım tamamlandığında özet görünecek.',
  'How intelligence works': 'Zekâ nasıl çalışır',
  Capture: 'Yakala',
  Act: 'Harekete geç',
  'This workspace is running in demo mode. The extraction layer uses prepared sample output until a provider is connected.':
    'Bu çalışma alanı demo modunda çalışıyor. Bir sağlayıcı bağlanana kadar çıkarım katmanı hazırlanmış örnek çıktıyı kullanır.',
  'Extraction is a draft until an owner confirms it. Nothing is written to the project automatically.':
    'Bir sahip onaylayana kadar çıkarım taslaktır. Projeye otomatik olarak hiçbir şey yazılmaz.',
  'Source transcripts stay in your workspace. Extraction never crosses organization boundaries.':
    'Kaynak transkriptler çalışma alanınızda kalır. Çıkarım hiçbir zaman organizasyon sınırlarını aşmaz.',
  'Review insight: {{title}}': 'İçgörüyü incele: {{title}}',
  '{{title}} confidence': '{{title}} güveni',
  'Open task': 'Görevi aç',
  'Open decision': 'Kararı aç',
  Action: 'Aksiyon',
  Risk: 'Risk',
  'Risk signal': 'Risk sinyali',
  'Action pattern': 'Aksiyon örüntüsü',
  'All kinds': 'Tüm türler',
  Dismissed: 'Yoksayıldı',
  Converted: 'Dönüştürüldü',
  Blocker: 'Engel',
  'Insight could not be updated': 'İçgörü güncellenemedi',
  '“{{title}}” is now {{status}}.':
    '“{{title}}” artık {{status}} durumunda.',
  'Insight converted to task': 'İçgörü göreve dönüştürüldü',
  'The new task is ready in the task board.':
    'Yeni görev görev panosunda hazır.',
  'The task was created.': 'Görev oluşturuldu.',
  'Task could not be created': 'Görev oluşturulamadı',
  'Insight converted to decision': 'İçgörü karara dönüştürüldü',
  'It is now a proposed decision waiting for review.':
    'Artık inceleme bekleyen bir öneri karar.',
  'Decision could not be created': 'Karar oluşturulamadı',
  'No date': 'Tarih yok',
  Confidence: 'Güven',
  'Source excerpt': 'Kaynak alıntı',
  'Insight details': 'İçgörü ayrıntıları',
  'What the signal says': 'Sinyalin söyledikleri',
  'Conversion target': 'Dönüştürme hedefi',
  'Read-only access': 'Salt okunur erişim',
  'This insight already produced follow-up work. Open the record to keep working on it.':
    'Bu içgörü zaten takip çalışması üretti. Üzerinde çalışmaya devam etmek için kaydı açın.',
  'Viewers can read the intelligence queue but cannot accept, dismiss or convert an insight. Ask an owner, admin or member to make the call.':
    'İzleyiciler içgörü kuyruğunu okuyabilir ancak bir içgörüyü kabul edemez, yoksayamaz veya dönüştüremez. Kararı bir sahip, yönetici veya üyeden isteyin.',
  'Convert to task': 'Göreve dönüştür',
  'Turn into a task': 'Göreve dönüştür',
  'Convert to decision': 'Karara dönüştür',
  'Turn into a decision': 'Karara dönüştür',
  'Propose decision': 'Karar öner',
  'Optional, but useful when someone reviews this signal later.':
    'İsteğe bağlı, ancak biri bu sinyali sonra incelediğinde faydalı olur.',
  'Confirm the signal and keep it as part of the record.':
    'Sinyali onayla ve kaydın parçası olarak tut.',
  'Hide the signal without creating follow-up work.':
    'Takip çalışması oluşturmadan sinyali gizle.',
  'Put the signal back in the review queue.':
    'Sinyali inceleme kuyruğuna geri koy.',
  Dismiss: 'Yoksay',

  // Analytics
  'Analytics did not load.': 'Analitik verileri yüklenemedi.',
  'Execution analytics exported': 'Yürütme analitiği dışa aktarıldı',
  'Last {{count}} days': 'Son {{count}} gün',
  '7 days': '7 gün',
  '14 days': '14 gün',
  '30 days': '30 gün',
  'Execution velocity': 'Yürütme hızı',
  'Tasks completed against tasks created each day.':
    'Her gün tamamlanan görevler, oluşturulan görevlere karşı.',
  'Net {{value}}': 'Net {{value}}',
  Created: 'Oluşturulan',
  'Completed {{count}}': 'Tamamlanan {{count}}',
  'Created {{count}}': 'Oluşturulan {{count}}',
  'Decision mix': 'Karar dağılımı',
  '{{accepted}} of {{total}} decisions accepted.':
    '{{total}} karardan {{accepted}} tanesi kabul edildi.',
  'Decisions will appear once the log has entries.':
    'Karar günlüğünde kayıt olduğunda kararlar burada görünecek.',
  'Team workload': 'Ekip iş yükü',
  'Open assignments created in the selected window, against an 8-task planning capacity.':
    'Seçilen aralıkta oluşturulan açık atamalar, 8 görevlik planlama kapasitesine karşı.',
  '{{count}}% avg': 'ort. %{{count}}',
  '{{name}} workload': '{{name}} iş yükü',
  'Project health': 'Proje sağlığı',
  'Delivery progress for work due inside the selected window.':
    'Seçilen aralıkta teslim edilmesi gereken işlerin ilerlemesi.',
  'No project work is due in this window.':
    'Bu aralıkta teslim edilmesi gereken proje işi yok.',
  '{{name}} progress': '{{name}} ilerlemesi',
  '{{completed}} of {{total}} due tasks complete':
    '{{total}} vadesi gelen görevden {{completed}} tanesi tamamlandı',
  'Metrics are derived from workspace records for {{range}}.':
    'Metrikler {{range}} aralığı için çalışma alanı kayıtlarından türetilir.',
  '{{tasks}} tasks · {{projects}} projects · {{members}} members':
    '{{tasks}} görev · {{projects}} proje · {{members}} üye',
  'No change': 'Değişiklik yok',
  'New this window': 'Bu aralıkta yeni',
  'vs previous 7 days': 'önceki 7 güne göre',
  'vs previous 14 days': 'önceki 14 güne göre',
  'vs previous 30 days': 'önceki 30 güne göre',
  'Meetings analyzed': 'Analiz edilen toplantılar',
  'Action items closed': 'Kapatılan aksiyon maddeleri',
  'Decisions accepted': 'Kabul edilen kararlar',
  'On-time delivery': 'Zamanında teslim',
  '{{delta}} pts': '{{delta}} puan',

  // Team
  'The team could not be loaded.': 'Ekip yüklenemedi.',
  'There are no members to export': 'Dışa aktarılacak üye yok',
  'Team directory exported': 'Ekip dizini dışa aktarıldı',
  Members: 'Üyeler',
  'Avg workload': 'Ort. iş yükü',
  Invited: 'Davet edilen',
  Everyone: 'Herkes',
  Owners: 'Sahipler',
  Admins: 'Yöneticiler',
  Viewers: 'İzleyiciler',
  'Who is in the workspace, what they own and how much is on their plate.':
    'Çalışma alanında kim var, neye sahipler ve ne kadar iş yükleri var.',
  'Invite member': 'Üye davet et',
  'Search members...': 'Üye ara...',
  'Search team members': 'Ekip üyelerinde ara',
  'No members match this search': 'Bu aramayla eşleşen üye yok',
  'No members in this role': 'Bu rolde üye yok',
  'Try another name, email address or job title.':
    'Başka bir ad, e-posta adresi veya iş unvanı deneyin.',
  'Invite a teammate or switch to another role filter.':
    'Bir ekip arkadaşı davet edin veya başka bir rol filtresine geçin.',
  Workload: 'İş yükü',
  'No project yet': 'Henüz proje yok',
  'Invitation pending': 'Davet bekliyor',
  '{{count}} active projects': '{{count}} etkin proje',
  'Email {{name}}': '{{name}} kişisine e-posta gönder',
  'Review invite': 'Daveti incele',
  'View profile': 'Profili görüntüle',
  'Team member': 'Ekip üyesi',
  'Email pending': 'E-posta bekleniyor',
  Admin: 'Yönetici',
  Member: 'Üye',
  Viewer: 'İzleyici',
  Away: 'Uzakta',
  'Invite a teammate': 'Ekip arkadaşı davet et',
  'Give someone access to the workspace and the work that follows each meeting.':
    'Birine çalışma alanına ve her toplantının ardından gelen işlere erişim verin.',
  'teammate@company.com': 'ekiparkadasi@sirket.com',
  'Workspace role': 'Çalışma alanı rolü',
  'Admins can manage members. Members can create and edit work.':
    'Yöneticiler üyeleri yönetebilir. Üyeler iş oluşturabilir ve düzenleyebilir.',
  'Send invitation': 'Davet gönder',
  'Enter a valid email address': 'Geçerli bir e-posta adresi girin',
  'Invitation ready for {{email}}': '{{email}} için davet hazır',
  'Could not invite member': 'Üye davet edilemedi',
  '{{name}} is now {{role}}': '{{name}} artık {{role}}',
  'Could not update the role': 'Rol güncellenemedi',
  'Project access updated for {{name}}': '{{name}} için proje erişimi güncellendi',
  'Could not update project access': 'Proje erişimi güncellenemedi',
  'Invitation for {{email}} revoked': '{{email}} için davet iptal edildi',
  '{{name}} removed from the workspace':
    '{{name}} çalışma alanından çıkarıldı',
  'Could not update the team': 'Ekip güncellenemedi',
  'Across {{count}} projects': '{{count}} proje genelinde',
  'Member since': 'Üyelik başlangıcı',
  'Admins manage the team; members create and edit work; viewers read only.':
    'Yöneticiler ekibi yönetir; üyeler iş oluşturur ve düzenler; izleyiciler yalnızca okur.',
  'The workspace owner role is fixed and cannot be changed.':
    'Çalışma alanı sahibi rolü sabittir ve değiştirilemez.',
  'Only workspace owners and admins can change this role.':
    'Bu rolü yalnızca çalışma alanı sahipleri ve yöneticiler değiştirebilir.',
  'Assign role': 'Rol ata',
  'Save role': 'Rolü kaydet',
  'Role changes are recorded in the workspace activity log and notify the member.':
    'Rol değişiklikleri çalışma alanı etkinlik günlüğüne kaydedilir ve üyeyi bilgilendirir.',
  'Project access': 'Proje erişimi',
  'Project access can be assigned after the invitation is accepted.':
    'Proje erişimi davet kabul edildikten sonra atanabilir.',
  'Choose which projects this member can see and work in.':
    'Bu üyenin hangi projeleri görebileceğini ve üzerinde çalışabileceğini seçin.',
  'No project access': 'Proje erişimi yok',
  '{{count}} projects selected': '{{count}} proje seçildi',
  'No unsaved project changes': 'Kaydedilmemiş proje değişikliği yok',
  'Save access': 'Erişimi kaydet',
  'Open assignments': 'Açık atamalar',
  'No open tasks assigned to this member.':
    'Bu üyeye atanmış açık görev yok.',
  '+{{count}} more open tasks in the task board.':
    'Görev panosunda {{count}} açık görev daha var.',
  'Revoke invitation': 'Daveti iptal et',
  'Remove member': 'Üyeyi çıkar',
  'The pending invitation will stop working immediately.':
    'Bekleyen davet hemen geçersiz olacak.',
  'Project access is revoked. Existing tasks keep their history.':
    'Proje erişimi kaldırılır. Mevcut görevler geçmişlerini korur.',
  Revoke: 'İptal et',
  Remove: 'Çıkar',
  'Changes apply to the whole workspace.':
    'Değişiklikler tüm çalışma alanında geçerli olur.',
  'Only workspace owners and admins can change roles.':
    'Rolleri yalnızca çalışma alanı sahipleri ve yöneticiler değiştirebilir.',
  'You cannot change your own role.': 'Kendi rolünüzü değiştiremezsiniz.',
  'The owner role is fixed and cannot be changed.':
    'Sahip rolü sabittir ve değiştirilemez.',
  'The owner role cannot be assigned.': 'Sahip rolü atanamaz.',
  'You do not have permission to assign that role.':
    'Bu rolü atama izniniz yok.',
  'Only the owner can change an admin role.':
    'Yönetici rolünü yalnızca sahip değiştirebilir.',
  'This member already has that role.': 'Bu üye zaten o role sahip.',
  'Only workspace owners and admins can remove members.':
    'Üyeleri yalnızca çalışma alanı sahipleri ve yöneticiler çıkarabilir.',
  'You cannot remove yourself from the workspace.':
    'Kendinizi çalışma alanından çıkaramazsınız.',
  'The workspace owner cannot be removed.':
    'Çalışma alanı sahibi çıkarılamaz.',
  'Only the owner can remove an admin.':
    'Yöneticiyi yalnızca sahip çıkarabilir.',
  'Only workspace owners and admins can manage project access.':
    'Proje erişimini yalnızca çalışma alanı sahipleri ve yöneticiler yönetebilir.',

  // Live
  'Give the room a title': 'Odaya bir başlık verin',
  'Paste a valid room link or room code':
    'Geçerli bir oda bağlantısı veya oda kodu yapıştırın',
  'Sample room link copied': 'Örnek oda bağlantısı kopyalandı',
  'Open it in another tab to test the mesh as a second participant.':
    'Mesh\'i ikinci katılımcı olarak test etmek için başka bir sekmede açın.',
  'Sample room link': 'Örnek oda bağlantısı',
  'Nova Live': 'Nova Live',
  'Run the meeting inside Nova: video, screen share, live captions and a copilot that turns the conversation into owned follow-ups.':
    'Toplantıyı Nova içinde yürütün: video, ekran paylaşımı, canlı altyazılar ve konuşmayı sahipli takiplere dönüştüren bir copilot.',
  'Real-time': 'Gerçek zamanlı',
  'Consent-first': 'Önce onay',
  'Meet · decide · remember': 'Buluş · karar ver · hatırla',
  'Start a room that leaves a brief, not a pile of notes.':
    'Bir yığın not değil, bir özet bırakan bir oda başlatın.',
  'Nova listens for decisions and action items while you talk, then writes the report, the tasks and the Knowledge note when you end the call.':
    'Nova siz konuşurken kararları ve aksiyon maddelerini dinler; görüşmeyi bitirdiğinizde raporu, görevleri ve Bilgi notunu yazar.',
  'Private workspace room': 'Özel çalışma alanı odası',
  'Mesh across tabs': 'Sekmeler arası mesh',
  'LiveKit SFU': 'LiveKit SFU',
  'No install required': 'Kurulum gerekmez',
  'KVKK/GDPR notice': 'KVKK/GDPR bildirimi',
  'New room': 'Yeni oda',
  'e.g. Launch readiness review': 'örn. Lansman hazırlık incelemesi',
  'Video room': 'Video odası',
  'Audio room': 'Ses odası',
  'Camera + mic': 'Kamera + mikrofon',
  'Mic only': 'Yalnızca mikrofon',
  'Link to a project': 'Bir projeye bağla',
  'Follow-ups inherit the project when you create them.':
    'Takipler oluşturulduğunda projeyi devralır.',
  'Start Nova Live room': 'Nova Live odası başlat',
  'Join a room': 'Bir odaya katıl',
  'Join': 'Katıl',
  'Video': 'Video',
  'Audio': 'Ses',
  'Paste a room code or the full invite link.':
    'Bir oda kodu veya tam davet bağlantısı yapıştırın.',
  'nova-abc123 or https://…/live/nova-abc123':
    'nova-abc123 veya https://…/live/nova-abc123',
  'Room code or invite link': 'Oda kodu veya davet bağlantısı',
  'Copy a sample room link for a second tab':
    'İkinci sekme için örnek oda bağlantısı kopyala',
  'What happens when you end': 'Bitirdiğinizde ne olur',
  'Meeting saved as a completed Nova Live record with the full transcript.':
    'Toplantı, tam transkriptle tamamlanmış bir Nova Live kaydı olarak kaydedilir.',
  'Decisions and tasks created only after you review the owners.':
    'Kararlar ve görevler yalnızca sahipleri incelediğinizde oluşturulur.',
  'A Knowledge note links the summary and transcript back to company memory.':
    'Bir Bilgi notu, özeti ve transkripti şirket hafızasına bağlar.',
  'Video & audio rooms': 'Video ve sesli odalar',
  'Peer-to-peer mesh in demo mode, LiveKit SFU in production. One adapter, no changes to the rest of the workspace.':
    'Demo modunda eşler arası mesh, üretimde LiveKit SFU. Tek bağdaştırıcı, çalışma alanının geri kalanında değişiklik yok.',
  'Screen sharing': 'Ekran paylaşımı',
  'Present a screen or window without losing the transcript, chat or AI copilot.':
    'Transkripti, sohbeti veya AI copilot\'u kaybetmeden bir ekran ya da pencere sunun.',
  'Live captions': 'Canlı altyazılar',
  'Speaker, text and timestamp are captured as you talk, with a scripted demo dialogue for mic-free testing.':
    'Konuşurken konuşmacı, metin ve zaman damgası yakalanır; mikrofonsuz test için senaryolu bir demo diyaloğu bulunur.',
  'Meeting copilot': 'Toplantı copilot\'u',
  'Ask about decisions, action items, owners, deadlines, risks and speaking time while the room is live.':
    'Oda canlıyken kararlar, aksiyon maddeleri, sahipler, son tarihler, riskler ve konuşma süresi hakkında soru sorun.',
  'Recent Nova Live meetings': 'Son Nova Live toplantıları',
  'Reports and transcripts from this workspace':
    'Bu çalışma alanındaki raporlar ve transkriptler',
  'All meetings': 'Tüm toplantılar',
  'Loading live meetings': 'Canlı toplantılar yükleniyor',
  'No live meetings yet': 'Henüz canlı toplantı yok',
  'Start a room, run the demo dialogue and end it to see the report, tasks, decisions and Knowledge note land here.':
    'Bir oda başlatın, demo diyaloğunu çalıştırın ve bitirin; rapor, görevler, kararlar ve Bilgi notunun buraya geldiğini görün.',
  '{{actions}} actions · {{decisions}} decisions':
    '{{actions}} aksiyon · {{decisions}} karar',
  'Nova Live meeting': 'Nova Live toplantısı',
  'This browser cannot access camera or microphone. You can still join in listen-only mode.':
    'Bu tarayıcı kameraya veya mikrofona erişemiyor. Yine de yalnızca dinleme modunda katılabilirsiniz.',
  'Camera or microphone permission was denied. You can still join in listen-only mode.':
    'Kamera veya mikrofon izni reddedildi. Yine de yalnızca dinleme modunda katılabilirsiniz.',
  'No camera or microphone was found on this device. You can still join in listen-only mode.':
    'Bu cihazda kamera veya mikrofon bulunamadı. Yine de yalnızca dinleme modunda katılabilirsiniz.',
  'The camera or microphone could not be started.':
    'Kamera veya mikrofon başlatılamadı.',
  'Meeting report saved to the workspace':
    'Toplantı raporu çalışma alanına kaydedildi',
  'The report could not be saved.': 'Rapor kaydedilemedi.',
  'Add the name you want the room to show':
    'Odada görünmesini istediğiniz adı ekleyin',
  'Confirm the transcription and recording notice before joining':
    'Katılmadan önce transkripsiyon ve kayıt bildirimini onaylayın',
  'The meeting could not be finalised.': 'Toplantı tamamlanamadı.',
  'Recording archived on the meeting': 'Kayıt toplantıya arşivlendi',
  'The recording could not be archived.': 'Kayıt arşivlenemedi.',
  'Invite link copied': 'Davet bağlantısı kopyalandı',
  'Room link': 'Oda bağlantısı',
  'Created {{tasks}} and {{decisions}}':
    '{{tasks}} ve {{decisions}} oluşturuldu',
  'Follow-ups could not be created.': 'Takipler oluşturulamadı.',
  'Demo room': 'Demo odası',
  You: 'Siz',
  'Camera is off': 'Kamera kapalı',
  'Join in listen-only mode': 'Yalnızca dinleme modunda katıl',
  'Your preview appears here before you join.':
    'Katılmadan önce önizlemeniz burada görünür.',
  'Mute microphone': 'Mikrofonu sessize al',
  'Unmute microphone': 'Mikrofonun sesini aç',
  'Turn camera off': 'Kamerayı kapat',
  'Turn camera on': 'Kamerayı aç',
  'Live intelligence': 'Canlı zekâ',
  'Captions become decisions, owners and deadlines while you talk.':
    'Siz konuşurken altyazılar kararlara, sahiplere ve son tarihlere dönüşür.',
  'Present the work without leaving the room or losing the transcript.':
    'Odadan ayrılmadan veya transkripti kaybetmeden işi sunun.',
  'Consent first': 'Önce onay',
  'Transcription and recording are announced before anyone joins.':
    'Transkripsiyon ve kayıt, kimse katılmadan önce duyurulur.',
  'Ready to join': 'Katılmaya hazır',
  'Room title': 'Oda başlığı',
  'Each tab can join with a different name, which makes testing the room easy.':
    'Her sekme farklı bir adla katılabilir; bu da odayı test etmeyi kolaylaştırır.',
  'Transcription & recording notice': 'Transkripsiyon ve kayıt bildirimi',
  'Nova can transcribe speech with the browser speech service and generate an AI brief. Pressing Record stores a local file in this browser only. Tell every participant before joining — this is required for KVKK/GDPR consent.':
    'Nova, konuşmayı tarayıcı konuşma hizmetiyle yazıya dökebilir ve bir AI özeti oluşturabilir. Kayıt düğmesine basmak yalnızca bu tarayıcıda yerel bir dosya saklar. Katılmadan önce her katılımcıya bildirin — bu, KVKK/GDPR onayı için gereklidir.',
  'I have informed everyone in the room and they agree to transcription and optional recording.':
    'Odadaki herkesi bilgilendirdim ve transkripsiyon ile isteğe bağlı kayda onay verdiler.',
  'Join Nova Live': 'Nova Live\'a katıl',
  'WebRTC mesh · this browser': 'WebRTC mesh · bu tarayıcı',
  'LiveKit media server': 'LiveKit medya sunucusu',
  'Copy invite link': 'Davet bağlantısını kopyala',
  'The room has ended': 'Oda sona erdi',
  'Meeting captured': 'Toplantı kaydedildi',
  'Another participant ended the room. Save your copy of the transcript and report, or leave without saving.':
    'Başka bir katılımcı odayı bitirdi. Transkriptin ve raporun kopyasını kaydedin veya kaydetmeden ayrılın.',
  'Nova saved the meeting, the transcript and a Knowledge note. Review the owners and deadlines before creating follow-ups.':
    'Nova toplantıyı, transkripti ve bir Bilgi notunu kaydetti. Takipleri oluşturmadan önce sahipleri ve son tarihleri inceleyin.',
  Duration: 'Süre',
  Segments: 'Bölümler',
  'Only you were in the room': 'Odada yalnızca siz vardınız',
  '{{count}} chat message saved': '{{count}} sohbet mesajı kaydedildi',
  '{{count}} chat messages saved': '{{count}} sohbet mesajı kaydedildi',
  'Writing the brief and Knowledge note…': 'Özet ve Bilgi notu yazılıyor…',
  'Saved to Meetings and Knowledge': 'Toplantılar ve Bilgi bölümüne kaydedildi',
  'Open meeting report': 'Toplantı raporunu aç',
  'Back to lobby': 'Lobiye dön',
  'Try saving again': 'Kaydetmeyi yeniden dene',
  'Save my report': 'Raporumu kaydet',
  'Recording ready': 'Kayıt hazır',
  'Archived on the meeting. Everyone with workspace access can play it there.':
    'Toplantıya arşivlendi. Çalışma alanına erişimi olan herkes orada oynatabilir.',
  'The file is still only in this browser. Archiving uploads it to private workspace storage.':
    'Dosya hâlâ yalnızca bu tarayıcıda. Arşivlemek onu özel çalışma alanı depolamasına yükler.',
  'Save the meeting first, then archive the recording on it.':
    'Önce toplantıyı kaydedin, ardından kaydı ona arşivleyin.',
  'Archiving…': 'Arşivleniyor…',
  Archived: 'Arşivlendi',
  'Save to meeting': 'Toplantıya kaydet',
  'REC {{time}}': 'KAYIT {{time}}',
  Mesh: 'Mesh',
  Connecting: 'Bağlanıyor',
  'Connecting to the room…': 'Odaya bağlanılıyor…',
  'Demo rooms use a peer-to-peer mesh. Open the invite link in a second tab to see another participant.':
    'Demo odaları eşler arası mesh kullanır. Başka bir katılımcı görmek için davet bağlantısını ikinci bir sekmede açın.',
  'Waiting for the media server to publish your tracks.':
    'Medya sunucusunun kanallarınızı yayınlaması bekleniyor.',
  demo: 'demo',
  'Local recording saved': 'Yerel kayıt kaydedildi',
  'Download .webm': '.webm indir',
  'Dismiss recording': 'Kaydı kapat',
  'Stays in this browser': 'Bu tarayıcıda kalır',
  'Meeting panel': 'Toplantı paneli',
  'Close panel': 'Paneli kapat',
  'End the meeting?': 'Toplantı bitirilsin mi?',
  'Nova will stop the media, save the transcript and generate the meeting report. Follow-ups are created after you review the report.':
    'Nova medyayı durdurur, transkripti kaydeder ve toplantı raporunu oluşturur. Takipler raporu inceledikten sonra oluşturulur.',
  '{{segments}} transcript segments · {{messages}} chat messages · {{duration}}':
    '{{segments}} transkript bölümü · {{messages}} sohbet mesajı · {{duration}}',
  'No speech has been captured yet. The meeting will still be saved with an empty transcript.':
    'Henüz konuşma yakalanmadı. Toplantı boş bir transkriptle yine de kaydedilecek.',
  'Keep talking': 'Konuşmaya devam et',
  'End & save report': 'Bitir ve raporu kaydet',
  Mute: 'Sessize al',
  Unmute: 'Sesi aç',
  'Camera off': 'Kamera kapalı',
  'Camera on': 'Kamera açık',
  'Stop share': 'Paylaşımı durdur',
  Share: 'Paylaş',
  Captions: 'Altyazılar',
  Record: 'Kaydet',
  Chat: 'Sohbet',
  Copilot: 'Copilot',
  People: 'Kişiler',
  'End meeting': 'Toplantıyı bitir',
  End: 'Bitir',
  AI: 'AI',
  'Demo dialogue': 'Demo diyaloğu',
  Listening: 'Dinliyor',
  'Captions on': 'Altyazılar açık',
  'Captions off': 'Altyazılar kapalı',
  '{{count}} segments': '{{count}} bölüm',
  'No speech captured yet': 'Henüz konuşma yakalanmadı',
  'Turn on live captions to transcribe your microphone, or play the scripted demo dialogue to see the AI pipeline without a mic.':
    'Mikrofonunuzu yazıya dökmek için canlı altyazıları açın veya mikrofonsuz AI akışını görmek için senaryolu demo diyaloğunu oynatın.',
  'Start captions': 'Altyazıları başlat',
  'Live captions need Chrome or Edge. The demo dialogue works everywhere.':
    'Canlı altyazılar Chrome veya Edge gerektirir. Demo diyaloğu her yerde çalışır.',
  'Room chat': 'Oda sohbeti',
  'Messages stay with the room and are saved with the meeting report.':
    'Mesajlar odayla birlikte kalır ve toplantı raporuyla kaydedilir.',
  'Message everyone…': 'Herkese mesaj gönder…',
  'Room chat message': 'Oda sohbet mesajı',
  'Send message': 'Mesaj gönder',
  'Nova copilot': 'Nova copilot',
  'Grounded in this transcript only. Ask about decisions, owners, deadlines or what is still open.':
    'Yalnızca bu transkripte dayanır. Kararlar, sahipler, son tarihler veya hâlâ açık olanlar hakkında soru sorun.',
  'Summarize the meeting so far': 'Toplantıyı şimdiye kadar özetle',
  'What decisions were made?': 'Hangi kararlar alındı?',
  'What are my action items?': 'Aksiyon maddelerim neler?',
  'What is still unresolved?': 'Hâlâ çözülmemiş olan ne?',
  'Signals so far': 'Şimdiye kadarki sinyaller',
  '{{count}} actions': '{{count}} aksiyon',
  '{{count}} risks': '{{count}} risk',
  '{{count}} topics': '{{count}} konu',
  'Ask about this meeting…': 'Bu toplantı hakkında soru sor…',
  'Ask the meeting copilot': 'Toplantı copilot\'una sor',
  'Ask copilot': 'Copilot\'a sor',
  you: 'siz',
  'Unmute {{name}} for me': '{{name}} kişisinin sesini benim için aç',
  'Mute {{name}} for me': '{{name}} kişisini benim için sessize al',
  'Unmute participant for me': 'Katılımcının sesini benim için aç',
  'Mute participant for me': 'Katılımcıyı benim için sessize al',
  'Demo rooms connect tabs in this browser. Add LiveKit credentials for real devices.':
    'Demo odaları bu tarayıcıdaki sekmeleri bağlar. Gerçek cihazlar için LiveKit kimlik bilgilerini ekleyin.',
  'Camera starting…': 'Kamera başlıyor…',
  Sharing: 'Paylaşıyor',
  'Nova Live report': 'Nova Live raporu',
  'Meeting report': 'Toplantı raporu',
  'Transcript, decisions and follow-ups captured by Nova. Review the owners and deadlines before creating work.':
    'Nova tarafından yakalanan transkript, kararlar ve takipler. İş oluşturmadan önce sahipleri ve son tarihleri inceleyin.',
  'Nova is writing the brief…': 'Nova özeti yazıyor…',
  'Saving the meeting, transcript, chat and a Knowledge note. This takes a moment in demo mode too.':
    'Toplantı, transkript, sohbet ve bir Bilgi notu kaydediliyor. Bu, demo modunda da biraz zaman alır.',
  'The report could not be saved': 'Rapor kaydedilemedi',
  '{{count}} transcript segments': '{{count}} transkript bölümü',
  '{{count}} chat messages': '{{count}} sohbet mesajı',
  'No summary was generated.': 'Özet oluşturulmadı.',
  'No key points were captured.': 'Ana nokta yakalanmadı.',
  'No decisions were recorded.': 'Karar kaydedilmedi.',
  'Owner: {{owner}}': 'Sahip: {{owner}}',
  'Action items, owners and deadlines': 'Aksiyon maddeleri, sahipler ve son tarihler',
  'No action items were detected.': 'Aksiyon maddesi tespit edilmedi.',
  'No risks were flagged.': 'Risk işaretlenmedi.',
  'Unresolved topics': 'Çözülmemiş konular',
  'Nothing is left open in this transcript.': 'Bu transkriptte açık kalan bir şey yok.',
  'Follow-ups': 'Takipler',
  '{{tasks}} and {{decisions}} are ready to become workspace records. Nova also writes a Knowledge note with the transcript.':
    '{{tasks}} ve {{decisions}} çalışma alanı kaydı olmaya hazır. Nova ayrıca transkriptle birlikte bir Bilgi notu yazar.',
  'No follow-ups were detected. You can still keep the meeting and its transcript in the workspace.':
    'Takip tespit edilmedi. Toplantıyı ve transkriptini yine de çalışma alanında tutabilirsiniz.',
  'Follow-ups created': 'Takipler oluşturuldu',
  '{{tasks}}, {{decisions}}{{knowledge}} are linked to this meeting.':
    '{{tasks}}, {{decisions}}{{knowledge}} bu toplantıya bağlandı.',
  ' and a Knowledge note': ' ve bir Bilgi notu',
  'Full transcript': 'Tam transkript',
  Close: 'Kapat',
  'Create tasks, decisions & knowledge': 'Görev, karar ve bilgi oluştur',
  'Open meeting workspace': 'Toplantı çalışma alanını aç',
  '{{count}} workspace records created.':
    '{{count}} çalışma alanı kaydı oluşturuldu.',
  '{{text}} — no owner yet': '{{text}} — henüz sahip yok',

  // Language switcher
  Language: 'Dil',
  'Interface language': 'Arayüz dili',
  'Choose the language used across the workspace.':
    'Çalışma alanında kullanılacak dili seçin.',
  English: 'İngilizce',
  Türkçe: 'Türkçe',
  'Language updated': 'Dil güncellendi',
};
