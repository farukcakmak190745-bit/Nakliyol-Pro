const { createClient } = require('@supabase/supabase-js');

// Supabase config
const supabaseUrl = 'https://wkxhgrqxknxchferqqha.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGhncnF4a254Y2hmZXJxcWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjI4ODcsImV4cCI6MjA5MzczODg4N30.PObDf90tsIOZhsXtwIFOgODEsjXLVZ0DNgYZ8vrPTQQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAuthUsers() {
  console.log('🔐 Auth kullanıcıları oluşturuluyor...\n');

  const users = [
    {
      email: '5555555551@demo.com',
      password: '123456',
      name: 'Test İş Yeri'
    },
    {
      email: '5555555552@demo.com',
      password: '123456',
      name: 'Test Kamyoncu'
    }
  ];

  for (const user of users) {
    console.log(`🔄 ${user.name} (${user.email}) oluşturuluyor...`);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Otomatik email onayı
        user_metadata: {
          name: user.name
        }
      });

      if (error) {
        console.log(`   ❌ Hata: ${error.message}`);
      } else {
        console.log(`   ✅ Oluşturuldu! User ID: ${data.user.id}`);
      }
    } catch (err) {
      console.log(`   ⚠️ Exception: ${err.message}`);
    }
    console.log('');
  }

  console.log('✨ İşlem tamamlandı!');
}

createAuthUsers().catch(console.error);
