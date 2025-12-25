import temple1 from '@/assets/temple-1.jpg';
import temple2 from '@/assets/temple-2.jpg';
import temple3 from '@/assets/temple-3.jpg';
import temple4 from '@/assets/temple-4.jpg';
import accessory1 from '@/assets/accessory-1.jpg';
import accessory2 from '@/assets/accessory-2.jpg';
import accessory3 from '@/assets/accessory-3.jpg';

export interface Temple {
  id: string;
  name: string;
  province: string;
  district: string;
  description: string;
  image: string;
  deity: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  coordinates: { lat: number; lng: number };
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  image: string;
  templeId: string;
  category: string;
  stock: number;
}

export interface Review {
  id: string;
  templeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export const temples: Temple[] = [
  {
    id: 'nallur-kandaswamy',
    name: 'Nallur Kandaswamy Kovil',
    province: 'Northern Province',
    district: 'Jaffna',
    description: 'A historic and prominent Hindu temple dedicated to Lord Murugan, known for its vibrant festivals and intricate architecture.',
    image: temple1,
    deity: 'Lord Murugan',
    address: 'Nallur, Jaffna, Sri Lanka',
    phone: '+94 21 222 2333',
    email: 'info@nallurkovil.lk',
    rating: 4.8,
    reviewCount: 1250,
    coordinates: { lat: 9.6615, lng: 80.0255 },
  },
  {
    id: 'sri-kailasanathar',
    name: 'Sri Kailasanathar Swami Kovil',
    province: 'Western Province',
    district: 'Colombo',
    description: 'One of the oldest Hindu temples in Colombo, dedicated to Lord Shiva, attracting devotees with its serene ambiance.',
    image: temple2,
    deity: 'Lord Shiva',
    address: 'Kotahena, Colombo 13, Sri Lanka',
    phone: '+94 11 234 5678',
    email: 'info@kailasanathar.lk',
    rating: 4.6,
    reviewCount: 890,
    coordinates: { lat: 6.9497, lng: 79.8631 },
  },
  {
    id: 'koneswaram',
    name: 'Koneswaram Temple',
    province: 'Eastern Province',
    district: 'Trincomalee',
    description: 'Perched on Swami Rock, this ancient classical-medieval Hindu temple complex is dedicated to Shiva and offers breathtaking ocean views.',
    image: temple3,
    deity: 'Lord Shiva',
    address: 'Fort Frederick, Trincomalee, Sri Lanka',
    phone: '+94 26 222 4567',
    email: 'info@koneswaram.lk',
    rating: 4.9,
    reviewCount: 2100,
    coordinates: { lat: 8.5741, lng: 81.2344 },
  },
  {
    id: 'munneswaram',
    name: 'Munneswaram Temple',
    province: 'North Western Province',
    district: 'Puttalam',
    description: 'An important regional Hindu temple complex dedicated primarily to Lord Shiva, with history spanning millennia.',
    image: temple4,
    deity: 'Lord Shiva',
    address: 'Munneswaram, Chilaw, Sri Lanka',
    phone: '+94 32 222 3456',
    email: 'info@munneswaram.lk',
    rating: 4.5,
    reviewCount: 650,
    coordinates: { lat: 7.4833, lng: 79.8500 },
  },
];

export const accessories: Accessory[] = [
  {
    id: 'acc-1',
    name: 'Traditional Brass Diya Lamps',
    price: 1200,
    image: accessory1,
    templeId: 'nallur-kandaswamy',
    category: 'Lamps',
    stock: 50,
  },
  {
    id: 'acc-2',
    name: 'Aromatic Sandalwood Incense Sticks (Pack of 100)',
    price: 350,
    image: accessory2,
    templeId: 'nallur-kandaswamy',
    category: 'Incense',
    stock: 200,
  },
  {
    id: 'acc-3',
    name: 'Ornate Brass Pooja Thali Set',
    price: 2500,
    image: accessory3,
    templeId: 'nallur-kandaswamy',
    category: 'Pooja Items',
    stock: 30,
  },
  {
    id: 'acc-4',
    name: 'Pure Kumkum Powder (50g)',
    price: 200,
    image: accessory1,
    templeId: 'sri-kailasanathar',
    category: 'Pooja Items',
    stock: 100,
  },
  {
    id: 'acc-5',
    name: 'Sacred Rudraksha Mala (108 Beads)',
    price: 1800,
    image: accessory3,
    templeId: 'koneswaram',
    category: 'Jewelry',
    stock: 25,
  },
  {
    id: 'acc-6',
    name: 'Small Ganesha Idol (Resin)',
    price: 3000,
    image: accessory3,
    templeId: 'munneswaram',
    category: 'Idols',
    stock: 15,
  },
];

export const reviews: Review[] = [
  {
    id: 'rev-1',
    templeId: 'nallur-kandaswamy',
    userId: 'user-1',
    userName: 'Priya Sharma',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    rating: 5,
    comment: 'A truly serene and beautiful temple. The spiritual atmosphere is incredibly uplifting. Highly recommend visiting during the morning puja.',
    date: '2023-11-15',
  },
  {
    id: 'rev-2',
    templeId: 'nallur-kandaswamy',
    userId: 'user-2',
    userName: 'Ravi Kumar',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi',
    rating: 5,
    comment: 'An exquisite architectural marvel. Every detail reflects devotion and artistry. The temple staff are very welcoming and helpful.',
    date: '2023-12-01',
  },
  {
    id: 'rev-3',
    templeId: 'nallur-kandaswamy',
    userId: 'user-3',
    userName: 'Anjali Patel',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
    rating: 4,
    comment: 'Visited with family. The temple grounds are well-maintained and peaceful. The accessories available are authentic and good quality. A must-visit for devotees.',
    date: '2024-01-20',
  },
  {
    id: 'rev-4',
    templeId: 'koneswaram',
    userId: 'user-4',
    userName: 'Suresh Menon',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
    rating: 4,
    comment: 'A decent temple experience. It can get a bit crowded during festivals, but overall a good place for worship. Parking was a bit challenging.',
    date: '2024-02-10',
  },
];
