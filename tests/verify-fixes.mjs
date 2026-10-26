/**
 * Playwright verification script for i18n and hook-order fixes.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const FAILURES = [];
const SCREENSHOTS = 'screenshots';

function fail(label, msg) {
  FAILURES.push({ label, msg });
  console.error(`  FAIL: ${label}: ${msg}`);
}

function pass(label) {
  console.log(`  PASS: ${label}`);
}

function setupErrorCollector(page, label) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`  [CONSOLE(${label})] ${msg.text().substring(0, 200)}`);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.error(`  [PAGE(${label})] ${err.message.substring(0, 200)}`);
  });
  return errors;
}

async function addPlayers(page, names) {
  for (const name of names) {
    await page.fill('input', name);
    await page.click('button.add-btn');
  }
}

/** Reliable swipe-up gesture on RevealScreen */
async function swipeToReveal(page) {
  await page.mouse.move(195, 700);
  await page.mouse.down();
  await page.mouse.move(195, 200, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(700);
}

/** Click Continue / Start Game button after reveal */
async function clickContinue(page) {
  await page.waitForTimeout(300);
  const btns = await page.$$('button');
  for (const btn of btns) {
    const txt = await btn.textContent();
    const t = (txt || '').trim().toUpperCase();
    if (t.includes('CONTINU') || t.includes('START') || t.includes('ÎNCEPE')) {
      await btn.click();
      return true;
    }
  }
  return false;
}

/** Play through game: Setup -> Category -> Settings(PLAY) -> Reveal(3x) -> Starter -> Timer -> Voting -> MoT */
async function playThrough(page, { continueToResults = false, stopBeforeTimer = false } = {}) {
  await page.click('.cta-bar');
  await page.waitForTimeout(400);

  const deckBtns = await page.$$('button.deck');
  if (deckBtns.length > 0) {
    await deckBtns[0].click();
  } else {
    const ariaDeck = await page.$('button[aria-label^="Play"]');
    if (ariaDeck) await ariaDeck.click();
  }
  await page.waitForTimeout(400);

  await page.click('.cta-bar');
  await page.waitForTimeout(400);

  for (let i = 0; i < 3; i++) {
    await swipeToReveal(page);
    await clickContinue(page);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(300);

  const startBtns = await page.$$('button');
  for (const btn of startBtns) {
    const txt = await btn.textContent();
    const t = (txt || '').trim().toUpperCase();
    if (t.includes('START') || t.includes('ÎNCEPE')) {
      await btn.click();
      break;
    }
  }
  if (stopBeforeTimer) return;
  await page.waitForTimeout(500);

  await page.waitForTimeout(300);
  const timerBtns = await page.$$('button');
  for (const btn of timerBtns) {
    const txt = await btn.textContent();
    const t = (txt || '').trim().toUpperCase();
    if (t.includes('SKIP') || t.includes('SARI') || t.includes('VOTE NOW') || t.includes('VOTEAZĂ')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(400);

  const voteCards = await page.$$('.vote-card');
  if (voteCards.length > 0) {
    await voteCards[0].click();
    await page.waitForTimeout(200);
  }

  const lockCtas = await page.$$('.cta-bar');
  if (lockCtas.length > 0) {
    await lockCtas[0].click();
  }
  await page.waitForTimeout(600);

  if (continueToResults) {
    await page.mouse.click(195, 500);
    await page.waitForTimeout(1000);
  }
}

(async () => {
  console.log('\n=== Fake Out i18n & Fix Verification ===\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });

  // == 1. InfoModal i18n ==========================================
  console.log('\n--- 1. InfoModal i18n (EN + RO) ---');
  {
    // ENGLISH
    const page = await context.newPage();
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.screen.lobby');
    await addPlayers(page, ['Alice', 'Bob', 'Charlie']);
    await page.click('.cta-bar');
    await page.waitForTimeout(500);

    const infoBtn = await page.$('button[aria-label="How to play"]');
    if (infoBtn) {
      await infoBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOTS}/01-info-modal-en.png`, fullPage: true });
      const title = await page.textContent('.modal h2');
      if (title?.includes('How to play')) pass('InfoModal EN: shows "How to play"');
      else fail('InfoModal EN title', `Got "${title}"`);
      const body = await page.textContent('.modal');
      if (body?.includes('Everyone gets the same secret word')) pass('InfoModal EN: paragraph correct');
      const gotIt = await page.$('.modal button');
      if (gotIt) {
        const t = await gotIt.textContent();
        if (t?.trim() === 'Got it') pass('InfoModal EN: "Got it" button');
        await gotIt.click();
      }
    } else {
      fail('InfoModal EN', 'No info button found');
    }
    await page.close();

    // ROMANIAN
    const pageRo = await context.newPage();
    await pageRo.goto(BASE);
    await pageRo.evaluate(() => localStorage.clear());
    await pageRo.reload();
    await pageRo.waitForSelector('.screen.lobby');
    await addPlayers(pageRo, ['Alice', 'Bob', 'Charlie']);

    await pageRo.$('button[aria-label="Game settings"]').then(b => b?.click());
    await pageRo.waitForTimeout(300);
    await pageRo.$('button:has-text("Română")').then(b => b?.click());
    await pageRo.waitForTimeout(200);
    await pageRo.$('button[aria-label="Înapoi"]').then(b => b?.click());
    await pageRo.waitForTimeout(200);

    await pageRo.click('.cta-bar');
    await pageRo.waitForTimeout(500);

    const infoBtnRo = await pageRo.$('button[aria-label="Cum se joacă"]');
    if (infoBtnRo) {
      await infoBtnRo.click();
      await pageRo.waitForTimeout(500);
      await pageRo.screenshot({ path: `${SCREENSHOTS}/01-info-modal-ro.png`, fullPage: true });
      const titleRo = await pageRo.textContent('.modal h2');
      if (titleRo?.includes('Cum se joacă')) pass('InfoModal RO: "Cum se joacă"');
      else fail('InfoModal RO title', `Got "${titleRo}"`);
      const bodyRo = await pageRo.textContent('.modal');
      if (bodyRo?.includes('Toți primesc același cuvânt secret')) pass('InfoModal RO: paragraph correct');
      const gotItRo = await pageRo.$('.modal button');
      if (gotItRo) {
        const tRo = await gotItRo.textContent();
        if (tRo?.trim() === 'Am înțeles') pass('InfoModal RO: "Am înțeles" button');
        else fail('InfoModal RO got-it', `Got "${tRo}"`);
      }
    } else {
      fail('InfoModal RO', 'No info button found');
    }
    await pageRo.close();
  }

  // == 2. MomentOfTruthScreen i18n ================================
  console.log('\n--- 2. MomentOfTruthScreen i18n (EN + RO) ---');
  {
    // ENGLISH
    const pageEn = await context.newPage();
    await pageEn.goto(BASE);
    await pageEn.evaluate(() => localStorage.clear());
    await pageEn.reload();
    await pageEn.waitForSelector('.screen.lobby');
    await addPlayers(pageEn, ['Alice', 'Bob', 'Charlie']);
    await playThrough(pageEn);
    await pageEn.screenshot({ path: `${SCREENSHOTS}/02-mot-en.png`, fullPage: true });

    const motTextEn = await pageEn.textContent('.mot-text');
    console.log(`  MOT text (EN): "${motTextEn}"`);
    if (motTextEn?.includes('THE') && motTextEn.includes('MOMENT') && motTextEn.includes('OF TRUTH')) {
      pass('MoT EN: i18n "THE MOMENT OF TRUTH"');
    } else {
      fail('MoT EN text', `Got "${motTextEn}"`);
    }

    const spansEn = await pageEn.$$('.mot-text span');
    console.log(`  MOT spans (EN): ${spansEn.length}`);
    for (const s of spansEn) console.log(`    "${await s.textContent()}"`);
    if (spansEn.length === 3) pass('MoT EN: 3 spans correctly');
    else fail('MoT EN span count', `Expected 3, got ${spansEn.length}`);

    const bodyEn = await pageEn.textContent('body');
    if (!bodyEn.includes('ADEVĂRULUI')) pass('MoT EN: no hardcoded Romanian');
    else fail('MoT EN has Romanian text', '');
    await pageEn.close();
  }

  // ROMANIAN
  {
    const pageRo = await context.newPage();
    await pageRo.goto(BASE);
    await pageRo.evaluate(() => localStorage.clear());
    await pageRo.reload();
    await pageRo.waitForSelector('.screen.lobby');
    await addPlayers(pageRo, ['Alice', 'Bob', 'Charlie']);

    await pageRo.$('button[aria-label="Game settings"]').then(b => b?.click());
    await pageRo.waitForTimeout(300);
    await pageRo.$('button:has-text("Română")').then(b => b?.click());
    await pageRo.waitForTimeout(200);
    await pageRo.$('button[aria-label="Înapoi"]').then(b => b?.click());
    await pageRo.waitForTimeout(200);

    await playThrough(pageRo);
    const roScreen = await pageRo.evaluate(() => document.querySelector('.screen')?.className || 'unknown');
    console.log(`  After RO playthrough: screen="${roScreen}"`);
    await pageRo.screenshot({ path: `${SCREENSHOTS}/02-mot-ro.png`, fullPage: true });

    if (!roScreen.includes('mot')) {
      fail('MoT RO playthrough', `Did not reach MoT. Stuck on: "${roScreen}"`);
    } else {
      const motTextRo = await pageRo.textContent('.mot-text');
      console.log(`  MOT text (RO): "${motTextRo}"`);
      if (motTextRo?.includes('MOMENTUL') && motTextRo.includes('ADEVĂRULUI')) {
        pass('MoT RO: i18n "MOMENTUL ADEVĂRULUI"');
      } else {
        fail('MoT RO text', `Got "${motTextRo}"`);
      }

      const spansRo = await pageRo.$$('.mot-text span');
      console.log(`  MOT spans (RO): ${spansRo.length}`);
      for (const s of spansRo) console.log(`    "${await s.textContent()}"`);

      if (spansRo.length === 3) {
        const texts = await Promise.all(spansRo.map(s => s.textContent()));
        const third = (texts[2] || '').trim();
        if (third === '') {
          fail('MoT RO: BUG - third span empty',
            `ro.motLines has 2 items but code renders 3 spans. Third span: "${texts[2]}".
             Fix: add third item to ro.motLines or handle variable-length arrays in MomentOfTruthScreen.`);
        }
      }

      const bodyRo = await pageRo.textContent('body');
      if (!bodyRo.includes('THE MOMENT OF TRUTH')) pass('MoT RO: no hardcoded English');
      else fail('MoT RO has English text', '');
    }
    await pageRo.close();
  }

  // == 3. SettingsScreen i18n ======================================
  console.log('\n--- 3. SettingsScreen i18n (EN + RO) ---');
  {
    const page = await context.newPage();
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.screen.lobby');
    await addPlayers(page, ['Alice', 'Bob', 'Charlie']);

    await page.$('button[aria-label="Game settings"]').then(b => b?.click());
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOTS}/03-settings-en.png`, fullPage: true });

    const gmSub = await page.textContent('.set-card:first-child .sub');
    console.log(`  GM desc (EN): "${gmSub}"`);
    if (gmSub?.includes('Imposter gets no word')) pass('Settings EN: Game Mode i18n correct');
    if (gmSub && !gmSub.includes('Classic mode description')) pass('Settings EN: GM not hardcoded');

    const cards = await page.$$('.set-card');
    let dsDesc = '';
    for (const card of cards) {
      const text = await card.textContent();
      if (text.includes('Discussion Style')) {
        dsDesc = await card.$eval('.sub', el => el.textContent || '');
        break;
      }
    }
    console.log(`  DS desc (EN): "${dsDesc}"`);
    if (dsDesc?.includes('Everyone discusses freely')) pass('Settings EN: DS i18n correct');
    if (dsDesc && !dsDesc.includes('Discussion style')) pass('Settings EN: DS not hardcoded');

    await page.$('button:has-text("Română")').then(b => b?.click());
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOTS}/03-settings-ro.png`, fullPage: true });

    const roGmSub = await page.textContent('.set-card:first-child .sub');
    console.log(`  GM desc (RO): "${roGmSub}"`);
    if (roGmSub?.includes('nu primește cuvânt')) pass('Settings RO: Game Mode i18n correct');

    const roCards = await page.$$('.set-card');
    let roDsDesc = '';
    for (const card of roCards) {
      const text = await card.textContent();
      if (text.includes('Stil Discuție')) {
        roDsDesc = await card.$eval('.sub', el => el.textContent || '');
        break;
      }
    }
    console.log(`  DS desc (RO): "${roDsDesc}"`);
    if (roDsDesc?.includes('Toată lumea') || roDsDesc?.includes('descriu pe rând')) {
      pass('Settings RO: DS i18n correct');
    }
    await page.close();
  }

  // == 4. ResultsScreen toast ======================================
  console.log('\n--- 4. ResultsScreen Toast ---');
  {
    const page = await context.newPage();
    await page.goto(BASE);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('fakeit.xp', JSON.stringify(95));
    });
    await page.reload();
    await page.waitForSelector('.screen.lobby');
    await addPlayers(page, ['Alice', 'Bob', 'Charlie']);

    await playThrough(page, { continueToResults: true });
    await page.screenshot({ path: `${SCREENSHOTS}/04-results-toast.png`, fullPage: true });

    const toastEl = await page.$('.xp-toast');
    if (toastEl) {
      const toastText = await toastEl.textContent();
      console.log(`  Toast: "${toastText}"`);

      if (toastText.includes('Congratulări')) {
        fail('Results toast', 'Hardcoded "Congratulări!" found - should use i18n');
      } else if (toastText.includes('Congratulations') || toastText.includes('🎉')) {
        pass('Results toast uses i18n (not hardcoded "Congratulări!")');
      } else {
        console.log('  Toast: XP only, no congrats');
      }

      const toastMsg = await page.$('.toast-msg');
      if (toastMsg) {
        const msgText = await toastMsg.textContent();
        console.log(`  Toast msg: "${msgText}"`);
        if (msgText?.includes('Congratulations')) pass('Level-up toast: i18n "Congratulations!"');
        if (msgText?.includes('Congratulări')) fail('Level-up toast', 'Hardcoded "Congratulări!"');
      }
    } else {
      console.log('  No toast visible. Checking page...');
      const body = await page.textContent('body');
      if (body.includes('Congratulări')) fail('Page has hardcoded "Congratulări!"', '');
      else console.log('  No "Congratulări!" found - good');
    }
    await page.close();
  }

  // == 5. TimerScreen hook order ===================================
  console.log('\n--- 5. TimerScreen Hook Order (Turn-by-turn) ---');
  {
    const page = await context.newPage();
    const errors = setupErrorCollector(page, 'timer');

    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.screen.lobby');
    await addPlayers(page, ['Alice', 'Bob', 'Charlie']);

    await page.$('button[aria-label="Game settings"]').then(b => b?.click());
    await page.waitForTimeout(300);
    await page.$('button:has-text("Turn-by-turn")').then(b => b?.click());
    console.log('  Set turn-by-turn mode');
    await page.waitForTimeout(200);
    await page.$('button[aria-label="Back"]').then(b => b?.click());
    await page.waitForTimeout(200);

    await playThrough(page, { stopBeforeTimer: true });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS}/05-turn-timer-1.png`, fullPage: true });

    const isTurnMode = await page.$('.turn-mode');
    if (isTurnMode) {
      pass('TurnTimer: rendered in turn-mode');

      const hotseat = await page.$('.turn-hotseat');
      const checklist = await page.$('.turn-checklist');
      if (hotseat) pass('TurnTimer: hot seat rendered');
      else fail('TurnTimer', 'No hot seat');
      if (checklist) pass('TurnTimer: checklist rendered');
      else fail('TurnTimer', 'No checklist');

      const name1 = await page.textContent('.turn-hotseat-name');
      console.log(`  Player 1: "${name1}"`);
      const timer1 = await page.textContent('.timer-count');
      console.log(`  Timer @ start: "${timer1}"`);

      for (let p = 0; p < 3; p++) {
        await page.waitForTimeout(300);
        const nextBtn = await page.$('button:has-text("Next Player")');
        if (!nextBtn) break;
        await nextBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${SCREENSHOTS}/05-turn-timer-advance-${p + 1}.png`, fullPage: true });
        // Check if we transitioned to all-done
        const allDoneNow = await page.$('.turn-all-done');
        if (allDoneNow) {
          console.log(`  After advance ${p + 1}: all-done state`);
          break;
        }
        const name = await page.textContent('.turn-hotseat-name');
        const timer = await page.textContent('.timer-count');
        console.log(`  After advance ${p + 1}: "${name}" timer="${timer}"`);
      }

      await page.waitForTimeout(500);
      let allDone = await page.$('.turn-all-done');
      if (!allDone) {
        const nxtBtn = await page.$('button:has-text("Next Player")');
        if (nxtBtn) {
          await nxtBtn.click();
          await page.waitForTimeout(500);
          allDone = await page.$('.turn-all-done');
        }
      }
      if (allDone) {
        pass('TurnTimer: all-done state after all players');
        console.log(`  All-done: "${await allDone.textContent()}"`);
      } else {
        console.log('  No all-done screen found');
      }
    } else {
      fail('TurnTimer', 'Not in turn-mode');
      const cls = await page.$('.screen').then(el => el?.getAttribute('class'));
      console.log(`  Screen class: "${cls}"`);
    }

    console.log(`\n  Console errors: ${errors.length}`);
    let hookIssue = false;
    for (const err of errors) {
      if (err.toLowerCase().includes('hook') || err.toLowerCase().includes('rendered more')) {
        hookIssue = true;
        console.error(`    HOOK ERROR: ${err}`);
      }
    }
    if (hookIssue) fail('Timer hook order', 'React hook error detected');
    else if (errors.length === 0) pass('Timer: no console errors');
    else pass('Timer: no hook errors');
    await page.close();
  }

  // == SUMMARY =====================================================
  console.log('\n========================================');
  console.log('VERIFICATION SUMMARY');
  console.log('========================================');
  if (FAILURES.length === 0) {
    console.log('  ALL CHECKS PASSED');
  } else {
    console.log(`  ${FAILURES.length} FAILURE(S):`);
    for (const f of FAILURES) {
      console.log(`    - [${f.label}] ${f.message}`);
    }
  }
  console.log('========================================\n');

  await browser.close();
  process.exit(FAILURES.length > 0 ? 1 : 0);
})().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
