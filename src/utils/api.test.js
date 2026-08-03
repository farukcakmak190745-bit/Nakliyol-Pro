import {
  kullanicilariGetir,
  ilanlariGetir,
  ilanEkle,
  ilanSoftSil,
  seferleriGetir,
  seferEkle,
  teklifleriGetir,
  teklifEkle,
  bildirimleriGetir,
  ihtilaflariGetir,
  hizSiniriAsildiMi
} from "./api";

// Supabase zincirini taklit eden fluent mock: hem await edilebilir (thenable)
// hem de from/select/eq/order/limit/insert/... metodlarına sahip.
function zincir(sonuc) {
  const p = Promise.resolve(sonuc);
  const c = p;
  ["from", "select", "eq", "neq", "in", "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete", "rpc", "is", "gte", "not"]
    .forEach(m => { c[m] = jest.fn(() => c); });
  return c;
}

function sbMock() {
  return {
    from: jest.fn(() => zincir({ data: [], error: null })),
    rpc: jest.fn(() => zincir({ data: true, error: null }))
  };
}

describe("veri erişim fonksiyonları", () => {
  it("ilanlariGetir doğru tablo/sıralama/limit kullanır", async () => {
    const c = zincir({ data: [{ id: 1 }], error: null });
    const sb = { from: jest.fn(() => c) };

    const sonuc = await ilanlariGetir(sb, 25);

    expect(sb.from).toHaveBeenCalledWith('ilanlar');
    expect(c.select).toHaveBeenCalledWith('*');
    expect(c.order).toHaveBeenCalledWith('tarih', { ascending: false });
    expect(c.limit).toHaveBeenCalledWith(25);
    expect(sonuc.data).toEqual([{ id: 1 }]);
  });

  it("kullanicilariGetir users tablosunu sorgular", async () => {
    const sb = sbMock();
    await kullanicilariGetir(sb);
    expect(sb.from).toHaveBeenCalledWith('users');
  });

  it("seferleriGetir ve teklifleriGetir doğru tabloları kullanır", async () => {
    const sb = sbMock();
    await seferleriGetir(sb);
    expect(sb.from).toHaveBeenCalledWith('seferler');
    await teklifleriGetir(sb);
    expect(sb.from).toHaveBeenCalledWith('teklifler');
  });

  it("ilanEkle insert verisini iletir", async () => {
    const c = zincir({ data: { id: 9 }, error: null });
    const sb = { from: jest.fn(() => c) };

    await ilanEkle(sb, { yuk: "Çelik", ucret: 5000 });

    expect(sb.from).toHaveBeenCalledWith('ilanlar');
    expect(c.insert).toHaveBeenCalledWith([{ yuk: "Çelik", ucret: 5000 }]);
    expect(c.select).toHaveBeenCalled();
    expect(c.single).toHaveBeenCalled();
  });

  it("ilanSoftSil durum=silindi günceller", async () => {
    const c = zincir({ data: null, error: null });
    const sb = { from: jest.fn(() => c) };

    await ilanSoftSil(sb, "i42");

    expect(sb.from).toHaveBeenCalledWith('ilanlar');
    expect(c.update).toHaveBeenCalledWith({ durum: 'silindi' });
    expect(c.eq).toHaveBeenCalledWith('id', "i42");
  });

  it("seferEkle insert verisini iletir", async () => {
    const c = zincir({ data: null, error: null });
    const sb = { from: jest.fn(() => c) };

    await seferEkle(sb, { yuk: "Demir" });

    expect(sb.from).toHaveBeenCalledWith('seferler');
    expect(c.insert).toHaveBeenCalledWith([{ yuk: "Demir" }]);
  });

  it("teklifEkle insert verisini iletir", async () => {
    const c = zincir({ data: { id: 5 }, error: null });
    const sb = { from: jest.fn(() => c) };

    await teklifEkle(sb, { ilan_id: "i1", tutar: 300 });

    expect(sb.from).toHaveBeenCalledWith('teklifler');
    expect(c.insert).toHaveBeenCalledWith([{ ilan_id: "i1", tutar: 300 }]);
    expect(c.single).toHaveBeenCalled();
  });

  it("bildirimleriGetir kullanıcıya özel filtre uygular", async () => {
    const c = zincir({ data: [], error: null });
    const sb = { from: jest.fn(() => c) };

    await bildirimleriGetir(sb, "u1", 50);

    expect(sb.from).toHaveBeenCalledWith('bildirimler');
    expect(c.eq).toHaveBeenCalledWith('kullanici_id', "u1");
    expect(c.order).toHaveBeenCalledWith('olusturma_zamani', { ascending: false });
    expect(c.limit).toHaveBeenCalledWith(50);
  });

  it("ihtilaflariGetir doğru tabloyu sorgular", async () => {
    const sb = sbMock();
    await ihtilaflariGetir(sb);
    expect(sb.from).toHaveBeenCalledWith('ihtilaflar');
  });
});

describe("hizSiniriAsildiMi (anti-spam)", () => {
  const parametre = { tablo: 'teklifler', sutun: 'teklif_sahibi_id', deger: 'u1', dakika: 1, limit: 5 };

  it("RPC true dönerse istek engellenmelidir", async () => {
    const sb = { rpc: jest.fn(() => zincir({ data: true, error: null })) };
    await expect(hizSiniriAsildiMi(sb, parametre)).resolves.toBe(true);
    expect(sb.rpc).toHaveBeenCalledWith('hiz_siniri_asildi_mi', {
      p_tablo: 'teklifler',
      p_sutun: 'teklif_sahibi_id',
      p_deger: 'u1',
      p_dakika: 1,
      p_limit: 5
    });
  });

  it("RPC false dönerse istek serbesttir", async () => {
    const sb = { rpc: jest.fn(() => zincir({ data: false, error: null })) };
    await expect(hizSiniriAsildiMi(sb, parametre)).resolves.toBe(false);
  });

  it("RPC hata dönerse güvenli tarafa geçer (engellenmez)", async () => {
    const sb = { rpc: jest.fn(() => zincir({ data: null, error: { message: 'x' } })) };
    await expect(hizSiniriAsildiMi(sb, parametre)).resolves.toBe(false);
  });

  it("RPC istisna atarsa engellenmez", async () => {
    const sb = { rpc: jest.fn(() => { throw new Error('down'); }) };
    await expect(hizSiniriAsildiMi(sb, parametre)).resolves.toBe(false);
  });

  it("sb veya deger yoksa false döner", async () => {
    await expect(hizSiniriAsildiMi(null, parametre)).resolves.toBe(false);
    await expect(hizSiniriAsildiMi({ rpc: jest.fn() }, { ...parametre, deger: null })).resolves.toBe(false);
  });
});
