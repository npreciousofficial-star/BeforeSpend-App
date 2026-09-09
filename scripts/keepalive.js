/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standalone Supabase Keepalive Script
 * Usage: node scripts/keepalive.js
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://soqllmwmojyzvathirdd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWxsbXdtb2p5enZhdGhpcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzE5NTAsImV4cCI6MjEwMDIwNzk1MH0.aTgkvp7erLcPj334U09NjQ57M99KOPxI_Oj8cEN8Yas';

async function pingSupabase() {
  console.log(`[Keepalive] Pinging Supabase instance at ${SUPABASE_URL}...`);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`[Keepalive] Status code: ${res.status} ${res.statusText}`);
    if (res.ok) {
      console.log('✅ Supabase project pinged successfully. Activity registered!');
    } else {
      const body = await res.text();
      console.warn('⚠️ Supabase returned non-200 status:', body);
    }
  } catch (err) {
    console.error('❌ Keepalive ping failed:', err.message);
  }
}

pingSupabase();
