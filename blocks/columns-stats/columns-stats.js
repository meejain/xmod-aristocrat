/**
 * Count-up animation for a number element.
 * Only the number text changes — label text stays static.
 */
function animateCountUp(el, target, duration) {
  const text = el.textContent.trim();
  const prefix = text.match(/^[^0-9]*/)?.[0] || '';
  const suffix = text.match(/[^0-9]*$/)?.[0] || '';
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - progress) ** 2;
    const current = Math.round(target * eased);
    el.textContent = `${prefix}${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(update);
  }

  el.textContent = `${prefix}0${suffix}`;
  requestAnimationFrame(update);
}

export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const columns = [...row.children];

  // Build progress bar
  const bar = document.createElement('div');
  bar.classList.add('columns-stats-bar');
  columns.forEach((_, i) => {
    const segment = document.createElement('div');
    segment.classList.add('columns-stats-bar-segment');
    segment.dataset.index = i;
    bar.append(segment);
  });
  block.insertBefore(bar, row);

  // Parse target values from each column's <strong>
  const stats = columns.map((col) => {
    const strong = col.querySelector('strong');
    if (!strong) return { el: col, strong: null, target: 0 };
    const text = strong.textContent.trim();
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    return { el: col, strong, target: num };
  });

  const segments = bar.querySelectorAll('.columns-stats-bar-segment');

  /*
   * Hide ONLY the number <strong>, NOT the label.
   * Labels ("people", "Locations") are always visible.
   * Numbers start at scale(0) opacity(0) — matching GSAP.
   */
  stats.forEach((stat) => {
    if (stat.strong) {
      stat.strong.style.opacity = '0';
      stat.strong.style.transform = 'scale(0)';
    }
  });

  let animated = false;

  function runSequence() {
    if (animated) return;
    animated = true;

    let delay = 0;

    stats.forEach((stat, i) => {
      // Number pops in (scale 0→1, opacity 0→1)
      setTimeout(() => {
        if (stat.strong) {
          const s = stat.strong.style;
          s.transition = 'opacity 0.4s ease, transform 0.4s ease';
          s.opacity = '1';
          s.transform = 'scale(1)';
        }
      }, delay);

      // Bar segment grows (width 0→25%)
      setTimeout(() => {
        if (segments[i]) segments[i].classList.add('active');
      }, delay + 200);

      // Counter counts up (overlaps bar)
      setTimeout(() => {
        if (stat.strong) {
          animateCountUp(stat.strong, stat.target, 500);
        }
      }, delay + 350);

      delay += 800;
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runSequence();
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });

  observer.observe(block);
}
