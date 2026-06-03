import { useMemo } from "react";
import iller from "../data/iller.json";

/**
 * IlIlceSecici — 81 il + ilçe seçici
 *
 * Props:
 *   value: string           -> "İl" veya "İl / İlçe" formatında mevcut değer
 *   onChange: (val) => void -> seçilen değer (örn. "Antalya / Alanya" veya sadece "Antalya")
 *   placeholder: string     -> opsyonel
 *   inputStyle: string      -> opsyonel className (default "input")
 *
 * Depolama formatı:
 *   - Sadece il seçilmişse: "Antalya"
 *   - İl + ilçe seçilmişse: "Antalya / Alanya"
 *
 * Eski veriler (sadece il adı) geriye uyumludur, otomatik parse edilir.
 */
export default function IlIlceSecici({ value = "", onChange, placeholder = "İl seçin...", inputStyle = "input" }) {
  // Mevcut değeri parse et: "Antalya / Alanya" veya "Antalya" -> { il, ilce }
  const parsed = useMemo(() => {
    if (!value) return { il: "", ilce: "" };
    const parcalar = value.split(" / ").map(p => p.trim());
    return {
      il: parcalar[0] || "",
      ilce: parcalar[1] || ""
    };
  }, [value]);

  const seciliIlObj = useMemo(
    () => iller.find(i => i.il === parsed.il),
    [parsed.il]
  );

  const ilceler = seciliIlObj?.ilceler || [];

  const handleIlChange = (yeniIl) => {
    // İl değişince ilçeyi sıfırla
    onChange(yeniIl || "");
  };

  const handleIlceChange = (yeniIlce) => {
    if (!parsed.il) return;
    if (!yeniIlce || yeniIlce === "Merkez" || yeniIlce === parsed.il) {
      // Sadece il adını sakla (daha temiz)
      onChange(parsed.il);
    } else {
      onChange(`${parsed.il} / ${yeniIlce}`);
    }
  };

  const selectStyle = {
    cursor: "pointer",
    background: "var(--bg2)",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select
        className={inputStyle}
        value={parsed.il}
        onChange={e => handleIlChange(e.target.value)}
        style={{ ...selectStyle, flex: 1 }}
      >
        <option value="">{placeholder}</option>
        {iller.map(i => (
          <option key={i.il} value={i.il}>{i.il}</option>
        ))}
      </select>
      <select
        className={inputStyle}
        value={parsed.ilce}
        onChange={e => handleIlceChange(e.target.value)}
        disabled={!parsed.il}
        style={{
          ...selectStyle,
          flex: 1,
          opacity: parsed.il ? 1 : 0.5,
          cursor: parsed.il ? "pointer" : "not-allowed"
        }}
      >
        <option value="">İlçe (opsiyonel)</option>
        {ilceler.map(ilce => (
          <option key={ilce} value={ilce}>{ilce}</option>
        ))}
      </select>
    </div>
  );
}
