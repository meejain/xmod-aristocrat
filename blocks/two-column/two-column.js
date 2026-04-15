export default async function decorate(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    const cells = [...row.children];
    // Mark the text and image cells for CSS targeting
    if (cells.length === 2) {
      cells[0].classList.add('two-column-text');
      cells[1].classList.add('two-column-image');
    }
  });
}
