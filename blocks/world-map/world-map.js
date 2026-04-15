export default async function decorate(block) {
  // Fetch the SVG world map
  const resp = await fetch('/icons/world-map.svg');
  if (!resp.ok) return;

  const svgText = await resp.text();
  const mapContainer = document.createElement('div');
  mapContainer.className = 'world-map-container';
  mapContainer.innerHTML = svgText;

  const svg = mapContainer.querySelector('svg');
  if (svg) {
    svg.removeAttribute('width');
    svg.removeAttribute('height');
  }

  block.textContent = '';
  block.append(mapContainer);
}
