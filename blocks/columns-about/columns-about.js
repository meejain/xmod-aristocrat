/**
 * columns-about block
 *
 * Original animation:
 * - Text: anim-fade-in-left (translate -200px, scale 1.15, opacity 0)
 * - Image: anim-fade-in-right (translate 200px, scale 1.15, opacity 0)
 * - Background image: rellax parallax speed 5
 *   starts at translate(0, 200px), moves to ~translate(0, -170px)
 * - Foreground image: absolute, sits over background
 * - Re-triggers on every scroll in/out
 */
export default function decorate(block) {
  // Set up image column with layered images
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pictures = col.querySelectorAll('picture');
      if (pictures.length >= 2) {
        // DOM order matches original: bg first (static), fg second (absolute on top)
        col.classList.add('columns-about-img-col');
        pictures[0].classList.add('columns-about-bg');
        pictures[1].classList.add('columns-about-fg');
        pictures[0].style.transform = 'translate3d(0, -50px, 0)';
      } else if (pictures.length === 1) {
        const onlyPics = [...col.children].every(
          (child) => child.querySelector('picture') || child.tagName === 'PICTURE',
        );
        if (onlyPics) col.classList.add('columns-about-img-col');
      }
    });
  });

  // Slide-in animation — re-triggers on enter/exit
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        block.classList.add('in-view');
      } else {
        block.classList.remove('in-view');
      }
    });
  }, { threshold: 0.1 });
  observer.observe(block);

  // Parallax on background image
  // Original rellax speed=5: translate Y ranges from +200px to -170px
  // When section enters bottom of viewport: +200px (blob pushed down)
  // When section is centered: ~0px
  // When section exits top of viewport: -170px (blob pulled up)
  const bgPic = block.querySelector('.columns-about-bg');
  if (bgPic) {
    let ticking = false;

    const updateParallax = () => {
      const rect = block.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 = section just entering bottom, 1 = section exiting top
      const progress = 1 - ((rect.bottom) / (vh + rect.height));
      // Blob starts at -50px (already above natural), moves to -550px
      const offset = -50 - (progress * 500);
      bgPic.style.transform = `translate3d(0, ${offset}px, 0)`;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });

    updateParallax();
  }
}
