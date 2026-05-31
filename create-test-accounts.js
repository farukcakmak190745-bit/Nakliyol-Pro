const { createClient } = require('@supabase/supabase-js');

// Supabase config
const supabaseUrl = 'https://wkxhgrqxknxchferqqha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGhncnF4a254Y2hmZXJxcWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjI4ODcsImV4cCI6MjA5MzczODg4N30.PObDf90tsIOZhsXtwIFOgODEsjXLVZ0DNgYZ8vrPTQQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestAccounts() {
  console.log('🔧 Test hesapları oluşturuluyor...\n');

  // Test 1: İş Veren (Issiz)
  console.log('1️⃣ İş Veren (Issiz) hesabı oluşturuluyor...');
  const { data: employerData, error: employerError } = await supabase
    .from('users')
    .insert([{
      email: '5555555551@demo.com',
      role: 'issiz',
      ad: 'Test İş Yeri',
      tc_kimlik: '12345678901',
      telefon: '5555555551'
    }])
    .select()
    .single();

  if (employerError) {
    console.log('❌ İş Veren oluşturulamadı:', employerError.message);
  } else {
    console.log('✅ İş Veren oluşturuldu:', employerData);

    // User roles oluştur
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{ user_id: employerData.id }]);
    console.log('✅ User role oluşturuldu');

    // Auth'da kullanıcı oluştur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: '5555555551@demo.com',
      password: '123456'
    });

    if (authError) {
      console.log('⚠️ Auth kaydı (zorunlu değil):', authError.message);
    } else {
      console.log('✅ Auth kaydı oluşturuldu');
    }
  }
  console.log('');

  // Test 2: Kamyoncu
  console.log('2️⃣ Kamyoncu hesabı oluşturuluyor...');
  const { data: driverData, error: driverError } = await supabase
    .from('users')
    .insert([{
      email: '5555555552@demo.com',
      role: 'kamyoncu',
      ad: 'Test Kamyoncu',
      tc_kimlik: '12345678902',
      telefon: '5555555552'
    }])
    .select()
    .single();

  if (driverError) {
    console.log('❌ Kamyoncu oluşturulamadı:', driverError.message);
  } else {
    console.log('✅ Kamyoncu oluşturuldu:', driverData);

    // User roles oluştur
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{ user_id: driverData.id }]);
    console.log('✅ User role oluşturuldu');

    // Auth'da kullanıcı oluştur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: '5555555552@demo.com',
      password: '123456'
    });

    if (authError) {
      console.log('⚠️ Auth kaydı (zorunlu değil):', authError.message);
    } else {
      console.log('✅ Auth kaydı oluşturuldu');
    }
  }
  console.log('');

  // Tüm kullanıcıları listele
  console.log('📋 Tüm kullanıcılar:');
  const { data: allUsers, error: listError } = await supabase
    .from('users')
    .select('*');

  if (listError) {
    console.log('❌ Kullanıcılar listelenemedi:', listError.message);
  } else {
    allUsers.forEach(user => {
      console.log(`   ${user.ad} (${user.role}): ${user.telefon} - ${user.email}`);
    });
  }

  console.log('\n✨ Test hesapları oluşturuldu! Giriş yapabilirsiniz.');
  console.log('\n🔑 Test Bilgileri:');
  console.log('   İş Veren: 5555555551 / şifre: 123456');
  console.log('   Kamyoncu: 5555555552 / şifre: 123456');
}

createTestAccounts().catch(console.error);
