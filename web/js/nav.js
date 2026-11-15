/**
 * Navbar dropdown for the public page.
 * The menu opens natively with <details>, so it still works without this file.
 * This module only adds: close on outside click, close on Escape, close after
 * choosing a link, and closing when the page is scrolled.
 */

const dropdown = document.getElementById('nav-dropdown');

if (dropdown instanceof HTMLDetailsElement) {
  const close = () => {
    dropdown.open = false;
  };

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !dropdown.open) return;
    close();
    const summary = dropdown.querySelector('summary');
    if (summary) summary.focus();
  });

  dropdown.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });

  window.addEventListener('scroll', close, { passive: true });
}
