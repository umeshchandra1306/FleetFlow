import { z } from 'zod';

const id = z.string().trim().min(1);
const numeric = z.coerce.number().finite();
const positiveNumeric = numeric.positive();
const positiveInteger = z.coerce.number().int().positive();

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1),
  role: z.enum(['DISPATCHER', 'DRIVER']).optional(),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
}).strict();

export const createShipmentSchema = z.object({
  shipmentNumber: z.string().trim().min(1).optional(),
  pickupLocation: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  pickupLatitude: numeric,
  pickupLongitude: numeric,
  destinationLatitude: numeric,
  destinationLongitude: numeric,
  cargoType: z.string().trim().min(1).optional(),
  weight: positiveNumeric,
  packageCount: positiveInteger,
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.coerce.date(),
}).strict();

export const updateShipmentSchema = createShipmentSchema.partial().strict();

export const assignVehicleSchema = z.object({
  vehicleId: id,
  driverId: id.optional(),
}).strict();

export const updateShipmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELAYED', 'ARRIVING', 'DELIVERED', 'CANCELLED']),
}).strict();

export const controlSimulationSchema = z.object({
  action: z.enum(['pause', 'resume', 'stop']),
  vehicleId: id,
}).strict();

export const createVehicleSchema = z.object({
  vehicleNumber: z.string().trim().min(1),
  vehicleType: z.string().trim().min(1),
  capacity: positiveNumeric,
  fuelType: z.string().trim().min(1).optional(),
  latitude: numeric.optional(),
  longitude: numeric.optional(),
}).strict();

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'IDLE', 'MAINTENANCE', 'OFFLINE']).optional(),
  currentLoad: numeric.nonnegative().optional(),
  driverId: id.nullable().optional(),
}).strict();

export const createDriverSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  licenseNumber: z.string().trim().min(1),
}).strict();

export const updateDriverSchema = createDriverSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'DRIVING', 'OFFLINE', 'ON_BREAK']).optional(),
}).strict();

export const startTrackingSchema = z.object({
  shipmentId: id,
}).strict();

export const stopTrackingSchema = z.object({
  vehicleId: id,
}).strict();
