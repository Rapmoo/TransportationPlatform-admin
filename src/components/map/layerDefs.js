// The four worker location types plotted on the GIS map. `field` / `addr` are
// the normalized worker properties produced by api/submissions.js.
export const LAYER_DEFS = [
  { key: 'home', label: 'Home locations', color: '#0E7C86', field: 'home_coords', addr: 'home_address' },
  { key: 'start', label: 'Starting transportation points', color: '#B9791F', field: 'start_point_coords', addr: 'start_point_address' },
  { key: 'boarding', label: 'Boarding points', color: '#7A4FB5', field: 'boarding_coords', addr: 'boarding_address' },
  { key: 'after_work', label: 'After-work bus boarding points', color: '#D85C3A', field: 'after_work_bus_pickup_coords', addr: 'after_work_bus_pickup_address' },
];
