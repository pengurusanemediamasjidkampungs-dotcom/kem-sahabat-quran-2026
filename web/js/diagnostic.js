/**
 * KSQ 2026 - Backend Setup Diagnostic
 * 
 * Run this in browser console (F12) on the live site to check
 * if all backend setup steps are complete.
 * 
 * Usage: Copy-paste entire script into browser console (F12 > Console)
 */

(async function() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  KSQ 2026 Backend Setup Diagnostic                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const API_URL = 'https://script.google.com/macros/s/AKfycbzjPKel795KECV6i_Vve7qvMcS_yIndoevmQ5ms9uIG4pqEW5Ey/exec';
  
  let checks = [];
  let passed = 0;
  let failed = 0;

  function check(name, fn) {
    return fn().then(
      (result) => {
        checks.push({ name, status: '✅ PASS', detail: result });
        passed++;
      },
      (error) => {
        checks.push({ name, status: '❌ FAIL', detail: error.message || error });
        failed++;
      }
    );
  }

  // 1. Check API_URL in config.js
  await check('config.js API_URL', async () => {
    const resp = await fetch('/config.js');
    const text = await resp.text();
    if (text.includes('AKfycbzjPKel795KECV6i_Vve7qvMcS_yIndoevmQ5ms9uIG4pqEW5Ey')) {
      return 'Production URL detected';
    }
    throw new Error('config.js still has placeholder URL');
  });

  // 2. Check poster.js loads
  await check('poster.js loads (not 404)', async () => {
    const resp = await fetch('/js/poster.js');
    if (resp.ok) return '200 OK';
    throw new Error(`${resp.status} ${resp.statusText}`);
  });

  // 3. Check GAS stats endpoint returns JSON
  await check('GAS /exec?action=stats returns JSON', async () => {
    const resp = await fetch(`${API_URL}?action=stats`, { 
      headers: { 'Accept': 'application/json' },
      mode: 'cors'
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('json')) throw new Error(`Content-Type: ${ct} (expected JSON)`);
    const data = await resp.json();
    if (!data.ok) throw new Error(`API error: ${data.error}`);
    return `kapasiti: ${data.data.kapasiti}, disahkan: ${data.data.disahkan}, bakiSlot: ${data.data.bakiSlot}`;
  });

  // 4. Check GAS register endpoint accepts POST
  await check('GAS /exec register endpoint', async () => {
    const testData = {
      action: 'register',
      nama_peserta: 'Test Diagnostic',
      umur: '15',
      jantina: 'Lelaki',
      tel_penjaga: '013-6930292',
      nama_penjaga: 'Test Guardian',
      lancar_quran: 'ya',
      alahan_kesihatan: 'Tiada',
      persetujuan_data: true,
      website: ''
    };
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(testData),
      mode: 'cors'
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    // Expect VALIDASI error (test data) or success - either means endpoint works
    if (data.code === 'VALIDASI' || data.ok) {
      return `Endpoint responds (${data.ok ? 'success' : 'validation error as expected'})`;
    }
    throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
  });

  // 5. Check CORS headers
  await check('CORS allows requests from GitHub Pages', async () => {
    const resp = await fetch(`${API_URL}?action=stats`, { 
      method: 'OPTIONS',
      mode: 'cors'
    });
    // GAS doesn't support OPTIONS, but GET should work with CORS
    const getResp = await fetch(`${API_URL}?action=stats`, { mode: 'cors' });
    const acao = getResp.headers.get('access-control-allow-origin');
    if (acao === '*' || acao?.includes('github.io')) {
      return `CORS OK (${acao})`;
    }
    return `CORS header: ${acao || 'not set (may still work)'}`;
  });

  // 6. Check Script Properties via stats (indirect)
  await check('Script Properties (indirect)', async () => {
    const resp = await fetch(`${API_URL}?action=stats`, { mode: 'cors' });
    const data = await resp.json();
    if (data.data.pendaftaranDibuka !== undefined) {
      return 'Script Properties accessible (pendaftaranDibuka returned)';
    }
    throw new Error('Script Properties may not be set');
  });

  // Wait for all checks
  await Promise.allSettled([]); // dummy

  // Print results
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│                      RESULTS                               │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  checks.forEach((c, i) => {
    console.log(`${i+1}. ${c.status}  ${c.name}`);
    console.log(`   → ${c.detail}`);
  });

  console.log(`\n📊 Summary: ${passed}/${checks.length} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 ALL CHECKS PASSED! Backend is ready.');
    console.log('   You can now test registration at /#daftar');
  } else {
    console.log('\n⚠️  SOME CHECKS FAILED. Complete these steps in Google Apps Script:');
    console.log('');
    console.log('1. Paste Code-v2.gs into Code.gs (Apps Script editor)');
    console.log('2. Add Script Properties:');
    console.log('   - ADMIN_TOKEN');
    console.log('   - FASILITATOR_TOKEN');
    console.log('   - EMAIL_ADMIN');
    console.log('3. Deploy > Manage deployments > Edit > New version > Deploy');
    console.log('4. Run setupSheets() then seedData()');
    console.log('5. Re-run this diagnostic');
  }

  // Return for programmatic use
  return { passed, failed, checks };
})();