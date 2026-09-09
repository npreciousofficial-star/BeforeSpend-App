/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standalone Supabase Keepalive Script
 * Usage: 
 *   node scripts/keepalive.js          # Single ping
 *   node scripts/keepalive.js --daemon # Runs continuously, pinging every 24h
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://soqllmwmojyzvathirdd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcWxsbXdtb2p5enZhdGhpcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzE5NTAsImV4cCI6MjEwMDIwNzk1MH0.aTgkvp7erLcPj334U09NjQ57M99KOPxI_Oj8cEN8Yas';

async function pingSupabase() {
  const timestamp = new Date().toISOString();
  console.log(`[Keepalive ${timestamp}] Pinging Supabase instance at ${SUPABASE_URL}...`);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`[Keepalive] Status code: ${res.status} ${res.statusText}`);
    if (res.ok) {
      console.log('✅ Supabase project pinged successfully. Activity registered!');
      return true;
    } else {
      const body = await res.text();
      console.warn('⚠️ Supabase returned non-200 status:', body);
      return false;
    }
  } catch (err) {
    console.error('❌ Keepalive ping failed:', err.message);
    return false;
  }
}

const isDaemon = process.argv.includes('--daemon') || process.argv.includes('-d');

if (isDaemon) {
  console.log('🚀 Supabase Keepalive Daemon active. Pinging every 24 hours...');
  pingSupabase();
  // Ping every 24 hours (24 * 60 * 60 * 1000 ms)
  setInterval(pingSupabase, 24 * 60 * 60 * 1000);
} else {
  pingSupabase();
}

