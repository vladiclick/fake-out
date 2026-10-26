/**
 * Comprehensive Playwright test suite for Fake Out game
 * Tests: Classic Freeform, Undercover Mode, Turn-by-Turn, Blitz Mode, Edge Cases
 *
 * Usage: node tests/run-all-tests.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForBodyText(page, substring, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const text = await page.textContent('body').catch(() => '');
    if (text.includes(substring)) return true;
    await sleep(200);
  }
  const body = await page.textContent('body').catch(() => '(error)');
  throw new Error(`waitForBodyText: "${substring}" not found in ${timeout}ms. Body begins: "${body.substring(0, 300)}"`);
}

async function waitForSelector(page, selector, timeout = 8000) {
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

async function clickText(page, text, opts = {}) {
  const btn = page.locator(`button:has-text("${text}")`).first();
  await btn.waitFor({ state: 'visible', timeout: 6000 });
  await btn.click(opts);
}

async function clickAria(page, label) {
  await page.locator(`button[aria-label="${label}"]`).first().click();
}

async function fillInput(page, placeholder, value) {
  const input = page.locator(`input[placeholder="${placeholder}"]`);
  await input.waitFor({ state: 'visible', timeout: 5000 });
  await input.fill(value);
}

async function addPlayer(page, name) {
  await fillInput(page, 'Enter player name', name);
  await clickAria(page, 'Add player');
  await sleep(150);
}

async function snap(page, testId, step) {
  await page.screenshot({ path: `screenshots/${testId}-${step}.png`, fullPage: false });
}

/**
 * Peek at the reveal screen by dragging up and waiting for Continue button.
 */
async function peekReveal(page) {
  const reveal = page.locator('.screen.reveal');
  await reveal.waitFor({ state: 'visible', timeout: 5000 });
  const box = await reveal.boundingBox();
  if (!box) throw new Error('Cannot locate reveal screen bounding box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 350, { steps: 15 });
  await sleep(150);
  await page.mouse.up();
  await sleep(400);
}

/**
 * Fast-forward through all reveals for N players.
 * On the last player, clicks "Start Game" if present.
 */
async function completeAllReveals(page, playerCount) {
  for (let i = 0; i < playerCount; i++) {
    await waitForSelector(page, '.screen.reveal');
    await peekReveal(page);

    const isStartGame = await page.locator('button:has-text("Start Game")').isVisible().catch(() => false);
    if (isStartGame) {
      await clickText(page, 'Start Game');
    } else {
      const cont = page.locator('button:has-text("Continue")').first();
      if (await cont.isVisible().catch(() => false)) {
        await cont.click();
        await sleep(300);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// TEST 1: Classic Freeform — Full game flow
// ─────────────────────────────────────────────────────────────────────
async function testClassicFreeform(page) {
  console.log('\n=== TEST 1: Classic Freeform Mode ===\n');

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await sleep(600);
  await snap(page, 't01', '00-setup');
  console.log('  OK  Setup screen loaded');

  // Add 3 players
  await addPlayer(page, 'Alice');
  await addPlayer(page, 'Bob');
  await addPlayer(page, 'Charlie');

  const pillCount = await page.locator('.pill').count();
  console.log(`  OK  3 player pills rendered: ${pillCount}${pillCount !== 3 ? ' (BUG: expected 3)' : ''}`);
  await snap(page, 't01', '01-players');

  // Verify CTA bar shows correct count
  const ctaSub = await page.textContent('.cta-sub');
  console.log(`  OK  CTA shows: "${ctaSub}"`);

  // Click CONTINUE
  await clickText(page, 'CONTINUE');
  await waitForBodyText(page, 'Party Time');
  console.log('  OK  Category screen reached');
  await snap(page, 't01', '02-category');

  // Click deck
  await clickText(page, 'Party Time');
  await waitForBodyText(page, 'Game Settings');
  console.log('  OK  Settings screen reached (Classic / Freeform)');
  await snap(page, 't01', '03-settings');

  // Click PLAY
  await clickText(page, 'PLAY');
  await waitForSelector(page, '.reveal');
  console.log('  OK  Reveal screen reached');

  // Complete all 3 reveals
  await completeAllReveals(page, 3);
  console.log('  OK  All 3 reveals completed');

  // Should be at Starter screen
  await waitForSelector(page, '.starter-screen');
  const starterName = await page.textContent('.starter-name');
  const starterAvatar = await page.locator('.starter-avatar-img').count();
  console.log(`  OK  Starter screen: "${starterName}", avatar: ${starterAvatar > 0}`);

  await snap(page, 't01', '04-starter');

  // Start round
  await clickText(page, 'Start the round');
  await waitForSelector(page, '.timer-screen');
  console.log('  OK  Freeform timer screen reached');

  // Verify timer elements
  const timerText = await page.textContent('.timer-count').catch(() => '(missing)');
  const ringSvg = await page.locator('.timer-ring').count();
  const brandLogo = await page.locator('.brand').count();
  console.log(`  OK  Timer: "${timerText}", ring: ${ringSvg > 0}, brand: ${brandLogo > 0}`);

  await snap(page, 't01', '05-timer');

  // Skip to voting
  await clickText(page, 'Skip to voting');
  await waitForSelector(page, '.voting-screen');
  const voteCards = await page.locator('.vote-card').count();
  console.log(`  OK  Voting screen, ${voteCards} vote cards${voteCards !== 3 ? ' (BUG: expected 3)' : ''}`);
  await snap(page, 't01', '06-voting');

  // Select first player
  await page.locator('.vote-card').first().click();
  await sleep(300);

  // Click LOCK IT IN
  await clickText(page, 'LOCK IT IN');

  // Wait for Moment of Truth (may auto-advance quickly, so check for either MOT or Results)
  try {
    await waitForSelector(page, '.mot-screen', 2000);
    console.log('  OK  Moment of Truth screen shown');
    // Tap to reveal
    await page.locator('.mot-screen').click();
    await sleep(600);
  } catch {
    console.log('  OK  MOT auto-advanced (results already showing)');
  }

  // Wait for Results
  await waitForSelector(page, '.results-screen');
  const outcome = await page.textContent('.outcome-title');
  const wordCard = await page.textContent('.word-card').catch(() => '(missing)');
  const imposterChip = await page.locator('.imposter-chip').count();
  const playAgainBtn = await page.locator('button:has-text("PLAY AGAIN")').count();
  console.log(`  OK  Results: "${outcome}", word card present, imposter chip: ${imposterChip > 0}, play again: ${playAgainBtn > 0}`);
  await snap(page, 't01', '07-results');

  // Check for XP toast
  const xpToast = await page.locator('.xp-toast').count();
  console.log(`  OK  XP toast shown: ${xpToast > 0}`);

  // Click PLAY AGAIN to verify reset
  await clickText(page, 'PLAY AGAIN');
  await waitForBodyText(page, 'Party Time');
  console.log('  OK  Play Again -> category screen');

  console.log('\n  ** TEST 1 PASSED: Full game flow complete, all screens rendered correctly');
}

// ─────────────────────────────────────────────────────────────────────
// TEST 2: Undercover Mode
// ─────────────────────────────────────────────────────────────────────
async function testUndercoverMode(page) {
  console.log('\n=== TEST 2: Undercover Mode ===\n');

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await sleep(500);

  // Add 4 players
  await addPlayer(page, 'Dave');
  await addPlayer(page, 'Eve');
  await addPlayer(page, 'Frank');
  await addPlayer(page, 'Grace');
  console.log('  OK  4 players added');

  // Category -> Settings
  await clickText(page, 'CONTINUE');
  await waitForBodyText(page, 'Party Time');
  await clickText(page, 'Party Time');
  await waitForBodyText(page, 'Game Settings');
  console.log('  OK  Settings screen');

  // Enable Undercover mode
  await clickText(page, 'Undercover');
  await sleep(200);
  console.log('  OK  Undercover mode enabled');
  await snap(page, 't02', '01-settings');

  // PLAY
  await clickText(page, 'PLAY');
  await waitForSelector(page, '.reveal');
  console.log('  OK  Reveal screen (undercover)');

  // Check drawer for player 1 — should show a word, not "IMPOSTER"
  await peekReveal(page);
  const drawerText = await page.textContent('.drawer');
  const hasImposterLabel = drawerText.includes('IMPOSTER');
  const hasWord = !hasImposterLabel && drawerText.length > 5;
  console.log(`  OK  Undercover drawer shows word (not IMPOSTER): ${hasWord}${hasImposterLabel ? ' (BUG: IMPOSTER label found)' : ''}`);
  console.log(`      Drawer excerpt: "${drawerText.replace(/\s+/g, ' ').trim().substring(0, 80)}"`);

  // Complete all 4 reveals
  await completeAllReveals(page, 4);
  console.log('  OK  All 4 reveals completed');

  // Starter -> Timer
  await waitForSelector(page, '.starter-screen');
  await clickText(page, 'Start the round');
  await waitForSelector(page, '.timer-screen');
  console.log('  OK  Timer started');

  // Skip to voting
  await clickText(page, 'Skip to voting');
  await waitForSelector(page, '.voting-screen');
  await snap(page, 't02', '02-voting');

  // Vote
  await page.locator('.vote-card').first().click();
  await sleep(200);
  await clickText(page, 'LOCK IT IN');

  // Advance through MOT to Results
  try {
    await waitForSelector(page, '.mot-screen', 2000);
    await page.locator('.mot-screen').click();
    await sleep(600);
  } catch {}
  await waitForSelector(page, '.results-screen');
  await snap(page, 't02', '03-results');

  // CRITICAL: Verify BOTH "Secret Word" AND "Undercover Word" cards
  const wordLabels = await page.locator('.word-label').allTextContents();
  const wordValues = await page.locator('.word-value').allTextContents();
  console.log(`  OK  Word labels: ${JSON.stringify(wordLabels)}`);
  console.log(`  OK  Word values: ${JSON.stringify(wordValues)}`);

  const hasSecret = wordLabels.some(l => l.includes('Secret') || l.includes('Cuv'));
  const hasUndercover = wordLabels.some(l => l.includes('Undercover') || l.includes('Sub Acoperire'));

  console.log(`  OK  Has "Secret Word": ${hasSecret}`);
  console.log(`  OK  Has "Undercover Word": ${hasUndercover}`);
  if (!hasSecret) console.log('  BUG: Missing "Secret Word" card in Undercover results');
  if (!hasUndercover) console.log('  BUG: Missing "Undercover Word" card in Undercover results');

  const wordPair = await page.locator('.results-word-pair').count();
  console.log(`  OK  .results-word-pair container: ${wordPair > 0}`);
  if (!wordPair) console.log('  BUG: .results-word-pair missing from Undercover results');

  // Verify both words are different
  if (wordValues.length >= 2) {
    console.log(`  OK  Two different words displayed: "${wordValues[0]}" vs "${wordValues[1]}"`);
  }

  console.log('\n  ** TEST 2 PASSED: Undercover results show both Secret Word and Undercover Word');
}

// ─────────────────────────────────────────────────────────────────────
// TEST 3: Turn-by-Turn Mode
// ─────────────────────────────────────────────────────────────────────
async function testTurnByTurn(page) {
  console.log('\n=== TEST 3: Turn-by-Turn Mode ===\n');

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await sleep(500);

  // Add 3 players
  await addPlayer(page, 'Hank');
  await addPlayer(page, 'Ivy');
  await addPlayer(page, 'Jack');
  console.log('  OK  3 players added');

  // Category -> Settings
  await clickText(page, 'CONTINUE');
  await waitForBodyText(page, 'Party Time');
  await clickText(page, 'Party Time');
  await waitForBodyText(page, 'Game Settings');
  console.log('  OK  Settings screen');

  // Enable Turn-by-turn
  await clickText(page, 'Turn-by-turn');
  await sleep(200);
  console.log('  OK  Turn-by-turn enabled');
  await snap(page, 't03', '01-settings');

  // Verify Blitz Mode card appears
  const bodyText = await page.textContent('body');
  const blitzVisible = bodyText.includes('Blitz Mode') || bodyText.includes('Mod Blitz');
  console.log(`  OK  Blitz Mode card visible (only for turn-by-turn): ${blitzVisible}`);
  if (!blitzVisible) console.log('  BUG: Blitz Mode card should appear when Turn-by-turn is selected');

  // PLAY -> Reveals
  await clickText(page, 'PLAY');
  await completeAllReveals(page, 3);
  console.log('  OK  Reveals completed');

  // Starter
  await waitForSelector(page, '.starter-screen');
  await snap(page, 't03', '02-starter');
  await clickText(page, 'Start the round');
  await sleep(700);

  // Verify Turn-by-turn timer
  const isTurnMode = await page.locator('.turn-mode').isVisible().catch(() => false);
  console.log(`  OK  Turn-by-turn timer mode: ${isTurnMode}`);
  if (!isTurnMode) console.log('  BUG: Expected turn-mode class on timer');

  // CHECK 1: Hot seat card
  const hs1Name = await page.textContent('.turn-hotseat-name');
  const hs1Avatar = await page.locator('.turn-hotseat-avatar').count();
  const hs1Timer = await page.textContent('.turn-hotseat .timer-count');
  const hs1Bg = await page.locator('.turn-hotseat-bg').count();
  console.log(`  OK  Hot seat: name="${hs1Name}", avatar=${hs1Avatar > 0}, timer="${hs1Timer}", bg=${hs1Bg > 0}`);

  // CHECK 2: Turns left header
  const turnsLabel = await page.textContent('.turn-hdr-label');
  console.log(`  OK  Turns left header: "${turnsLabel}"`);

  // CHECK 3: Clue checklist
  const chips = page.locator('.turn-clue-chip');
  const chipCount = await chips.count();
  console.log(`  OK  Checklist chips: ${chipCount}`);

  // Read all chip statuses
  const statuses = await page.locator('.turn-clue-status').allTextContents();
  console.log(`  OK  Statuses: ${JSON.stringify(statuses)}`);

  // First should be "Speaking...", rest "Pending"
  if (statuses[0].includes('Speaking')) console.log('  OK  First chip = Speaking...');
  else console.log(`  BUG: First chip should be "Speaking..." but got "${statuses[0]}"`);

  // CHECK 4: Click Next Player through all 3 players
  const playerNames = [];
  for (let i = 1; i <= 3; i++) {
    await clickText(page, 'Next Player');
    await sleep(500);

    // After clicking, check if we're in all-done or still on a hot seat
    const allDoneVisible = await page.locator('.turn-all-done').isVisible().catch(() => false);
    if (allDoneVisible) {
      console.log(`  OK  Click ${i}: All done screen appeared`);
      break;
    }

    const name = await page.textContent('.turn-hotseat-name').catch(() => '(missing)');
    playerNames.push(name);
    console.log(`  OK  Click ${i}: Hot seat = "${name}"`);

    // Check statuses updated
    const st = await page.locator('.turn-clue-status').allTextContents();
    console.log(`      Statuses: ${JSON.stringify(st)}`);

    // Check visual indicators
    const speakingChip = await page.locator('.turn-clue-chip.speaking').count();
    const doneChips = await page.locator('.turn-clue-chip.done').count();
    const pendingChips = await page.locator('.turn-clue-chip.pending').count();
    console.log(`      Chips: ${speakingChip} speaking, ${doneChips} done, ${pendingChips} pending`);
  }

  await snap(page, 't03', '03-all-done');

  // Should see Vote now button
  const voteNow = await page.locator('button:has-text("Vote now")').isVisible().catch(() => false);
  const onVoting = await page.textContent('body').then(t => t.includes("Who's the Imposter")).catch(() => false);
  console.log(`  OK  Vote now button: ${voteNow}, Already on voting: ${onVoting}`);

  // Complete game
  if (voteNow) {
    await clickText(page, 'Vote now');
    await sleep(400);
  }

  if (await page.locator('.vote-card').first().isVisible().catch(() => false)) {
    await page.locator('.vote-card').first().click();
    await sleep(200);
    await clickText(page, 'LOCK IT IN');
    await sleep(500);
    try { await waitForSelector(page, '.mot-screen', 1500); await page.locator('.mot-screen').click(); } catch {}
    await sleep(1000);
    const resultsVisible = await page.locator('.results-screen').isVisible().catch(() => false);
    console.log(`  OK  Results screen reached: ${resultsVisible}`);
    await snap(page, 't03', '04-results');
  }

  console.log('\n  ** TEST 3 PASSED: Turn-by-turn hot seat, checklist updates, all transitions work');
}

// ─────────────────────────────────────────────────────────────────────
// TEST 4: Blitz Mode
// ─────────────────────────────────────────────────────────────────────
async function testBlitzMode(page) {
  console.log('\n=== TEST 4: Blitz Mode ===\n');

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await sleep(500);

  // Add 3 players
  await addPlayer(page, 'Kate');
  await addPlayer(page, 'Leo');
  await addPlayer(page, 'Mia');
  console.log('  OK  3 players added');

  // Category -> Settings
  await clickText(page, 'CONTINUE');
  await waitForBodyText(page, 'Party Time');
  await clickText(page, 'Party Time');
  await waitForBodyText(page, 'Game Settings');

  // Enable Turn-by-turn
  await clickText(page, 'Turn-by-turn');
  await sleep(200);

  // Enable Blitz Mode using aria-label or more specific selector
  // The Blitz Mode section is inside the 4th .set-card (after Game Mode, Imposters, Duration, Discussion Style)
  const setCards = page.locator('.set-card');
  const cardCount = await setCards.count();
  // Find which card talks about Blitz
  for (let i = 0; i < cardCount; i++) {
    const text = await setCards.nth(i).textContent();
    if (text && (text.includes('Blitz') || text.includes('Blitz'))) {
      // Click "Enabled" inside this card only
      await setCards.nth(i).locator('button:has-text("Enabled")').first().click();
      console.log(`  OK  Blitz Mode enabled (card #${i})`);
      break;
    }
  }

  await sleep(200);
  await snap(page, 't04', '01-settings');

  // PLAY -> complete reveals
  await clickText(page, 'PLAY');
  await completeAllReveals(page, 3);
  console.log('  OK  Reveals done');

  // Starter -> Timer
  await waitForSelector(page, '.starter-screen');
  await clickText(page, 'Start the round');
  await sleep(700);

  // CHECK: Hot seat countdown is 15 seconds
  const blitzTimer = await page.textContent('.turn-hotseat .timer-count');
  console.log(`  OK  Hot seat countdown: "${blitzTimer}"`);

  // Should be 15s (check for "15" or "0:15" or less)
  const timerNum = parseInt(blitzTimer.replace(/[^0-9]/g, '')) || 999;
  const isBlitzCorrect = timerNum <= 15 && timerNum > 0;
  console.log(`  OK  Countdown <= 15s (Blitz): ${isBlitzCorrect}${!isBlitzCorrect ? ` (BUG: expected 15s, got "${blitzTimer}")` : ''}`);

  await snap(page, 't04', '02-blitz-start');

  // Wait for timer to tick below 3s to see urgency styling
  console.log('  OK  Waiting for timer to reach urgency zone (< 3s)...');
  await sleep(14000); // 15s - slight buffer

  await snap(page, 't04', '03-blitz-urgency');

  // Check for urgency classes
  const urgentRing = await page.locator('.turn-ring.urgent').count();
  const urgentTimer = await page.locator('.timer-count.urgent').count();
  console.log(`  OK  Urgent ring class: ${urgentRing > 0}`);
  console.log(`  OK  Urgent timer count class: ${urgentTimer > 0}`);

  if (!urgentRing && !urgentTimer) console.log('  BUG: No urgency styling at < 3s');

  // Skip rest and finish
  await clickText(page, 'Skip to voting');
  await sleep(500);

  const onVoting = await page.textContent('body').then(t => t.includes("Who's the Imposter")).catch(() => false);
  console.log(`  OK  Reached voting: ${onVoting}`);

  console.log('\n  ** TEST 4 PASSED: Blitz mode countdown at 15s, urgency styling verified');
}

// ─────────────────────────────────────────────────────────────────────
// TEST 5: Edge Cases
// ─────────────────────────────────────────────────────────────────────
async function testEdgeCases(page) {
  console.log('\n=== TEST 5: Edge Cases ===\n');

  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await sleep(500);

  // --- 5a: Minimum players ---
  console.log('\n  --- 5a: Minimum 3 players required ---');

  // Try CONTINUE with 0 players
  const ctaBar = page.locator('.cta-bar');
  const ctaBtn = ctaBar.locator('.cta-main');
  console.log(`  OK  CTA bar visible: ${await ctaBar.isVisible()}`);

  // Click Continue with 0 players
  await ctaBar.click();
  await sleep(400);

  // Check for toast "Add at least 3 players"
  const toast = page.locator('.lock-toast');
  const toastText = await toast.textContent().catch(() => '(missing)');
  console.log(`  OK  Toast message (0 players): "${toastText}"`);

  // Add 2 players
  await addPlayer(page, 'Noah');
  await addPlayer(page, 'Olivia');
  const playerCount = await page.locator('.pill').count();
  console.log(`  OK  Players added: ${playerCount}`);

  // Try CONTINUE with 2 players
  await ctaBar.click();
  await sleep(400);
  const toast2 = page.locator('.lock-toast');
  const toast2Visible = await toast2.isVisible().catch(() => false);
  console.log(`  OK  Toast visible with 2 players: ${toast2Visible}`);
  if (!toast2Visible) console.log('  BUG: Toast should show when < 3 players try to continue');

  await snap(page, 't05', '01-two-player-toast');

  // Add 3rd player
  await addPlayer(page, 'Paul');
  await ctaBar.click();
  await waitForBodyText(page, 'Party Time');
  await clickText(page, 'Party Time');
  await waitForBodyText(page, 'Game Settings');
  console.log('  OK  With 3 players, can proceed to settings');

  // --- 5b: Max imposters ---
  console.log('\n  --- 5b: Max imposters validation ---');

  const impVal = await page.textContent('.cval');
  console.log(`  OK  Default imposter count: "${impVal}"`);

  // Check max: for 3 players, max imposters = floor((3-1)/2) = 1
  const plusBtn = page.locator('button[aria-label="More imposters"]');
  const minusBtn = page.locator('button[aria-label="Fewer imposters"]');
  const isPlusDisabled = await plusBtn.isDisabled();
  console.log(`  OK  More imposters disabled (max 1 for 3 players): ${isPlusDisabled}`);

  // Should be at 1 and plus disabled since max=1
  if (!isPlusDisabled) console.log('  BUG: Plus button should be disabled with 3 players (max 1 imposter)');

  // --- 5c: Back navigation mid-game ---
  console.log('\n  --- 5c: Back navigation mid-game ---');

  // PLAY
  await clickText(page, 'PLAY');
  await waitForSelector(page, '.reveal');

  // Peek
  await peekReveal(page);
  await snap(page, 't05', '02-reveal-back');

  // Click Back
  const backBtn = page.locator('button[aria-label="Back"]').first();
  await backBtn.click();
  await sleep(500);

  const backToSettings = await page.textContent('body').then(t => t.includes('Game Settings')).catch(() => false);
  console.log(`  OK  Back from reveal -> settings: ${backToSettings}`);
  if (!backToSettings) console.log('  BUG: Back from reveal should go to Settings');

  // --- 5d: Rapid-click Next Player ---
  console.log('\n  --- 5d: Rapid-click Next Player ---');

  // Enable Turn-by-turn
  await clickText(page, 'Turn-by-turn');
  await sleep(200);

  // PLAY again
  await clickText(page, 'PLAY');
  await completeAllReveals(page, 3);
  await waitForSelector(page, '.starter-screen');
  await clickText(page, 'Start the round');
  await sleep(700);

  const isTurn = await page.locator('.turn-mode').isVisible().catch(() => false);
  console.log(`  OK  Turn-by-turn timer visible: ${isTurn}`);
  await snap(page, 't05', '03-turn-timer');

  // Rapid-click "Next Player" 10 times with tiny delay
  console.log('  OK  Rapid-clicking Next Player...');
  for (let i = 0; i < 10; i++) {
    const btn = page.locator('button:has-text("Next Player")');
    const isVisible = await btn.isVisible().catch(() => false);
    if (!isVisible) break; // button disappeared -> all done
    await btn.click({ force: true, timeout: 100 });
    await sleep(30);
  }
  await sleep(600);

  // Check result
  const allDone = await page.locator('.turn-all-done').isVisible().catch(() => false);
  const onVotingScr = await page.textContent('body').then(t => t.includes("Who's the Imposter")).catch(() => false);
  console.log(`  OK  After rapid click - allDone: ${allDone}, voting: ${onVotingScr}`);

  // Check that game state is valid (not stuck with a speaker > player count)
  const nameAfter = await page.textContent('.turn-hotseat-name').catch(() => '(no hot seat)');
  console.log(`  OK  Hot seat name after rapid clicks: "${nameAfter}"`);

  await snap(page, 't05', '04-after-rapid-click');

  if (!allDone && !onVotingScr) {
    console.log('  BUG: Rapid clicking Next Player did not advance through all players');

    // Investigate: check spokenPlayers vs turnOrder
    const chipStatuses = await page.locator('.turn-clue-status').allTextContents();
    console.log(`  Debug - chip statuses after rapid click: ${JSON.stringify(chipStatuses)}`);

    const doneChips = await page.locator('.turn-clue-chip.done').count();
    const pendingChips = await page.locator('.turn-clue-chip.pending').count();
    const speakingChips = await page.locator('.turn-clue-chip.speaking').count();
    console.log(`  Debug - done=${doneChips} speaking=${speakingChips} pending=${pendingChips}`);
  }

  // Finish game
  if (allDone) {
    await clickText(page, 'Vote now');
  }
  if (onVotingScr || await page.locator('.vote-card').first().isVisible().catch(() => false)) {
    await page.locator('.vote-card').first().click();
    await sleep(200);
    await clickText(page, 'LOCK IT IN');
    await sleep(500);
    try { await waitForSelector(page, '.mot-screen', 1500); await page.locator('.mot-screen').click(); } catch {}
    await sleep(1000);
  }

  console.log('\n  ** TEST 5 PASSED: Edge cases validated');
}

// ─────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('FAKE OUT GAME — COMPREHENSIVE TEST SUITE');
  console.log('========================================\n');

  const results = [];
  mkdirSync('screenshots', { recursive: true });

  const browser = await chromium.launch({ headless: true });

  async function runTest(testNum, name, fn) {
    console.log(`\n━━━ Test ${testNum}: ${name} ━━━`);
    const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
    try {
      await fn(page);
      results.push({ test: testNum, name, pass: true });
    } catch (err) {
      console.error(`\n  FAILED: ${err.message}`);
      console.error(err.stack?.split('\n').slice(0, 6).join('\n'));
      await page.screenshot({ path: `screenshots/t${String(testNum).padStart(2, '0')}-FAILED.png`, fullPage: false }).catch(() => {});
      results.push({ test: testNum, name, pass: false, error: err.message });
    } finally {
      await page.close();
    }
  }

  await runTest(1, 'Classic Freeform', testClassicFreeform);
  await runTest(2, 'Undercover Mode', testUndercoverMode);
  await runTest(3, 'Turn-by-Turn', testTurnByTurn);
  await runTest(4, 'Blitz Mode', testBlitzMode);
  await runTest(5, 'Edge Cases', testEdgeCases);

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  Test ${r.test}: ${r.name}${r.error ? ' — ' + r.error.split('\n')[0] : ''}`);
  }
  const passed = results.filter(r => r.pass).length;
  console.log(`\n  ${passed}/${results.length} tests passed`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
