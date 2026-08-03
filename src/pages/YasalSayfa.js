import { useNavigate } from "react-router-dom";

const ICERIK = {
  kosullar: {
    baslik: "Kullanım Koşulları",
    bolumler: [
      {
        baslik: "1. Genel",
        metin: "NakliYol platformunu kullanarak bu Kullanım Koşulları'nı okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz. Platform, yük sahipleri ile kamyoncuları buluşturan bir aracı hizmettir."
      },
      {
        baslik: "2. Üyelik",
        metin: "Üyelik oluştururken verdiğiniz bilgilerin doğru ve güncel olduğunu beyan edersiniz. Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Bir hesap yalnızca bir kullanıcı tarafından kullanılabilir."
      },
      {
        baslik: "3. İlanlar ve Teklifler",
        metin: "Verdiğiniz ilanların ve tekliflerin içeriğinden yasaya uygunluğundan siz sorumlusunuz. Yanıltıcı ilan vermek, gerçekleştirilemeyecek taahhütlerde bulunmak yasaktır ve hesabın askıya alınmasına neden olabilir."
      },
      {
        baslik: "4. Ücret ve Ödeme",
        metin: "Sefer ücretleri taraflar arasında kararlaştırılır. Platform, tamamlanan seferler üzerinden ilan edilen hizmet bedelini ve/veya komisyonu tahsil edebilir. Ödeme koşulları ilan üzerinde belirtilen şekilde işler."
      },
      {
        baslik: "5. Sorumluluk",
        metin: "Platform, kullanıcılar arasındaki taşıma sözleşmelerine taraf değildir. Taraflar arasındaki uyuşmazlıklarda platform yalnızca belirtilen kurallar çerçevesinde arabulucu olarak yer alabilir."
      },
      {
        baslik: "6. Hesap Kapatma",
        metin: "Kurallara aykırı davranışlarda bulunan kullanıcıların hesapları, bildirimde bulunulmaksızın askıya alınabilir veya kapatılabilir."
      }
    ]
  },
  gizlilik: {
    baslik: "Gizlilik Politikası",
    bolumler: [
      {
        baslik: "1. Toplanan Bilgiler",
        metin: "Üyelik sırasında ad, soyad, telefon, TC kimlik numarası, araç ve firma bilgileriniz toplanır. Platform üzerindeki işlemleriniz (ilan, teklif, sefer, mesaj) kayıt altına alınır."
      },
      {
        baslik: "2. Bilgilerin Kullanımı",
        metin: "Bilgileriniz yalnızca hizmetin yürütülmesi, güvenliğin sağlanması, sefer sözleşmelerinin kurulması ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılır. Bilgileriniz pazarlama amacıyla üçüncü kişilere satılmaz."
      },
      {
        baslik: "3. Paylaşım",
        metin: "Sefer sürecinin gerektirdiği durumlarda (ör. kamyoncu bilgilerinin işverene iletilmesi) kişisel verileriniz karşı taraf ile paylaşılabilir. Bu paylaşım yalnızca taşıma hizmetinin kurulması ve tamamlanması için yapılır."
      },
      {
        baslik: "4. KVKK ve Haklarınız",
        metin: "KVKK kapsamında verilerinize erişme, düzeltilmesini isteme, silinmesini isteme ve işlenmesine itiraz etme haklarına sahipsiniz. Talepleriniz için destek@nakliyol.com adresinden bize ulaşabilirsiniz."
      },
      {
        baslik: "5. Veri Güvenliği",
        metin: "Verileriniz şifrelenmiş biçimde saklanır ve yetkisiz erişime karşı korunur. TC kimlik numaranız arayüzde maskeli biçimde gösterilir."
      },
      {
        baslik: "6. İletişim",
        metin: "Gizlilik politikamıza ilişkin sorularınız için destek@nakliyol.com adresinden bize yazabilirsiniz."
      }
    ]
  }
};

export default function YasalSayfa({ tur = "kosullar" }) {
  const navigate = useNavigate();
  const veri = ICERIK[tur] || ICERIK.kosullar;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: 20, overflowY: "auto" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          ← Geri
        </button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 40, letterSpacing: 4, lineHeight: 1, color: "var(--navy)" }}>
            NAKLI<span style={{ background: "var(--guldum-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>YOL</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginTop: 10 }}>{veri.baslik}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Son güncelleme: 08.2026</div>
        </div>

        {veri.bolumler.map(b => (
          <div key={b.baslik} className="card" style={{ padding: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>{b.baslik}</div>
            <div style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.7 }}>{b.metin}</div>
          </div>
        ))}

        <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 30, fontSize: 11, color: "var(--text3)" }}>
          NakliYol © 2026 — destek@nakliyol.com
        </div>
      </div>
    </div>
  );
}
