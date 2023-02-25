/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaGFzaGVteW91c2VmaSIsImEiOiJjbDlyYjg4NnoxYmJvM3BvNm82anJscTluIn0.xFGtuXO5IJqWNYphk0xDBA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/hashemyousefi/cl9rhthtr000b15k7fztvh4x0',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 10,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current locations
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      bottom: 150,
      top: 200,
      right: 100,
      left: 100,
    },
  });
};
