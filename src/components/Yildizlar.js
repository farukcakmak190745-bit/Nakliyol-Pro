import React from "react";

export function Yildizlar({ deger = 0, boyut = 14, renk = "#f59e0b", bosRenk = "var(--bg3)" }) {
  const yuvarlak = Math.round(Number(deger) || 0);
  return (
    <div style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: boyut, color: i <= yuvarlak ? renk : bosRenk, lineHeight: 1 }}>
          ★
        </span>
      ))}
    </div>
  );
}

export function YildizSecici({ deger = 5, setDeger, boyut = 34, renk = "#f59e0b" }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => setDeger(i)}
          aria-label={`${i} yıldız`}
          style={{
            fontSize: boyut,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: i <= deger ? renk : "var(--bg3)",
            transition: "transform 0.15s",
            transform: i <= deger ? "scale(1.1)" : "scale(1)"
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
