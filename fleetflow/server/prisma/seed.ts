import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding FleetFlow database...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.route.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ───
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const dispatcher = await prisma.user.create({
    data: {
      email: 'demo@fleetflow.com',
      password: hashedPassword,
      name: 'Rajesh Kumar',
      role: 'DISPATCHER',
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@fleetflow.com',
      password: hashedPassword,
      name: 'Amit Singh',
      role: 'DRIVER',
    },
  });

  console.log('✅ Users created');

  // ─── Drivers ───
  const driversData = [
    { name: 'Amit Singh', phone: '+91-9876543210', licenseNumber: 'DL-01-2024-001', status: 'AVAILABLE' as const, rating: 4.8, tripsCompleted: 156, userId: driverUser.id },
    { name: 'Vikram Patel', phone: '+91-9876543211', licenseNumber: 'MH-02-2024-002', status: 'AVAILABLE' as const, rating: 4.6, tripsCompleted: 132 },
    { name: 'Suresh Yadav', phone: '+91-9876543212', licenseNumber: 'RJ-03-2024-003', status: 'DRIVING' as const, rating: 4.9, tripsCompleted: 210 },
    { name: 'Mohan Das', phone: '+91-9876543213', licenseNumber: 'KA-04-2024-004', status: 'AVAILABLE' as const, rating: 4.3, tripsCompleted: 89 },
    { name: 'Ravi Sharma', phone: '+91-9876543214', licenseNumber: 'TN-05-2024-005', status: 'AVAILABLE' as const, rating: 4.7, tripsCompleted: 175 },
    { name: 'Deepak Gupta', phone: '+91-9876543215', licenseNumber: 'GJ-06-2024-006', status: 'ON_BREAK' as const, rating: 4.5, tripsCompleted: 143 },
    { name: 'Arjun Reddy', phone: '+91-9876543216', licenseNumber: 'AP-07-2024-007', status: 'AVAILABLE' as const, rating: 4.4, tripsCompleted: 98 },
    { name: 'Prakash Jha', phone: '+91-9876543217', licenseNumber: 'UP-08-2024-008', status: 'OFFLINE' as const, rating: 4.2, tripsCompleted: 67 },
  ];

  const drivers = [];
  for (const d of driversData) {
    const driver = await prisma.driver.create({ data: d });
    drivers.push(driver);
  }
  console.log('✅ Drivers created');

  // ─── Vehicles ───
  const vehiclesData = [
    { vehicleNumber: 'TRK-201', vehicleType: 'Heavy Truck', capacity: 20, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 28.6139, longitude: 77.2090, fuelType: 'Diesel', driverId: drivers[0].id },
    { vehicleNumber: 'TRK-202', vehicleType: 'Heavy Truck', capacity: 18, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 28.5355, longitude: 77.3910, fuelType: 'Diesel', driverId: drivers[1].id },
    { vehicleNumber: 'TRK-203', vehicleType: 'Medium Truck', capacity: 12, currentLoad: 8, status: 'IN_TRANSIT' as const, latitude: 27.1767, longitude: 76.0000, fuelType: 'Diesel', driverId: drivers[2].id },
    { vehicleNumber: 'TRK-204', vehicleType: 'Medium Truck', capacity: 14, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 28.4595, longitude: 77.0266, fuelType: 'Diesel', driverId: drivers[3].id },
    { vehicleNumber: 'TRK-205', vehicleType: 'Light Truck', capacity: 8, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 19.0760, longitude: 72.8777, fuelType: 'CNG', driverId: drivers[4].id },
    { vehicleNumber: 'TRK-206', vehicleType: 'Heavy Truck', capacity: 22, currentLoad: 0, status: 'MAINTENANCE' as const, latitude: 12.9716, longitude: 77.5946, fuelType: 'Diesel' },
    { vehicleNumber: 'TRK-207', vehicleType: 'Medium Truck', capacity: 10, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 23.0225, longitude: 72.5714, fuelType: 'Diesel', driverId: drivers[5].id },
    { vehicleNumber: 'TRK-208', vehicleType: 'Light Truck', capacity: 6, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 17.3850, longitude: 78.4867, fuelType: 'CNG', driverId: drivers[6].id },
    { vehicleNumber: 'TRK-209', vehicleType: 'Heavy Truck', capacity: 25, currentLoad: 0, status: 'IDLE' as const, latitude: 26.9124, longitude: 75.7873, fuelType: 'Diesel' },
    { vehicleNumber: 'TRK-210', vehicleType: 'Medium Truck', capacity: 15, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 18.5204, longitude: 73.8567, fuelType: 'Diesel' },
    { vehicleNumber: 'TRK-211', vehicleType: 'Light Truck', capacity: 5, currentLoad: 0, status: 'OFFLINE' as const, latitude: 22.5726, longitude: 88.3639, fuelType: 'Petrol', driverId: drivers[7].id },
    { vehicleNumber: 'TRK-212', vehicleType: 'Heavy Truck', capacity: 20, currentLoad: 0, status: 'AVAILABLE' as const, latitude: 13.0827, longitude: 80.2707, fuelType: 'Diesel' },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.create({ data: v });
    vehicles.push(vehicle);
  }
  console.log('✅ Vehicles created');

  // Helper to generate route points between two coordinates
  function generateRoutePoints(startLat: number, startLng: number, endLat: number, endLng: number, numPoints: number = 20) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Add slight randomness for realistic road curvature
      const jitterLat = (Math.random() - 0.5) * 0.02;
      const jitterLng = (Math.random() - 0.5) * 0.02;
      points.push({
        latitude: startLat + (endLat - startLat) * t + (i > 0 && i < numPoints ? jitterLat : 0),
        longitude: startLng + (endLng - startLng) * t + (i > 0 && i < numPoints ? jitterLng : 0),
      });
    }
    return points;
  }

  // Haversine distance
  function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ─── Routes ───
  const routesData = [
    { startLat: 28.6139, startLng: 77.2090, endLat: 26.9124, endLng: 75.7873, distance: 281, duration: 300, vehicleId: vehicles[2].id }, // Delhi→Jaipur
    { startLat: 19.0760, startLng: 72.8777, endLat: 18.5204, endLng: 73.8567, distance: 150, duration: 180, vehicleId: vehicles[4].id }, // Mumbai→Pune
    { startLat: 28.6139, startLng: 77.2090, endLat: 30.7333, endLng: 76.7794, distance: 248, duration: 270, vehicleId: vehicles[0].id }, // Delhi→Chandigarh
    { startLat: 12.9716, startLng: 77.5946, endLat: 13.0827, endLng: 80.2707, distance: 346, duration: 360, vehicleId: vehicles[3].id }, // Bangalore→Chennai
    { startLat: 17.3850, startLng: 78.4867, endLat: 15.3173, endLng: 75.7139, distance: 370, duration: 390, vehicleId: vehicles[7].id }, // Hyderabad→Hubli
    { startLat: 23.0225, startLng: 72.5714, endLat: 19.0760, endLng: 72.8777, distance: 524, duration: 480, vehicleId: vehicles[6].id }, // Ahmedabad→Mumbai
    { startLat: 28.6139, startLng: 77.2090, endLat: 26.4499, endLng: 80.3319, distance: 403, duration: 360, vehicleId: vehicles[1].id }, // Delhi→Kanpur
    { startLat: 22.5726, startLng: 88.3639, endLat: 20.2961, endLng: 85.8245, distance: 468, duration: 420, vehicleId: vehicles[9].id }, // Kolkata→Bhubaneswar
  ];

  const routes = [];
  for (const r of routesData) {
    const optimizedDist = Math.round(r.distance * (0.88 + Math.random() * 0.07));
    const optimizedDur = Math.round(r.duration * (0.85 + Math.random() * 0.1));
    const route = await prisma.route.create({
      data: {
        vehicleId: r.vehicleId,
        distance: r.distance,
        estimatedDuration: r.duration,
        optimizedDistance: optimizedDist,
        optimizedDuration: optimizedDur,
        eta: new Date(Date.now() + optimizedDur * 60000),
        status: 'PLANNED',
        routePoints: generateRoutePoints(r.startLat, r.startLng, r.endLat, r.endLng),
      },
    });
    routes.push(route);
  }
  console.log('✅ Routes created');

  // ─── Shipments ───
  const now = new Date();
  const shipmentsData = [
    { shipmentNumber: 'SH-1001', pickupLocation: 'Delhi Warehouse, Connaught Place', destination: 'Jaipur Distribution Center', pickupLatitude: 28.6139, pickupLongitude: 77.2090, destinationLatitude: 26.9124, destinationLongitude: 75.7873, cargoType: 'Electronics', weight: 8, packageCount: 45, priority: 'HIGH' as const, deadline: new Date(now.getTime() + 6 * 3600000), status: 'IN_TRANSIT' as const, vehicleId: vehicles[2].id, driverId: drivers[2].id, routeId: routes[0].id },
    { shipmentNumber: 'SH-1002', pickupLocation: 'Mumbai Port, JNPT', destination: 'Pune Industrial Area', pickupLatitude: 19.0760, pickupLongitude: 72.8777, destinationLatitude: 18.5204, destinationLongitude: 73.8567, cargoType: 'Textiles', weight: 5, packageCount: 120, priority: 'MEDIUM' as const, deadline: new Date(now.getTime() + 8 * 3600000), status: 'ASSIGNED' as const, vehicleId: vehicles[4].id, driverId: drivers[4].id, routeId: routes[1].id },
    { shipmentNumber: 'SH-1003', pickupLocation: 'Delhi NCR Hub', destination: 'Chandigarh Central', pickupLatitude: 28.6139, pickupLongitude: 77.2090, destinationLatitude: 30.7333, destinationLongitude: 76.7794, cargoType: 'FMCG', weight: 12, packageCount: 200, priority: 'URGENT' as const, deadline: new Date(now.getTime() + 4 * 3600000), status: 'PENDING' as const },
    { shipmentNumber: 'SH-1004', pickupLocation: 'Bangalore Tech Park', destination: 'Chennai Trade Center', pickupLatitude: 12.9716, pickupLongitude: 77.5946, destinationLatitude: 13.0827, destinationLongitude: 80.2707, cargoType: 'Auto Parts', weight: 10, packageCount: 85, priority: 'HIGH' as const, deadline: new Date(now.getTime() + 7 * 3600000), status: 'PENDING' as const },
    { shipmentNumber: 'SH-1005', pickupLocation: 'Hyderabad HITEC City', destination: 'Hubli Market', pickupLatitude: 17.3850, pickupLongitude: 78.4867, destinationLatitude: 15.3173, destinationLongitude: 75.7139, cargoType: 'Pharmaceuticals', weight: 3, packageCount: 50, priority: 'URGENT' as const, deadline: new Date(now.getTime() + 5 * 3600000), status: 'DELAYED' as const, vehicleId: vehicles[7].id, driverId: drivers[6].id, routeId: routes[4].id },
    { shipmentNumber: 'SH-1006', pickupLocation: 'Ahmedabad Textile Hub', destination: 'Mumbai Warehouse', pickupLatitude: 23.0225, pickupLongitude: 72.5714, destinationLatitude: 19.0760, destinationLongitude: 72.8777, cargoType: 'Textiles', weight: 7, packageCount: 95, priority: 'LOW' as const, deadline: new Date(now.getTime() + 12 * 3600000), status: 'DELIVERED' as const, vehicleId: vehicles[6].id, driverId: drivers[5].id, routeId: routes[5].id },
    { shipmentNumber: 'SH-1007', pickupLocation: 'Delhi Industrial Area', destination: 'Kanpur Depot', pickupLatitude: 28.6139, pickupLongitude: 77.2090, destinationLatitude: 26.4499, destinationLongitude: 80.3319, cargoType: 'Machinery', weight: 15, packageCount: 12, priority: 'MEDIUM' as const, deadline: new Date(now.getTime() + 10 * 3600000), status: 'DELIVERED' as const, vehicleId: vehicles[1].id, driverId: drivers[1].id, routeId: routes[6].id },
    { shipmentNumber: 'SH-1008', pickupLocation: 'Kolkata Salt Lake', destination: 'Bhubaneswar Hub', pickupLatitude: 22.5726, pickupLongitude: 88.3639, destinationLatitude: 20.2961, destinationLongitude: 85.8245, cargoType: 'Food Products', weight: 4, packageCount: 65, priority: 'HIGH' as const, deadline: new Date(now.getTime() + 6 * 3600000), status: 'PENDING' as const },
    { shipmentNumber: 'SH-1009', pickupLocation: 'Pune MIDC', destination: 'Nashik Industrial', pickupLatitude: 18.5204, pickupLongitude: 73.8567, destinationLatitude: 19.9975, destinationLongitude: 73.7898, cargoType: 'Chemicals', weight: 9, packageCount: 30, priority: 'MEDIUM' as const, deadline: new Date(now.getTime() + 9 * 3600000), status: 'PENDING' as const },
    { shipmentNumber: 'SH-1010', pickupLocation: 'Chennai Port', destination: 'Coimbatore Depot', pickupLatitude: 13.0827, pickupLongitude: 80.2707, destinationLatitude: 11.0168, destinationLongitude: 76.9558, cargoType: 'Automobiles', weight: 18, packageCount: 8, priority: 'LOW' as const, deadline: new Date(now.getTime() + 14 * 3600000), status: 'DELIVERED' as const },
    { shipmentNumber: 'SH-1011', pickupLocation: 'Jaipur Dry Port', destination: 'Udaipur Warehouse', pickupLatitude: 26.9124, pickupLongitude: 75.7873, destinationLatitude: 24.5854, destinationLongitude: 73.7125, cargoType: 'Handicrafts', weight: 2, packageCount: 150, priority: 'LOW' as const, deadline: new Date(now.getTime() + 16 * 3600000), status: 'PENDING' as const },
    { shipmentNumber: 'SH-1012', pickupLocation: 'Lucknow Central', destination: 'Varanasi Hub', pickupLatitude: 26.8467, pickupLongitude: 80.9462, destinationLatitude: 25.3176, destinationLongitude: 82.9739, cargoType: 'Textiles', weight: 6, packageCount: 75, priority: 'MEDIUM' as const, deadline: new Date(now.getTime() + 8 * 3600000), status: 'PENDING' as const },
    { shipmentNumber: 'SH-1013', pickupLocation: 'Surat Diamond Hub', destination: 'Rajkot Market', pickupLatitude: 21.1702, pickupLongitude: 72.8311, destinationLatitude: 22.3039, destinationLongitude: 70.8022, cargoType: 'Precious Goods', weight: 1, packageCount: 10, priority: 'URGENT' as const, deadline: new Date(now.getTime() + 3 * 3600000), status: 'DELIVERED' as const },
    { shipmentNumber: 'SH-1014', pickupLocation: 'Indore Warehouse', destination: 'Bhopal Distribution', pickupLatitude: 22.7196, pickupLongitude: 75.8577, destinationLatitude: 23.2599, destinationLongitude: 77.4126, cargoType: 'FMCG', weight: 11, packageCount: 180, priority: 'HIGH' as const, deadline: new Date(now.getTime() + 5 * 3600000), status: 'PENDING' as const },
    { shipmentNumber: 'SH-1015', pickupLocation: 'Nagpur Logistics Park', destination: 'Raipur Center', pickupLatitude: 21.1458, pickupLongitude: 79.0882, destinationLatitude: 21.2514, destinationLongitude: 81.6296, cargoType: 'Steel', weight: 20, packageCount: 5, priority: 'MEDIUM' as const, deadline: new Date(now.getTime() + 11 * 3600000), status: 'PENDING' as const },
  ];

  const shipments = [];
  for (const s of shipmentsData) {
    const shipment = await prisma.shipment.create({ data: s });
    shipments.push(shipment);
  }

  // Update routes that have active shipments to ACTIVE status
  await prisma.route.update({ where: { id: routes[0].id }, data: { status: 'ACTIVE' } });
  await prisma.route.update({ where: { id: routes[4].id }, data: { status: 'DEVIATED' } });
  await prisma.route.update({ where: { id: routes[5].id }, data: { status: 'COMPLETED' } });
  await prisma.route.update({ where: { id: routes[6].id }, data: { status: 'COMPLETED' } });

  console.log('✅ Shipments created');

  // ─── Alerts ───
  const alertsData = [
    { vehicleId: vehicles[2].id, shipmentId: shipments[0].id, type: 'DELAY_RISK' as const, severity: 'WARNING' as const, message: 'TRK-203 shipment SH-1001 (Delhi→Jaipur) may not meet the 6 PM deadline. Current ETA: 6:25 PM.', resolved: false },
    { vehicleId: vehicles[7].id, shipmentId: shipments[4].id, type: 'ROUTE_DEVIATION' as const, severity: 'CRITICAL' as const, message: 'TRK-208 has deviated 7 km from planned route on SH-1005 (Hyderabad→Hubli).', resolved: false },
    { vehicleId: vehicles[7].id, shipmentId: shipments[4].id, type: 'DELAY_RISK' as const, severity: 'CRITICAL' as const, message: 'SH-1005 is significantly delayed. Estimated delay: 45 minutes.', resolved: false },
    { vehicleId: vehicles[10].id, type: 'VEHICLE_OFFLINE' as const, severity: 'WARNING' as const, message: 'TRK-211 has been offline for over 2 hours. Last known location: Kolkata.', resolved: false },
    { vehicleId: vehicles[5].id, type: 'LOW_PROGRESS' as const, severity: 'INFO' as const, message: 'TRK-206 is under scheduled maintenance. Expected availability: Tomorrow 8 AM.', resolved: true },
    { vehicleId: vehicles[2].id, shipmentId: shipments[0].id, type: 'LOW_PROGRESS' as const, severity: 'WARNING' as const, message: 'TRK-203 speed has dropped below 20 km/h for 30 minutes on NH-48.', resolved: false },
    { shipmentId: shipments[5].id, type: 'DELAY_RISK' as const, severity: 'INFO' as const, message: 'SH-1006 (Ahmedabad→Mumbai) delivered successfully. No delays.', resolved: true },
    { vehicleId: vehicles[8].id, type: 'VEHICLE_OFFLINE' as const, severity: 'INFO' as const, message: 'TRK-209 idle at Jaipur depot for 4 hours.', resolved: true },
    { vehicleId: vehicles[4].id, shipmentId: shipments[1].id, type: 'LOW_PROGRESS' as const, severity: 'INFO' as const, message: 'SH-1002 pickup scheduled. Vehicle TRK-205 en route to Mumbai Port.', resolved: false },
    { shipmentId: shipments[12].id, type: 'DELAY_RISK' as const, severity: 'WARNING' as const, message: 'SH-1013 urgent priority. Ensure timely processing at Surat hub.', resolved: true },
  ];

  for (const a of alertsData) {
    await prisma.alert.create({ data: a });
  }
  console.log('✅ Alerts created');

  // ─── Notifications ───
  const notificationsData = [
    { userId: dispatcher.id, title: 'Shipment Created', message: 'SH-1001 has been created for Delhi → Jaipur route.', type: 'shipment' },
    { userId: dispatcher.id, title: 'Vehicle Assigned', message: 'TRK-203 assigned to SH-1001.', type: 'assignment' },
    { userId: dispatcher.id, title: 'Route Optimized', message: 'Route for SH-1001 optimized. Saved 35 km (10%).', type: 'optimization' },
    { userId: dispatcher.id, title: 'Delay Detected', message: 'SH-1005 experiencing significant delay near Kurnool.', type: 'alert', read: false },
    { userId: dispatcher.id, title: 'Delivery Complete', message: 'SH-1006 delivered to Mumbai Warehouse.', type: 'delivery', read: true },
    { userId: driverUser.id, title: 'New Assignment', message: 'You have been assigned shipment SH-1001.', type: 'assignment' },
    { userId: driverUser.id, title: 'Route Available', message: 'Your optimized route for Delhi → Jaipur is ready.', type: 'route' },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log('✅ Notifications created');

  // ─── Tracking Events for in-transit shipment ───
  const routePoints = routes[0].routePoints as any[];
  if (Array.isArray(routePoints)) {
    const trackingCount = Math.min(5, routePoints.length);
    for (let i = 0; i < trackingCount; i++) {
      const point = routePoints[i];
      await prisma.trackingEvent.create({
        data: {
          vehicleId: vehicles[2].id,
          shipmentId: shipments[0].id,
          latitude: point.latitude,
          longitude: point.longitude,
          speed: 45 + Math.random() * 30,
          timestamp: new Date(now.getTime() - (trackingCount - i) * 600000),
        },
      });
    }
  }
  console.log('✅ Tracking events created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Dispatcher: demo@fleetflow.com / demo123');
  console.log('   Driver:     driver@fleetflow.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
