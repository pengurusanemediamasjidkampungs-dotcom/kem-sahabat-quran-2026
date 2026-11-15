/**
 * Hero typing loop for the public page.
 *
 * Types "KSQ 2026" one character at a time, holds it, erases it and repeats
 * forever. The full word is already in index.html for search engines and
 * assistive technology: the .sr-only copy carries the accessible name and the
 * animated copy is aria-hidden.
 *
 * Behaviour:
 * - No timers at all when the visitor prefers reduced motion (static text).
 * - Nothing runs while the tab is in the background; the loop starts again
 *   when the tab becomes visible.
 * - The hidden .term-ghost copy keeps the full width, so the terminal box never
 *   changes size while characters are added or removed.
 */

const TEXT = 'KSQ 2026';
const TYPE_MS = 135;
const DELETE_MS = 70;
const HOLD_MS = 2300;
const RESTART_MS = 700;
const FIRST_HOLD_MS = 1500;

const terminal = document.querySelector('.hero-terminal');
const typed = terminal ? terminal.querySelector('.term-typed') : null;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (terminal && typed) {
  let chars = TEXT.length;
  let deleting = true;
  let timer = null;
  let running = false;

  const stop = () => {
    running = false;
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  };

  const draw = () => {
    typed.textContent = TEXT.slice(0, chars);
  };

  const schedule = (delay) => {
    if (timer !== null) window.clearTimeout(timer);
    timer = running ? window.setTimeout(tick, delay) : null;
  };

  const tick = () => {
    timer = null;
    if (!running) return;

    if (deleting) {
      chars -= 1;
      draw();
      if (chars <= 0) {
        chars = 0;
        deleting = false;
        schedule(RESTART_MS);
      } else {
        schedule(DELETE_MS);
      }
      return;
    }

    chars += 1;
    draw();
    if (chars >= TEXT.length) {
      deleting = true;
      schedule(HOLD_MS);
    } else {
      schedule(TYPE_MS);
    }
  };

  /* The page paints the full word first, then this loop erases it and types it
     again so the first frame never flashes from empty to full. */
  const start = () => {
    stop();
    chars = TEXT.length;
    deleting = true;
    running = true;
    draw();
    schedule(FIRST_HOLD_MS);
  };

  const showStatic = () => {
    stop();
    typed.textContent = TEXT;
  };

  const sync = () => {
    if (motionQuery.matches) showStatic();
    else if (document.hidden) stop();
    else start();
  };

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', sync);
  } else if (typeof motionQuery.addListener === 'function') {
    motionQuery.addListener(sync);
  }
  document.addEventListener('visibilitychange', sync);

  sync();
}
