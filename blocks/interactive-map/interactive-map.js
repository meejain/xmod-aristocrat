export default async function decorate(block) {
  const rows = [...block.children];
  const headingRow = rows[0];
  const locationRows = rows.slice(1);

  // Extract location data from authored rows
  const locations = locationRows.map((row) => {
    const cells = [...row.children];
    const img = cells[0]?.querySelector('img');
    const cityName = cells[1]?.textContent?.trim() || '';
    return { img, cityName, row };
  });

  // Hide authored location rows (content extracted above)
  locationRows.forEach((row) => {
    row.classList.add('location-row');
  });

  // Fetch and inject the SVG map
  const mapContainer = document.createElement('div');
  mapContainer.className = 'map-svg-container';

  try {
    const resp = await fetch(`${window.hlx?.codeBasePath || ''}/drafts/images/world-map.svg`);
    if (resp.ok) {
      const svgText = await resp.text();
      mapContainer.innerHTML = svgText;
    }
  } catch (e) {
    // Fallback: no map SVG available
    mapContainer.innerHTML = '<p style="text-align:center;padding:40px;">World map loading...</p>';
  }
  block.appendChild(mapContainer);

  // Create character overlays
  const overlayContainer = document.createElement('div');
  overlayContainer.style.cssText = 'position:relative;';
  mapContainer.style.position = 'relative';

  locations.forEach((loc) => {
    if (!loc.img) return;
    const overlay = document.createElement('div');
    overlay.className = 'character-overlay';
    overlay.dataset.city = loc.cityName.toLowerCase().replace(/\s+/g, '-');
    const img = document.createElement('img');
    img.src = loc.img.src;
    img.alt = loc.img.alt || `${loc.cityName} character`;
    img.loading = 'lazy';
    overlay.appendChild(img);
    mapContainer.appendChild(overlay);
  });

  // Map city names to approximate SVG pin positions (normalized 0-1 relative to viewBox)
  const cityPins = {
    london: { x: 0.427, y: 0.362 },
    lviv: { x: 0.478, y: 0.324 },
    'tel-aviv': { x: 0.508, y: 0.43 },
    noida: { x: 0.574, y: 0.422 },
    macau: { x: 0.649, y: 0.477 },
    sydney: { x: 0.734, y: 0.686 },
    auckland: { x: 0.782, y: 0.676 },
    montreal: { x: 0.208, y: 0.383 },
    'las-vegas': { x: 0.151, y: 0.42 },
    seattle: { x: 0.136, y: 0.374 },
    oakland: { x: 0.126, y: 0.43 },
    tulsa: { x: 0.187, y: 0.42 },
    malta: { x: 0.453, y: 0.386 },
    skopje: { x: 0.475, y: 0.371 },
  };

  // Add interactive pin markers on the SVG
  const svg = mapContainer.querySelector('svg');
  if (svg) {
    const vb = svg.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 1925, 1170];
    const svgNS = 'http://www.w3.org/2000/svg';

    // Create a group for our custom interactive pins
    const pinsGroup = document.createElementNS(svgNS, 'g');
    pinsGroup.setAttribute('id', 'interactive-pins');

    Object.entries(cityPins).forEach(([city, pos]) => {
      const cx = vb[0] + pos.x * vb[2];
      const cy = vb[1] + pos.y * vb[3];

      const g = document.createElementNS(svgNS, 'g');
      g.classList.add('map-pin');
      g.dataset.city = city;
      g.style.cursor = 'pointer';

      // Teardrop pin shape
      const path = document.createElementNS(svgNS, 'path');
      const r = 12;
      path.setAttribute('d', `M${cx},${cy - r * 2.5} C${cx - r},${cy - r * 2.5} ${cx - r},${cy - r} ${cx},${cy} C${cx + r},${cy - r} ${cx + r},${cy - r * 2.5} ${cx},${cy - r * 2.5} Z`);
      path.setAttribute('fill', '#FF56C0');

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy - r * 1.8);
      circle.setAttribute('r', r * 0.6);
      circle.setAttribute('fill', '#FFFFFF');

      g.appendChild(path);
      g.appendChild(circle);
      pinsGroup.appendChild(g);
    });

    svg.appendChild(pinsGroup);

    // Create city label tooltip
    const cityLabel = document.createElement('div');
    cityLabel.className = 'city-label';
    mapContainer.appendChild(cityLabel);

    // Hover interaction
    let activeCity = null;

    const showCity = (cityKey) => {
      if (activeCity === cityKey) return;
      activeCity = cityKey;

      // Show character overlay
      mapContainer.querySelectorAll('.character-overlay').forEach((o) => {
        o.classList.toggle('active', o.dataset.city === cityKey);
      });

      // Show city label
      const pin = cityPins[cityKey];
      if (pin) {
        const svgRect = svg.getBoundingClientRect();
        const labelX = pin.x * svgRect.width;
        const labelY = pin.y * svgRect.height - 40;
        cityLabel.textContent = cityKey.replace(/-/g, ' ').toUpperCase();
        cityLabel.style.left = `${labelX}px`;
        cityLabel.style.top = `${labelY}px`;
        cityLabel.classList.add('visible');
      }
    };

    const hideCity = () => {
      activeCity = null;
      mapContainer.querySelectorAll('.character-overlay').forEach((o) => {
        o.classList.remove('active');
      });
      cityLabel.classList.remove('visible');
    };

    // Attach event listeners to pin groups
    pinsGroup.querySelectorAll('.map-pin').forEach((pin) => {
      pin.addEventListener('mouseenter', () => showCity(pin.dataset.city));
      pin.addEventListener('mouseleave', hideCity);
    });

    // Also attach to existing SVG circles (original pins)
    svg.querySelectorAll('#Layer_1-2 > g').forEach((g) => {
      const circles = g.querySelectorAll('circle');
      if (circles.length > 0) {
        // Try to find the closest city based on position
        const firstCircle = circles[0];
        const cx2 = parseFloat(firstCircle.getAttribute('cx'));
        const cy2 = parseFloat(firstCircle.getAttribute('cy'));

        let closestCity = null;
        let closestDist = Infinity;
        Object.entries(cityPins).forEach(([city2, pos2]) => {
          const px = vb[0] + pos2.x * vb[2];
          const py = vb[1] + pos2.y * vb[3];
          const dist = Math.sqrt((cx2 - px) ** 2 + (cy2 - py) ** 2);
          if (dist < closestDist && dist < 100) {
            closestDist = dist;
            closestCity = city2;
          }
        });

        if (closestCity) {
          g.style.cursor = 'pointer';
          g.addEventListener('mouseenter', () => showCity(closestCity));
          g.addEventListener('mouseleave', hideCity);
        }
      }
    });
  }
}
