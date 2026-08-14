import { Server as SocketIOServer } from 'socket.io';

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket) => {
    console.log(`📡 Client connected: ${socket.id}`);

    // Join room for specific vehicle tracking
    socket.on('track:vehicle', (vehicleId: string) => {
      socket.join(`vehicle:${vehicleId}`);
      console.log(`👁 Client tracking vehicle: ${vehicleId}`);
    });

    // Join room for specific shipment tracking
    socket.on('track:shipment', (shipmentId: string) => {
      socket.join(`shipment:${shipmentId}`);
      console.log(`📦 Client tracking shipment: ${shipmentId}`);
    });

    // Leave tracking rooms
    socket.on('untrack:vehicle', (vehicleId: string) => {
      socket.leave(`vehicle:${vehicleId}`);
    });

    socket.on('untrack:shipment', (shipmentId: string) => {
      socket.leave(`shipment:${shipmentId}`);
    });

    // Join user room for notifications
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`🔔 User joined for notifications: ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`📡 Client disconnected: ${socket.id}`);
    });
  });
}
