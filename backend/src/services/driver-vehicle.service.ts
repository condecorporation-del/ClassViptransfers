import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/audit';
import { CreateDriverInput, CreateVehicleInput } from '../lib/validation';

export class DriverVehicleService {
  /**
   * List all drivers
   */
  async listDrivers(includeInactive: boolean = false) {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    return await prisma.driver.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create driver
   */
  async createDriver(input: CreateDriverInput, userId?: string, userEmail?: string) {
    const driver = await prisma.driver.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        licenseNumber: input.licenseNumber,
        isActive: input.isActive,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Driver',
      entityId: driver.id,
      userId,
      userEmail,
      description: `Driver created: ${driver.name}`,
    });

    return driver;
  }

  /**
   * Update driver
   */
  async updateDriver(
    id: string,
    data: Partial<CreateDriverInput>,
    userId?: string,
    userEmail?: string
  ) {
    const driver = await prisma.driver.update({
      where: { id },
      data,
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Driver',
      entityId: id,
      userId,
      userEmail,
      description: `Driver updated: ${driver.name}`,
    });

    return driver;
  }

  /**
   * Delete driver
   */
  async deleteDriver(id: string, userId?: string, userEmail?: string) {
    // Check if driver has assignments
    const assignments = await prisma.bookingAssignment.count({
      where: { driverId: id },
    });

    if (assignments > 0) {
      // Soft delete - mark as inactive
      return await prisma.driver.update({
        where: { id },
        data: { isActive: false },
      });
    }

    await prisma.driver.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Driver',
      entityId: id,
      userId,
      userEmail,
      description: `Driver deleted`,
    });
  }

  /**
   * List all vehicles
   */
  async listVehicles(includeInactive: boolean = false) {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    return await prisma.vehicle.findMany({
      where,
      orderBy: { make: 'asc' },
    });
  }

  /**
   * Create vehicle
   */
  async createVehicle(input: CreateVehicleInput, userId?: string, userEmail?: string) {
    const vehicle = await prisma.vehicle.create({
      data: {
        make: input.make,
        model: input.model,
        year: input.year,
        licensePlate: input.licensePlate,
        capacity: input.capacity,
        isActive: input.isActive,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      userId,
      userEmail,
      description: `Vehicle created: ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
    });

    return vehicle;
  }

  /**
   * Update vehicle
   */
  async updateVehicle(
    id: string,
    data: Partial<CreateVehicleInput>,
    userId?: string,
    userEmail?: string
  ) {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Vehicle',
      entityId: id,
      userId,
      userEmail,
      description: `Vehicle updated: ${vehicle.licensePlate}`,
    });

    return vehicle;
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string, userId?: string, userEmail?: string) {
    // Check if vehicle has assignments
    const assignments = await prisma.bookingAssignment.count({
      where: { vehicleId: id },
    });

    if (assignments > 0) {
      // Soft delete - mark as inactive
      return await prisma.vehicle.update({
        where: { id },
        data: { isActive: false },
      });
    }

    await prisma.vehicle.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Vehicle',
      entityId: id,
      userId,
      userEmail,
      description: `Vehicle deleted`,
    });
  }
}

