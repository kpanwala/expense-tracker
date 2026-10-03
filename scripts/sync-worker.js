const { createClient } = require('@supabase/supabase-js');

// 1. Verify environment secrets exist
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required secret: ${envVar}`);
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshAccessToken(refreshToken, email) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken.trim(),
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google OAuth failure for ${email}: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function parseSnippet(snippet) {
  const amountMatch = snippet.match(/(?:Rs\.?|INR|\$)\s*([\d,]+\.?\d*)/i);
  const cardMatch = snippet.match(/(?:card ending|ending in|ending with|A\/c no\.?|card no\.?)\s*([xX*]*\d{4})/i);
  const merchantMatch = snippet.match(/(?:at|info|vpa|to)\s+([A-Za-z0-9*&.\- ]{2,25})(?:\s+on|\s+dated|\.)/i);

  if (!amountMatch) return null;

  return {
    amount: parseFloat(amountMatch[1].replace(/,/g, '')),
    card_last4: cardMatch ? cardMatch[1].replace(/\D/g, '') : null,
    merchant: merchantMatch ? merchantMatch[1].trim() : 'Card Alert',
  };
}

async function run() {
  console.log('🔄 Fetching connected accounts from Supabase...');
  const { data: accounts, error } = await supabase.from('connected_accounts').select('*');

  if (error) {
    console.error('❌ Supabase Query Error:', error.message);
    process.exit(1);
  }

  if (!accounts || accounts.length === 0) {
    console.log('⚠️ No accounts found in connected_accounts table. Exiting gracefully.');
    return;
  }

  console.log(`Found ${accounts.length} account(s). Starting sync...`);

  for (const acc of accounts) {
    try {
      console.log(`🔑 Refreshing token for: ${acc.email}`);
      const token = await refreshAccessToken(acc.refresh_token, acc.email);

      const query = encodeURIComponent("newer_than:2d (debited OR spent OR 'card ending' OR 'txn')");
      const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const listData = await listRes.json();
      if (!listRes.ok) {
        throw new Error(`Gmail API list error: ${JSON.stringify(listData)}`);
      }

      const messages = listData.messages || [];
      console.log(`📨 Found ${messages.length} recent candidate message(s) for ${acc.email}`);

      for (const msg of messages) {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detail = await detailRes.json();
        const snippet = detail.snippet || '';

        const parsed = parseSnippet(snippet);
        if (parsed) {
          let bankName = 'Card';
          if (/hdfc/i.test(snippet)) bankName = 'HDFC';
          else if (/icici/i.test(snippet)) bankName = 'ICICI';
          else if (/sbi/i.test(snippet)) bankName = 'SBI';
          else if (/axis/i.test(snippet)) bankName = 'Axis';

          const { error: upsertErr } = await supabase.from('transactions').upsert(
            {
              message_id: msg.id,
              account_email: acc.email,
              amount: parsed.amount,
              card_last4: parsed.card_last4,
              bank_name: bankName,
              merchant: parsed.merchant,
              transaction_date: new Date(parseInt(detail.internalDate, 10)).toISOString(),
              raw_snippet: snippet,
              is_manual: false,
            },
            { onConflict: 'message_id' }
          );

          if (upsertErr) {
            console.error(`⚠️ Failed to upsert transaction ${msg.id}:`, upsertErr.message);
          } else {
            console.log(`✅ Logged: ₹${parsed.amount} at ${parsed.merchant} (${bankName})`);
          }
        }
      }
    } catch (e) {
      console.error(`❌ Error syncing account ${acc.email}:`, e.message);
      // Keep going to other accounts even if one fails
    }
  }

  console.log('🎉 Sync completed.');
}

run();