export const sellersData = [
  {
    id: 'SE-1021',
    name: 'Golden Spoon Kitchen',
    email: 'contact@goldenspoon.com',
    doc: 'license_1021.pdf',
    docType: 'Business License',
    status: 'pending',
    submittedAt: '2024-03-10',
  },
  {
    id: 'SE-1477',
    name: 'Midnight Biryani Co.',
    email: 'hello@midnightbiryani.com',
    doc: 'id_1477.png',
    docType: 'Food Handler Permit',
    status: 'approved',
    submittedAt: '2024-02-28',
  },
  {
    id: 'SE-1899',
    name: 'Bloom Vegan',
    email: 'team@bloomvegan.io',
    doc: 'license_1899.pdf',
    docType: 'Health Certificate',
    status: 'rejected',
    submittedAt: '2024-03-05',
  },
  {
    id: 'SE-2056',
    name: 'Umami Street',
    email: 'orders@umamistreet.com',
    doc: 'license_2056.pdf',
    docType: 'Business License',
    status: 'pending',
    submittedAt: '2024-03-12',
  },
];

export const customersData = [
  { id: 'CU-221', name: 'Aysha Malik', email: 'aysha.m@example.com', city: 'Brookfield', status: 'pending', joinedAt: '2024-03-08' },
  { id: 'CU-238', name: 'Milan Rao', email: 'milan.rao@example.com', city: 'East Point', status: 'pending', joinedAt: '2024-03-09' },
  { id: 'CU-244', name: 'Zoe Carter', email: 'zoe.carter@example.com', city: 'Lakeside', status: 'pending', joinedAt: '2024-03-10' },
  { id: 'CU-251', name: 'James Wilson', email: 'j.wilson@example.com', city: 'Northgate', status: 'approved', joinedAt: '2024-02-15' },
  { id: 'CU-263', name: 'Priya Sharma', email: 'priya.s@example.com', city: 'Westview', status: 'approved', joinedAt: '2024-02-20' },
];

export const messagesData = [
  { id: 'MSG-721', from: 'Customer: Aysha M.', to: 'Seller: Golden Spoon', text: 'Can I swap fries for salad?', flagged: false, timestamp: '10:32 AM' },
  { id: 'MSG-734', from: 'Customer: Milan R.', to: 'Seller: Midnight Biryani', text: 'Please make it extra spicy. I love the heat!', flagged: true, timestamp: '11:15 AM' },
  { id: 'MSG-745', from: 'Customer: Zoe C.', to: 'Seller: Bloom Vegan', text: 'Is the tofu wrap gluten-free?', flagged: false, timestamp: '12:45 PM' },
  { id: 'MSG-756', from: 'Customer: James W.', to: 'Seller: Umami Street', text: 'The ramen was amazing! Will order again.', flagged: false, timestamp: '02:20 PM' },
  { id: 'MSG-767', from: 'Customer: Priya S.', to: 'Seller: Golden Spoon', text: 'Where is my order? It has been 45 minutes.', flagged: true, timestamp: '03:10 PM' },
];

export const analyticsData = {
  totalUsers: { value: '148.2k', delta: '+6.1%', trend: 'up' },
  ordersToday: { value: '4,512', delta: '+3.4%', trend: 'up' },
  monthlyRevenue: { value: '৳1.28m', delta: '+8.9%', trend: 'up' },
  activeSellers: { value: '324', delta: '+12', trend: 'up' },
  avgDeliveryTime: { value: '28 min', delta: '-2 min', trend: 'down' },
  customerSatisfaction: { value: '94.2%', delta: '+1.2%', trend: 'up' },
};

export const dailyOrdersData = [
  { day: 'Mon', orders: 45, revenue: 1250 },
  { day: 'Tue', orders: 60, revenue: 1680 },
  { day: 'Wed', orders: 58, revenue: 1520 },
  { day: 'Thu', orders: 72, revenue: 1890 },
  { day: 'Fri', orders: 88, revenue: 2340 },
  { day: 'Sat', orders: 70, revenue: 1850 },
  { day: 'Sun', orders: 96, revenue: 2560 },
];

export const growthData = [
  { month: 'Jan', users: 120, orders: 8000 },
  { month: 'Feb', users: 135, orders: 9200 },
  { month: 'Mar', users: 148, orders: 10500 },
];
