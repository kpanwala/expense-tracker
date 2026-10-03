const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

function parseSnippet(snippet) {
  // Regex covering major Indian bank alert formats (HDFC, ICICI, SBI, Axis, etc.)
  const amountMatch = snippet.match(/(?:Rs\.?|INR|\$)\s*([\d,]+\.?\d*)/i);
  const cardMatch = snippet.match(/(?:card ending|ending in|A\/c no\.?|card no\.?)\s*([xX*]*\d{4})/i);
  const merchantMatch = snippet.match(/(?:at|info|vpa|to)\s+([A-Za-z0-9*&.\- ]{2,25})(?:\s+on|\s+dated|\.)/i);

  if (!amountMatch) return null;

  return {
    amount: parseFloat(amountMatch[1].replace(/,/g, '')),
    card_last4: cardMatch ? cardMatch[1].replace(/\D/g, '') : null,
    merchant: merchantMatch ? merchantMatch[1].trim() : 'Card Transaction',
  };
}

async function run() {
  const { data: accounts, error } = await supabase.from('connected_accounts').select('*');
  if (error || !accounts) return console.error('No accounts found:', error);

  for (const acc of accounts) {
    try {
      console.log(`Syncing: ${acc.email}`);
      const token = await refreshAccessToken(acc.refresh_token);

      // Search recent 2 days to capture newly arrived alerts
      const query = encodeURIComponent("newer_than:2d (debited OR spent OR 'card ending' OR 'txn')");
      const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listRes.json();

      for (const msg of listData.messages || []) {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const detail = await detailRes.json();
        const snippet = detail.snippet || '';

        const parsed = parseSnippet(snippet);
        if (parsed) {
          // Detect bank name from sender or snippet
          let bankName = 'Card';
          if (/hdfc/i.test(snippet)) bankName = 'HDFC';
          else if (/icici/i.test(snippet)) bankName = 'ICICI';
          else if (/sbi/i.test(snippet)) bankName = 'SBI';
          else if (/axis/i.test(snippet)) bankName = 'Axis';

          await supabase.from('transactions').upsert({
            message_id: msg.id,
            account_email: acc.email,
            amount: parsed.amount,
            card_last4: parsed.card_last4,
            bank_name: bankName,
            merchant: parsed.merchant,
            transaction_date: new Date(parseInt(detail.internalDate)).toISOString(),
            raw_snippet: snippet,
            is_manual: false
          }, { onConflict: 'message_id' });
        }
      }
    } catch (e) {
      console.error(`Failed to sync ${acc.email}:`, e);
    }
  }
}

run();