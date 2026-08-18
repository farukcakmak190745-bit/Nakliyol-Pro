-- Google Play zorunluluğu: Kullanıcı hesabını uygulama içinden silebilmelidir.
-- Kullanıcı, Ayarlar -> Hesabımı Sil ile bu fonksiyonu çağırır.
-- Alt tablolar users(id) üzerindeki ON DELETE CASCADE sayesinde temizlenir.

CREATE OR REPLACE FUNCTION public.hesap_sil()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Giriş yapılmamış';
  END IF;

  DELETE FROM public.push_abonelikleri WHERE user_id = uid;
  DELETE FROM public.users WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hesap_sil() TO authenticated;