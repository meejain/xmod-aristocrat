export default async function decorate(block) {
  const rows = [...block.children];
  // Row 0 is the heading row — leave it as is.
  // Rows 1-4 are stat items — wrap them in a grid container.
  const statRows = rows.slice(1);
  if (statRows.length > 0) {
    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    statRows.forEach((row) => {
      row.className = 'stats-item';
      grid.appendChild(row);
    });
    block.appendChild(grid);
  }
}
