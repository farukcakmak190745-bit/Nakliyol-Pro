import { Truck, FileText, Star, Building2, User, Phone, IdCard, CarFront, FileCheck, ShieldCheck, CreditCard, Calendar, MessageSquare, Bell, Mail, Clock, Shield, ChevronRight, Check, X, Settings, HelpCircle, Lock, Loader, Package, Activity, BellRing, MapPin, TrendingUp, Eye, EyeOff, Send, Download, Upload, LogOut, UserCircle, CheckCircle, Circle, Grid, List, Filter, Search, Home, Briefcase, CalendarDays, FileJson, Building, Map } from "lucide-react";

/**
 * Profesyonel Icon Sistemi
 * Tüm emoji'leri Lucide icon'lara çevirir
 */

export const IconMap = {
  // 🚚 Kamyon/Transport
  truck: Truck,
  trucks: Truck,
  tr: Truck,
  kamyon: Truck,

  // 📋 İlanlar
  file: FileText,
  ilan: FileText,
  form: FileText,
  documents: FileText,

  // ⭐ Puan
  star: Star,
  rating: Star,
  pu: Star,

  // 🏢 Şirket/Firma
  building: Building2,
  company: Building2,
  firma: Building2,
  office: Building2,
  company2: Building2,

  // 👤 Profil/Kişiler
  user: User,
  users: User,
  profil: User,
  profile: User,
  person: User,
  people: User,
  avatar: User,

  // 📞 Telefon
  phone: Phone,
  tel: Phone,
  contact: Phone,

  // 🆔 Kimlik
  idcard: IdCard,
  kimlik: IdCard,
  identity: IdCard,

  // 🚐 Araçlar
  car: CarFront,
  vehicle: CarFront,
  arac: CarFront,
  dorse: CarFront,
  dorseArac: CarFront,
  kamyonet: CarFront,
  50nc: CarFront,

  // 📄 Belgeler
  filecheck: FileCheck,
  belge: FileCheck,
  belgeler: FileCheck,
  documents: FileCheck,
  attachment: FileCheck,

  // 🔒 Güvenlik
  shield: Shield,
  security: Shield,
  guard: Shield,
  kilit: Shield,
  lock: Lock,

  // 💰 Para
  creditcard: CreditCard,
  credit: CreditCard,
  money: CreditCard,
  cash: CreditCard,
  para: CreditCard,
  ucret: CreditCard,
  tutar: CreditCard,
  odeme: CreditCard,
  odemeDurumu: CreditCard,

  // 📅 Tarih
  calendar: Calendar,
  date: Calendar,
  tarih: Calendar,
  tarihFormat: Calendar,

  // 💬 Mesajlar
  message: MessageSquare,
  messages: MessageSquare,
  chat: MessageSquare,
  mesaj: MessageSquare,
  conversation: MessageSquare,
  conversations: MessageSquare,

  // 🔔 Bildirimler
  bell: Bell,
  notifications: Bell,
  bildirim: Bell,
  bildirimler: Bell,
  notify: Bell,

  // 📧 E-posta
  mail: Mail,
  email: Mail,
  eposta: Mail,

  // ⏱️ Zaman
  clock: Clock,
  time: Clock,
  sure: Clock,
  sureFormat: Clock,

  // ➕ Ekleme
  plus: ChevronRight,
  add: ChevronRight,
  tambah: ChevronRight,

  // ✅ Onay
  check: Check,
  ok: Check,
  tik: Check,
  onay: Check,
  onaylandı: CheckCircle,
  successful: CheckCircle,

  // ❌ Kapatma
  close: X,
  x: X,
  kapat: X,
  sil: X,
  delete: X,
  cancel: X,

  // ☕ Karartma
  coffee: Loader,
  loading: Loader,
  yukleniyor: Loader,
  loading2: Loader,

  // ⚙️ Ayarlar/İşlem
  settings: Settings,
  ayarlar: Settings,
  configure: Settings,
  opsiyon: Settings,

  // ❓ Yardım
  help: HelpCircle,
  destek: HelpCircle,
  soru: HelpCircle,

  // 📊 İstatistik
  activity: Activity,
  stats: Activity,
  istatistik: Activity,
  chart: Activity,

  // 🔔 Bildirim Ring
  bellring: BellRing,

  // 📍 Konum
  mappin: MapPin,
  konum: MapPin,
  location: MapPin,
  location2: MapPin,
  adres: MapPin,

  // 📈 Trend
  trending: TrendingUp,
  artis: TrendingUp,
  yukari: TrendingUp,

  // 👁️ Görünüm
  eye: Eye,
  gorunum: Eye,
  goster: Eye,

  // 🙈 Gizleme
  eyeoff: EyeOff,
  gizle: EyeOff,
  hide: EyeOff,

  // 📤 Gönderme
  send: Send,
  gonder: Send,
  gonderim: Send,

  // 📥 İndirme
  download: Download,
  indirme: Download,
  indir: Download,

  // ⬆️ Yükleme
  upload: Upload,
  yukleme: Upload,
  yukle: Upload,

  // 🚪 Çıkış
  logout: LogOut,
  cikis: LogOut,
  exit: LogOut,
  disconnect: LogOut,

  // 👤 Kullanıcı Çevresi
  usercircle: UserCircle,

  // ⭕ Seçim
  circle: Circle,
  secim: Circle,
  sec: Circle,

  // 📐 Layout
  grid: Grid,
  liste: List,

  // 🔍 Arama
  search: Search,
  ara: Search,

  // 🏠 Ana Sayfa
  home: Home,

  // 📄 Dosya
  filejson: FileJson,

  // 📅 Takvim
  calendardays: CalendarDays,

  // 🏢 Bina
  building2: Building,

  // 🗺️ Harita
  map2: Map,
};

/**
 * Emoji → Lucide Icon dönüşümü
 */
export const getIcon = (emoji) => {
  // Emoji'ye göre icon mapping
  const iconClass = IconMap[emoji] || IconMap.truck;

  return iconClass;
};

/**
 * Emoji → Component dönüşümü
 */
export const getIconComponent = (emoji) => {
  const Icon = getIcon(emoji);
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
};

// Icon boyutlandırma için context veya global değişkenler
let size = 20;
let strokeWidth = 2;
let className = "";

export const IconSize = {
  set: (s) => { size = s; },
  get: () => size,
};

export const IconStroke = {
  set: (s) => { strokeWidth = s; },
  get: () => strokeWidth,
};

export const IconClass = {
  set: (c) => { className = c; },
  get: () => className,
};
