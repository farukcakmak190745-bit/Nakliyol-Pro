const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wkxhgrqxknxchferqqha.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGhncnF4a254Y2hmZXJxcWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjI4ODcsImV4cCI6MjA5MzczODg4N30.PObDf90tsIOZhsXtwIFOgODEsjXLVZ0DNgYZ8vrPTQQ'
);

async function createAccounts() {
  try {
    console.log('👥 Kullanıcı hesapları oluşturuluyor...\n');

    // İşveren hesabı
    const employer = {
      email: 'issiz@test.com',
      password: 'test123',
      ad: 'Ahmet İşveren',
      telefon: '5551112233',
      tc_kimlik: '11111111111',
      firmaAdi: 'Test Şirketi',
      rol: 'issiz'
    };

    console.log('1️⃣ İşveren hesabı oluşturuluyor...');
    const { data: empData, error: empError } = await supabase.auth.signUp({
      email: employer.email,
      password: employer.password
    });

    if (empError) {
      console.log('⚠️ İşveren:', empError.message);
    } else {
      console.log('✅ İşveren email:', empData.user.email);
    }

    // Kullanıcı tablosuna kayıt
    if (empData?.user) {
      await supabase.from('users').insert([{
        id: empData.user.id,
        email: employer.email,
        ad: employer.ad,
        telefon: employer.telefon,
        tc_kimlik: employer.tc_kimlik,
        role: employer.rol,
        firmaAdi: employer.firmaAdi
      }]);

      await supabase.from('user_roles').insert([{
        user_id: empData.user.id
      }]);

      console.log('✅ İşveren kaydı tamamlandı!');
    }

    // Kamyoncu hesabı
    const trucker = {
      email: 'kamyoncu@test.com',
      password: 'test123',
      ad: 'Mehmet Kamyoncu',
      telefon: '5559876543',
      tc_kimlik: '98765432101',
      rol: 'kamyoncu'
    };

    console.log('\n2️⃣ Kamyoncu hesabı oluşturuluyor...');
    const { data: truckerData, error: truckerError } = await supabase.auth.signUp({
      email: trucker.email,
      password: trucker.password
    });

    if (truckerError) {
      console.log('⚠️ Kamyoncu:', truckerError.message);
    } else {
      console.log('✅ Kamyoncu email:', truckerData.user.email);
    }

    // Kullanıcı tablosuna kayıt
    if (truckerData?.user) {
      await supabase.from('users').insert([{
        id: truckerData.user.id,
        email: trucker.email,
        ad: trucker.ad,
        telefon: trucker.telefon,
        tc_kimlik: trucker.tc_kimlik,
        role: trucker.rol
      }]);

      await supabase.from('user_roles').insert([{
        user_id: truckerData.user.id
      }]);

      console.log('✅ Kamyoncu kaydı tamamlandı!');
    }

    console.log('\n✨ Tüm hesaplar oluşturuldu!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

createAccounts();
