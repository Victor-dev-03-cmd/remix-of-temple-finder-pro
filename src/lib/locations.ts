// Multi-country Provinces/States and Districts data

export const locationsByCountry: Record<string, {
  provinces: { id: string; name: string }[];
  districts: Record<string, { id: string; name: string }[]>;
}> = {
  LK: {
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
  },
  MY: {
    provinces: [
      { id: 'johor', name: 'Johor' },
      { id: 'kedah', name: 'Kedah' },
      { id: 'kelantan', name: 'Kelantan' },
      { id: 'melaka', name: 'Melaka' },
      { id: 'negeri-sembilan', name: 'Negeri Sembilan' },
      { id: 'pahang', name: 'Pahang' },
      { id: 'penang', name: 'Penang' },
      { id: 'perak', name: 'Perak' },
      { id: 'perlis', name: 'Perlis' },
      { id: 'sabah', name: 'Sabah' },
      { id: 'sarawak', name: 'Sarawak' },
      { id: 'selangor', name: 'Selangor' },
      { id: 'terengganu', name: 'Terengganu' },
      { id: 'kuala-lumpur', name: 'Kuala Lumpur' },
    ],
    districts: {
      'johor': [
        { id: 'johor-bahru', name: 'Johor Bahru' },
        { id: 'batu-pahat', name: 'Batu Pahat' },
        { id: 'muar', name: 'Muar' },
      ],
      'selangor': [
        { id: 'petaling', name: 'Petaling' },
        { id: 'klang', name: 'Klang' },
        { id: 'gombak', name: 'Gombak' },
      ],
      'penang': [
        { id: 'george-town', name: 'George Town' },
        { id: 'butterworth', name: 'Butterworth' },
      ],
      'perak': [
        { id: 'ipoh', name: 'Ipoh' },
        { id: 'taiping', name: 'Taiping' },
      ],
      'kuala-lumpur': [
        { id: 'kl-city', name: 'KL City' },
        { id: 'brickfields', name: 'Brickfields' },
      ],
    },
  },
  IN: {
    provinces: [
      { id: 'tamil-nadu', name: 'Tamil Nadu' },
      { id: 'kerala', name: 'Kerala' },
      { id: 'karnataka', name: 'Karnataka' },
      { id: 'andhra-pradesh', name: 'Andhra Pradesh' },
      { id: 'telangana', name: 'Telangana' },
      { id: 'maharashtra', name: 'Maharashtra' },
      { id: 'gujarat', name: 'Gujarat' },
      { id: 'rajasthan', name: 'Rajasthan' },
      { id: 'uttar-pradesh', name: 'Uttar Pradesh' },
      { id: 'west-bengal', name: 'West Bengal' },
    ],
    districts: {
      'tamil-nadu': [
        { id: 'chennai', name: 'Chennai' },
        { id: 'madurai', name: 'Madurai' },
        { id: 'coimbatore', name: 'Coimbatore' },
        { id: 'thanjavur', name: 'Thanjavur' },
      ],
      'kerala': [
        { id: 'thiruvananthapuram', name: 'Thiruvananthapuram' },
        { id: 'kochi', name: 'Kochi' },
        { id: 'thrissur', name: 'Thrissur' },
      ],
      'karnataka': [
        { id: 'bangalore', name: 'Bangalore' },
        { id: 'mysore', name: 'Mysore' },
        { id: 'mangalore', name: 'Mangalore' },
      ],
      'andhra-pradesh': [
        { id: 'tirupati', name: 'Tirupati' },
        { id: 'vijayawada', name: 'Vijayawada' },
        { id: 'visakhapatnam', name: 'Visakhapatnam' },
      ],
      'maharashtra': [
        { id: 'mumbai', name: 'Mumbai' },
        { id: 'pune', name: 'Pune' },
        { id: 'nashik', name: 'Nashik' },
      ],
    },
  },
  SG: {
    provinces: [
      { id: 'central', name: 'Central Region' },
      { id: 'east', name: 'East Region' },
      { id: 'north', name: 'North Region' },
      { id: 'north-east', name: 'North-East Region' },
      { id: 'west', name: 'West Region' },
    ],
    districts: {
      'central': [
        { id: 'orchard', name: 'Orchard' },
        { id: 'downtown', name: 'Downtown Core' },
        { id: 'little-india', name: 'Little India' },
      ],
      'east': [
        { id: 'bedok', name: 'Bedok' },
        { id: 'tampines', name: 'Tampines' },
      ],
      'north': [
        { id: 'woodlands', name: 'Woodlands' },
        { id: 'yishun', name: 'Yishun' },
      ],
    },
  },
  TH: {
    provinces: [
      { id: 'bangkok', name: 'Bangkok' },
      { id: 'chiang-mai', name: 'Chiang Mai' },
      { id: 'phuket', name: 'Phuket' },
      { id: 'chonburi', name: 'Chonburi' },
      { id: 'nakhon-ratchasima', name: 'Nakhon Ratchasima' },
    ],
    districts: {
      'bangkok': [
        { id: 'phra-nakhon', name: 'Phra Nakhon' },
        { id: 'bang-rak', name: 'Bang Rak' },
        { id: 'silom', name: 'Silom' },
      ],
      'chiang-mai': [
        { id: 'mueang', name: 'Mueang Chiang Mai' },
        { id: 'san-kamphaeng', name: 'San Kamphaeng' },
      ],
    },
  },
};

// Legacy export for backward compatibility
export const sriLankaLocations = locationsByCountry.LK;

export type Province = { id: string; name: string };
export type DistrictMap = Record<string, { id: string; name: string }[]>;

// Helper function to get locations for a country
export function getLocationsForCountry(countryCode: string) {
  return locationsByCountry[countryCode] || locationsByCountry.LK;
}
