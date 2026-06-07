export const sellerMenuData = [
  { id: 'MN-101', name: 'Golden Chicken Bowl', category: 'Bowls', price: 11.99, status: 'live', stock: 24 },
  { id: 'MN-102', name: 'Smoked Beef Pasta', category: 'Pasta', price: 13.5, status: 'live', stock: 12 },
  { id: 'MN-103', name: 'Mango Chili Wings', category: 'Sides', price: 8.25, status: 'paused', stock: 0 },
];

export const sellerOrdersData = [
  { id: 'ORD-8231', customer: 'Aysha Malik', type: 'Regular', item: 'Golden Chicken Bowl', eta: '18 min', status: 'Preparing', value: 18.75 },
  { id: 'ORD-8240', customer: 'Milan Rao', type: 'Custom', item: 'Family biryani tray', eta: '2 hr', status: 'Quoted', value: 44.0 },
  { id: 'ORD-8245', customer: 'Zoe Carter', type: 'Regular', item: 'Smoked Beef Pasta', eta: '24 min', status: 'Ready', value: 21.3 },
];

export const sellerMessagesData = [
  { id: 'SM-1', from: 'Aysha Malik', text: 'Can you make the bowl less spicy?', time: '10:42 AM', unread: true },
  { id: 'SM-2', from: 'Milan Rao', text: 'Please confirm the custom tray price.', time: '11:05 AM', unread: true },
  { id: 'SM-3', from: 'Priya Sharma', text: 'Thanks, the food was excellent.', time: '12:18 PM', unread: false },
];

export const sellerEarningsData = [
  { label: 'Today', value: '$428.50', delta: '+14%' },
  { label: 'This Week', value: '$2,840', delta: '+8%' },
  { label: 'Custom Orders', value: '$680', delta: '+21%' },
  { label: 'Payout Due', value: '$1,920', delta: 'Fri' },
];

export const deliveryOrdersData = [
  { id: 'DL-910', pickup: 'Golden Spoon Kitchen', dropoff: '123 Market Street', distance: '4.2 km', eta: '22 min', status: 'Assigned', type: 'Regular' },
  { id: 'DL-913', pickup: 'Umami Street', dropoff: '80 Lake Road', distance: '6.8 km', eta: '28 min', status: 'Accepted', type: 'Regular' },
  { id: 'DL-918', pickup: 'Napoli Express', dropoff: '9 Garden Ave', distance: '5.4 km', eta: '25 min', status: 'Picked Up', type: 'Regular' },
];

export const excludedCustomOrdersData = [
  { id: 'CUS-501', seller: 'Midnight Biryani Co.', reason: 'Distant custom delivery', eta: '2 hr' },
  { id: 'CUS-518', seller: 'Sahara Kitchen', reason: 'Special courier required', eta: '3 hr' },
];

export const nearbyNotificationsData = [
  { id: 'NT-1', title: '20% off Thai Orchid', radius: 'Within 7 km', sent: '1,284 users', status: 'Ready' },
  { id: 'NT-2', title: 'Pizza flash deal ending soon', radius: 'Within 8 km', sent: '938 users', status: 'Scheduled' },
  { id: 'NT-3', title: 'FIRSTORDER10 welcome offer', radius: 'New nearby users', sent: '412 users', status: 'Live' },
];
