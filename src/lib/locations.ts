// Sri Lanka Provinces and Districts data
export const sriLankaLocations = {
  provinces: [
    { id: 'western', name: 'Western Province' },
    { id: 'central', name: 'Central Province' },
    { id: 'southern', name: 'Southern Province' },
    { id: 'northern', name: 'Northern Province' },
    { id: 'eastern', name: 'Eastern Province' },
    { id: 'north-western', name: 'North Western Province' },
    { id: 'north-central', name: 'North Central Province' },
    { id: 'uva', name: 'Uva Province' },
    { id: 'sabaragamuwa', name: 'Sabaragamuwa Province' },
  ],
  districts: {
    'western': [
      { id: 'colombo', name: 'Colombo' },
      { id: 'gampaha', name: 'Gampaha' },
      { id: 'kalutara', name: 'Kalutara' },
    ],
    'central': [
      { id: 'kandy', name: 'Kandy' },
      { id: 'matale', name: 'Matale' },
      { id: 'nuwara-eliya', name: 'Nuwara Eliya' },
    ],
    'southern': [
      { id: 'galle', name: 'Galle' },
      { id: 'matara', name: 'Matara' },
      { id: 'hambantota', name: 'Hambantota' },
    ],
    'northern': [
      { id: 'jaffna', name: 'Jaffna' },
      { id: 'kilinochchi', name: 'Kilinochchi' },
      { id: 'mannar', name: 'Mannar' },
      { id: 'mullaitivu', name: 'Mullaitivu' },
      { id: 'vavuniya', name: 'Vavuniya' },
    ],
    'eastern': [
      { id: 'trincomalee', name: 'Trincomalee' },
      { id: 'batticaloa', name: 'Batticaloa' },
      { id: 'ampara', name: 'Ampara' },
    ],
    'north-western': [
      { id: 'kurunegala', name: 'Kurunegala' },
      { id: 'puttalam', name: 'Puttalam' },
    ],
    'north-central': [
      { id: 'anuradhapura', name: 'Anuradhapura' },
      { id: 'polonnaruwa', name: 'Polonnaruwa' },
    ],
    'uva': [
      { id: 'badulla', name: 'Badulla' },
      { id: 'monaragala', name: 'Monaragala' },
    ],
    'sabaragamuwa': [
      { id: 'ratnapura', name: 'Ratnapura' },
      { id: 'kegalle', name: 'Kegalle' },
    ],
  },
} as const;

export type Province = typeof sriLankaLocations.provinces[number];
export type DistrictMap = typeof sriLankaLocations.districts;
