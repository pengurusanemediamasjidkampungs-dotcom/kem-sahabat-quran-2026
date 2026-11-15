/**
 * Poster section controller.
 * Handles share button for the poster.
 */
import { t } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.getElementById('poster-share');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: t('poster.shareTitle'),
      text: t('poster.shareText'),
      url: window.location.origin + '/KSQ-2026-poster.html'
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // User cancelled or error - silent fail
        if (e.name !== 'AbortError') {
          console.warn('Share failed:', e);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert(t('poster.shareCopied') || 'Pautan poster disalin ke clipboard.');
      } catch (e) {
        alert(t('poster.shareFailed') || 'Kongsi tidak disokong. Sila salin pautan manual.');
      }
    }
  });
});