import re

# Dosyayı oku
with open('src/context/AppContext.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Eksik kodu ekle (Satır 434 sonrası)
# "Kayıttan sonra Supabase" satırının altına kodu ekle
old_code1 = '''          console.log("✅ Auth ve database kayırları oluşturuldu");
        }
          // Kayıttan sonra Supabase'''

new_code1 = '''          console.log("✅ Auth ve database kayırları oluşturuldu");

          // Kayıttan sonra Supabase'den son kullanıcıyı çek ve rolü kontrol et
          try {
            const { data: freshUserData } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            if (freshUserData && freshUserData.role) {
              console.log("✅ Kayıt sonrası kullanıcı çekildi, rol:", freshUserData.role);
              setOturum(freshUserData);
              return freshUserData;
            } else {
              console.error("❌ Kayıttan sonra rol boş veya yok:", freshUserData);
            }
          } catch (error) {
            console.error("Kayıt sonrası kullanıcı çekme hatası:", error);
          }
        }'''

content = content.replace(old_code1, new_code1)

# 2. İkinci bölümü değiştir
old_code2 = '''      if (userId && authSession) {
        // Session varsa doğrudan oturumu kullan
        finalUser = {
          id: userId,
          email: email,
          role: bilgiler.rol || "issiz",
          ad: bilgiler.ad,
          tc_kimlik: bilgiler.tc,
          telefon: telefon,
          session: authSession
        };
        setOturum(finalUser);
        console.log("✅ Kayıt başarılı ve oturum oluşturuldu");
        return finalUser;'''

new_code2 = '''      if (userId && authSession) {
        // Kayıttan önce Supabase'den son kullanıcıyı çek ve doğru rolü kullan
        try {
          const { data: freshUserData } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (freshUserData && freshUserData.role) {
            console.log("✅ Son kullanıcı çekildi, rol:", freshUserData.role);
            finalUser = freshUserData;
            setOturum(freshUserData);
            return freshUserData;
          }
        } catch (error) {
          console.error("Son kullanıcı çekme hatası:", error);
        }

        // Eğer Supabase'de yoksa kaydettiğimiz veriyi kullan
        finalUser = {
          id: userId,
          email: email,
          role: bilgiler.rol || "issiz",
          ad: bilgiler.ad,
          tc_kimlik: bilgiler.tc,
          telefon: telefon,
          session: authSession
        };
        setOturum(finalUser);
        console.log("✅ Kayıt başarılı ve oturum oluşturuldu");
        return finalUser;'''

content = content.replace(old_code2, new_code2)

# Dosyayı kaydet
with open('src/context/AppContext.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ AppContext.js güncellendi!")
