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
      { id: 'putrajaya', name: 'Putrajaya' },
      { id: 'labuan', name: 'Labuan' },
    ],
    districts: {
      'johor': [
        { id: 'johor-bahru', name: 'Johor Bahru' },
        { id: 'batu-pahat', name: 'Batu Pahat' },
        { id: 'muar', name: 'Muar' },
        { id: 'kluang', name: 'Kluang' },
        { id: 'pontian', name: 'Pontian' },
      ],
      'selangor': [
        { id: 'petaling', name: 'Petaling' },
        { id: 'klang', name: 'Klang' },
        { id: 'gombak', name: 'Gombak' },
        { id: 'hulu-langat', name: 'Hulu Langat' },
        { id: 'sepang', name: 'Sepang' },
      ],
      'penang': [
        { id: 'george-town', name: 'George Town' },
        { id: 'butterworth', name: 'Butterworth' },
        { id: 'bayan-lepas', name: 'Bayan Lepas' },
        { id: 'bukit-mertajam', name: 'Bukit Mertajam' },
      ],
      'perak': [
        { id: 'ipoh', name: 'Ipoh' },
        { id: 'taiping', name: 'Taiping' },
        { id: 'teluk-intan', name: 'Teluk Intan' },
        { id: 'lumut', name: 'Lumut' },
      ],
      'kuala-lumpur': [
        { id: 'kl-city', name: 'KL City Centre' },
        { id: 'brickfields', name: 'Brickfields' },
        { id: 'cheras', name: 'Cheras' },
        { id: 'kepong', name: 'Kepong' },
      ],
      'kedah': [
        { id: 'alor-setar', name: 'Alor Setar' },
        { id: 'sungai-petani', name: 'Sungai Petani' },
        { id: 'kulim', name: 'Kulim' },
      ],
      'pahang': [
        { id: 'kuantan', name: 'Kuantan' },
        { id: 'temerloh', name: 'Temerloh' },
        { id: 'cameron-highlands', name: 'Cameron Highlands' },
      ],
      'negeri-sembilan': [
        { id: 'seremban', name: 'Seremban' },
        { id: 'port-dickson', name: 'Port Dickson' },
      ],
      'melaka': [
        { id: 'melaka-city', name: 'Melaka City' },
        { id: 'alor-gajah', name: 'Alor Gajah' },
      ],
      'sabah': [
        { id: 'kota-kinabalu', name: 'Kota Kinabalu' },
        { id: 'sandakan', name: 'Sandakan' },
        { id: 'tawau', name: 'Tawau' },
      ],
      'sarawak': [
        { id: 'kuching', name: 'Kuching' },
        { id: 'miri', name: 'Miri' },
        { id: 'sibu', name: 'Sibu' },
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
      { id: 'odisha', name: 'Odisha' },
      { id: 'madhya-pradesh', name: 'Madhya Pradesh' },
      { id: 'bihar', name: 'Bihar' },
      { id: 'delhi', name: 'Delhi' },
    ],
    districts: {
      'tamil-nadu': [
        { id: 'chennai', name: 'Chennai' },
        { id: 'madurai', name: 'Madurai' },
        { id: 'coimbatore', name: 'Coimbatore' },
        { id: 'thanjavur', name: 'Thanjavur' },
        { id: 'tiruchirappalli', name: 'Tiruchirappalli' },
        { id: 'kanchipuram', name: 'Kanchipuram' },
      ],
      'kerala': [
        { id: 'thiruvananthapuram', name: 'Thiruvananthapuram' },
        { id: 'kochi', name: 'Kochi' },
        { id: 'thrissur', name: 'Thrissur' },
        { id: 'kozhikode', name: 'Kozhikode' },
        { id: 'palakkad', name: 'Palakkad' },
      ],
      'karnataka': [
        { id: 'bangalore', name: 'Bangalore' },
        { id: 'mysore', name: 'Mysore' },
        { id: 'mangalore', name: 'Mangalore' },
        { id: 'hubli', name: 'Hubli' },
        { id: 'belgaum', name: 'Belgaum' },
      ],
      'andhra-pradesh': [
        { id: 'tirupati', name: 'Tirupati' },
        { id: 'vijayawada', name: 'Vijayawada' },
        { id: 'visakhapatnam', name: 'Visakhapatnam' },
        { id: 'guntur', name: 'Guntur' },
      ],
      'telangana': [
        { id: 'hyderabad', name: 'Hyderabad' },
        { id: 'warangal', name: 'Warangal' },
        { id: 'karimnagar', name: 'Karimnagar' },
      ],
      'maharashtra': [
        { id: 'mumbai', name: 'Mumbai' },
        { id: 'pune', name: 'Pune' },
        { id: 'nashik', name: 'Nashik' },
        { id: 'nagpur', name: 'Nagpur' },
        { id: 'shirdi', name: 'Shirdi' },
      ],
      'gujarat': [
        { id: 'ahmedabad', name: 'Ahmedabad' },
        { id: 'vadodara', name: 'Vadodara' },
        { id: 'surat', name: 'Surat' },
        { id: 'dwarka', name: 'Dwarka' },
      ],
      'rajasthan': [
        { id: 'jaipur', name: 'Jaipur' },
        { id: 'udaipur', name: 'Udaipur' },
        { id: 'jodhpur', name: 'Jodhpur' },
        { id: 'pushkar', name: 'Pushkar' },
      ],
      'uttar-pradesh': [
        { id: 'varanasi', name: 'Varanasi' },
        { id: 'lucknow', name: 'Lucknow' },
        { id: 'ayodhya', name: 'Ayodhya' },
        { id: 'mathura', name: 'Mathura' },
        { id: 'vrindavan', name: 'Vrindavan' },
      ],
      'west-bengal': [
        { id: 'kolkata', name: 'Kolkata' },
        { id: 'howrah', name: 'Howrah' },
        { id: 'darjeeling', name: 'Darjeeling' },
      ],
      'odisha': [
        { id: 'puri', name: 'Puri' },
        { id: 'bhubaneswar', name: 'Bhubaneswar' },
        { id: 'konark', name: 'Konark' },
      ],
      'delhi': [
        { id: 'new-delhi', name: 'New Delhi' },
        { id: 'south-delhi', name: 'South Delhi' },
        { id: 'north-delhi', name: 'North Delhi' },
      ],
    },
  },
  ID: {
    provinces: [
      { id: 'bali', name: 'Bali' },
      { id: 'java-barat', name: 'West Java' },
      { id: 'java-tengah', name: 'Central Java' },
      { id: 'java-timur', name: 'East Java' },
      { id: 'dki-jakarta', name: 'DKI Jakarta' },
      { id: 'yogyakarta', name: 'Yogyakarta' },
      { id: 'sumatera-utara', name: 'North Sumatra' },
      { id: 'sumatera-barat', name: 'West Sumatra' },
      { id: 'lampung', name: 'Lampung' },
      { id: 'kalimantan-barat', name: 'West Kalimantan' },
      { id: 'sulawesi-selatan', name: 'South Sulawesi' },
    ],
    districts: {
      'bali': [
        { id: 'denpasar', name: 'Denpasar' },
        { id: 'badung', name: 'Badung' },
        { id: 'gianyar', name: 'Gianyar' },
        { id: 'tabanan', name: 'Tabanan' },
        { id: 'ubud', name: 'Ubud' },
        { id: 'klungkung', name: 'Klungkung' },
      ],
      'java-barat': [
        { id: 'bandung', name: 'Bandung' },
        { id: 'bogor', name: 'Bogor' },
        { id: 'bekasi', name: 'Bekasi' },
        { id: 'depok', name: 'Depok' },
      ],
      'java-tengah': [
        { id: 'semarang', name: 'Semarang' },
        { id: 'solo', name: 'Solo' },
        { id: 'magelang', name: 'Magelang' },
      ],
      'java-timur': [
        { id: 'surabaya', name: 'Surabaya' },
        { id: 'malang', name: 'Malang' },
        { id: 'kediri', name: 'Kediri' },
      ],
      'dki-jakarta': [
        { id: 'jakarta-pusat', name: 'Central Jakarta' },
        { id: 'jakarta-selatan', name: 'South Jakarta' },
        { id: 'jakarta-barat', name: 'West Jakarta' },
        { id: 'jakarta-timur', name: 'East Jakarta' },
        { id: 'jakarta-utara', name: 'North Jakarta' },
      ],
      'yogyakarta': [
        { id: 'yogya-city', name: 'Yogyakarta City' },
        { id: 'sleman', name: 'Sleman' },
        { id: 'bantul', name: 'Bantul' },
      ],
      'sumatera-utara': [
        { id: 'medan', name: 'Medan' },
        { id: 'binjai', name: 'Binjai' },
        { id: 'pematangsiantar', name: 'Pematangsiantar' },
      ],
    },
  },
  NP: {
    provinces: [
      { id: 'bagmati', name: 'Bagmati Province' },
      { id: 'gandaki', name: 'Gandaki Province' },
      { id: 'lumbini', name: 'Lumbini Province' },
      { id: 'koshi', name: 'Koshi Province' },
      { id: 'madhesh', name: 'Madhesh Province' },
      { id: 'karnali', name: 'Karnali Province' },
      { id: 'sudurpashchim', name: 'Sudurpashchim Province' },
    ],
    districts: {
      'bagmati': [
        { id: 'kathmandu', name: 'Kathmandu' },
        { id: 'lalitpur', name: 'Lalitpur' },
        { id: 'bhaktapur', name: 'Bhaktapur' },
        { id: 'kavrepalanchok', name: 'Kavrepalanchok' },
      ],
      'gandaki': [
        { id: 'kaski', name: 'Kaski (Pokhara)' },
        { id: 'lamjung', name: 'Lamjung' },
        { id: 'mustang', name: 'Mustang' },
        { id: 'manang', name: 'Manang' },
      ],
      'lumbini': [
        { id: 'rupandehi', name: 'Rupandehi' },
        { id: 'kapilvastu', name: 'Kapilvastu' },
        { id: 'palpa', name: 'Palpa' },
      ],
      'koshi': [
        { id: 'morang', name: 'Morang' },
        { id: 'sunsari', name: 'Sunsari' },
        { id: 'jhapa', name: 'Jhapa' },
      ],
      'madhesh': [
        { id: 'janakpur', name: 'Janakpur' },
        { id: 'dhanusha', name: 'Dhanusha' },
        { id: 'siraha', name: 'Siraha' },
      ],
    },
  },
  MM: {
    provinces: [
      { id: 'yangon', name: 'Yangon Region' },
      { id: 'mandalay', name: 'Mandalay Region' },
      { id: 'sagaing', name: 'Sagaing Region' },
      { id: 'bago', name: 'Bago Region' },
      { id: 'mon', name: 'Mon State' },
      { id: 'shan', name: 'Shan State' },
      { id: 'kachin', name: 'Kachin State' },
      { id: 'kayah', name: 'Kayah State' },
      { id: 'kayin', name: 'Kayin State' },
      { id: 'rakhine', name: 'Rakhine State' },
    ],
    districts: {
      'yangon': [
        { id: 'yangon-city', name: 'Yangon City' },
        { id: 'thanlyin', name: 'Thanlyin' },
        { id: 'insein', name: 'Insein' },
      ],
      'mandalay': [
        { id: 'mandalay-city', name: 'Mandalay City' },
        { id: 'amarapura', name: 'Amarapura' },
        { id: 'pyin-oo-lwin', name: 'Pyin Oo Lwin' },
      ],
      'sagaing': [
        { id: 'sagaing-city', name: 'Sagaing City' },
        { id: 'monywa', name: 'Monywa' },
        { id: 'shwebo', name: 'Shwebo' },
      ],
      'bago': [
        { id: 'bago-city', name: 'Bago City' },
        { id: 'pyay', name: 'Pyay' },
      ],
      'mon': [
        { id: 'mawlamyine', name: 'Mawlamyine' },
        { id: 'thaton', name: 'Thaton' },
      ],
      'shan': [
        { id: 'taunggyi', name: 'Taunggyi' },
        { id: 'inle', name: 'Inle Lake' },
        { id: 'kengtung', name: 'Kengtung' },
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
        { id: 'chinatown', name: 'Chinatown' },
        { id: 'marina-bay', name: 'Marina Bay' },
      ],
      'east': [
        { id: 'bedok', name: 'Bedok' },
        { id: 'tampines', name: 'Tampines' },
        { id: 'pasir-ris', name: 'Pasir Ris' },
        { id: 'changi', name: 'Changi' },
      ],
      'north': [
        { id: 'woodlands', name: 'Woodlands' },
        { id: 'yishun', name: 'Yishun' },
        { id: 'sembawang', name: 'Sembawang' },
      ],
      'north-east': [
        { id: 'serangoon', name: 'Serangoon' },
        { id: 'hougang', name: 'Hougang' },
        { id: 'punggol', name: 'Punggol' },
        { id: 'sengkang', name: 'Sengkang' },
      ],
      'west': [
        { id: 'jurong', name: 'Jurong' },
        { id: 'clementi', name: 'Clementi' },
        { id: 'bukit-batok', name: 'Bukit Batok' },
      ],
    },
  },
  TH: {
    provinces: [
      { id: 'bangkok', name: 'Bangkok' },
      { id: 'chiang-mai', name: 'Chiang Mai' },
      { id: 'chiang-rai', name: 'Chiang Rai' },
      { id: 'phuket', name: 'Phuket' },
      { id: 'chonburi', name: 'Chonburi' },
      { id: 'nakhon-ratchasima', name: 'Nakhon Ratchasima' },
      { id: 'khon-kaen', name: 'Khon Kaen' },
      { id: 'ayutthaya', name: 'Ayutthaya' },
      { id: 'sukhothai', name: 'Sukhothai' },
      { id: 'krabi', name: 'Krabi' },
    ],
    districts: {
      'bangkok': [
        { id: 'phra-nakhon', name: 'Phra Nakhon' },
        { id: 'bang-rak', name: 'Bang Rak' },
        { id: 'silom', name: 'Silom' },
        { id: 'sukhumvit', name: 'Sukhumvit' },
        { id: 'thonburi', name: 'Thonburi' },
      ],
      'chiang-mai': [
        { id: 'mueang-cm', name: 'Mueang Chiang Mai' },
        { id: 'san-kamphaeng', name: 'San Kamphaeng' },
        { id: 'doi-suthep', name: 'Doi Suthep' },
        { id: 'hang-dong', name: 'Hang Dong' },
      ],
      'phuket': [
        { id: 'mueang-phuket', name: 'Mueang Phuket' },
        { id: 'patong', name: 'Patong' },
        { id: 'kata', name: 'Kata' },
      ],
      'chonburi': [
        { id: 'pattaya', name: 'Pattaya' },
        { id: 'si-racha', name: 'Si Racha' },
        { id: 'bang-lamung', name: 'Bang Lamung' },
      ],
      'ayutthaya': [
        { id: 'mueang-ayutthaya', name: 'Ayutthaya City' },
        { id: 'bang-pa-in', name: 'Bang Pa-in' },
      ],
    },
  },
  BD: {
    provinces: [
      { id: 'dhaka', name: 'Dhaka Division' },
      { id: 'chittagong', name: 'Chittagong Division' },
      { id: 'rajshahi', name: 'Rajshahi Division' },
      { id: 'khulna', name: 'Khulna Division' },
      { id: 'sylhet', name: 'Sylhet Division' },
      { id: 'rangpur', name: 'Rangpur Division' },
      { id: 'barisal', name: 'Barisal Division' },
      { id: 'mymensingh', name: 'Mymensingh Division' },
    ],
    districts: {
      'dhaka': [
        { id: 'dhaka-city', name: 'Dhaka City' },
        { id: 'gazipur', name: 'Gazipur' },
        { id: 'narayanganj', name: 'Narayanganj' },
        { id: 'munshiganj', name: 'Munshiganj' },
      ],
      'chittagong': [
        { id: 'chittagong-city', name: 'Chittagong City' },
        { id: 'coxs-bazar', name: "Cox's Bazar" },
        { id: 'comilla', name: 'Comilla' },
      ],
      'rajshahi': [
        { id: 'rajshahi-city', name: 'Rajshahi City' },
        { id: 'bogra', name: 'Bogra' },
        { id: 'pabna', name: 'Pabna' },
      ],
      'khulna': [
        { id: 'khulna-city', name: 'Khulna City' },
        { id: 'jessore', name: 'Jessore' },
        { id: 'satkhira', name: 'Satkhira' },
      ],
      'sylhet': [
        { id: 'sylhet-city', name: 'Sylhet City' },
        { id: 'moulvibazar', name: 'Moulvibazar' },
      ],
    },
  },
  PK: {
    provinces: [
      { id: 'punjab', name: 'Punjab' },
      { id: 'sindh', name: 'Sindh' },
      { id: 'kpk', name: 'Khyber Pakhtunkhwa' },
      { id: 'balochistan', name: 'Balochistan' },
      { id: 'islamabad', name: 'Islamabad Capital Territory' },
    ],
    districts: {
      'punjab': [
        { id: 'lahore', name: 'Lahore' },
        { id: 'faisalabad', name: 'Faisalabad' },
        { id: 'rawalpindi', name: 'Rawalpindi' },
        { id: 'multan', name: 'Multan' },
      ],
      'sindh': [
        { id: 'karachi', name: 'Karachi' },
        { id: 'hyderabad', name: 'Hyderabad' },
        { id: 'sukkur', name: 'Sukkur' },
      ],
      'kpk': [
        { id: 'peshawar', name: 'Peshawar' },
        { id: 'abbottabad', name: 'Abbottabad' },
        { id: 'mardan', name: 'Mardan' },
      ],
      'islamabad': [
        { id: 'islamabad-city', name: 'Islamabad City' },
      ],
    },
  },
  PH: {
    provinces: [
      { id: 'ncr', name: 'Metro Manila' },
      { id: 'cebu', name: 'Cebu' },
      { id: 'davao', name: 'Davao Region' },
      { id: 'iloilo', name: 'Iloilo' },
      { id: 'pampanga', name: 'Pampanga' },
      { id: 'cavite', name: 'Cavite' },
      { id: 'laguna', name: 'Laguna' },
    ],
    districts: {
      'ncr': [
        { id: 'manila', name: 'Manila' },
        { id: 'quezon-city', name: 'Quezon City' },
        { id: 'makati', name: 'Makati' },
        { id: 'pasig', name: 'Pasig' },
        { id: 'taguig', name: 'Taguig' },
      ],
      'cebu': [
        { id: 'cebu-city', name: 'Cebu City' },
        { id: 'mandaue', name: 'Mandaue' },
        { id: 'lapu-lapu', name: 'Lapu-Lapu' },
      ],
      'davao': [
        { id: 'davao-city', name: 'Davao City' },
        { id: 'tagum', name: 'Tagum' },
      ],
    },
  },
  VN: {
    provinces: [
      { id: 'hanoi', name: 'Hanoi' },
      { id: 'ho-chi-minh', name: 'Ho Chi Minh City' },
      { id: 'da-nang', name: 'Da Nang' },
      { id: 'hai-phong', name: 'Hai Phong' },
      { id: 'can-tho', name: 'Can Tho' },
      { id: 'hue', name: 'Hue' },
    ],
    districts: {
      'hanoi': [
        { id: 'hoan-kiem', name: 'Hoan Kiem' },
        { id: 'ba-dinh', name: 'Ba Dinh' },
        { id: 'dong-da', name: 'Dong Da' },
      ],
      'ho-chi-minh': [
        { id: 'district-1', name: 'District 1' },
        { id: 'district-3', name: 'District 3' },
        { id: 'district-7', name: 'District 7' },
        { id: 'binh-thanh', name: 'Binh Thanh' },
      ],
      'da-nang': [
        { id: 'hai-chau', name: 'Hai Chau' },
        { id: 'son-tra', name: 'Son Tra' },
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
