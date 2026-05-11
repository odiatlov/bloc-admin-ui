import type { MainMeterReading, WaterReading } from '../../types/apartment'

export const waterReadings: WaterReading[] = [
  { id: 'WR-7001', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-05', previousValue: 1280, currentValue: 1298 },
  { id: 'WR-7002', residentId: 'R-1002', apartmentId: 'apt-a-18', month: '2026-05', previousValue: 860, currentValue: 869 },
  { id: 'WR-7003', residentId: 'R-1003', apartmentId: 'apt-b-41', month: '2026-05', previousValue: 1530, currentValue: 1572 },
  { id: 'WR-7004', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-04', previousValue: 1265, currentValue: 1280 },
]

export const mainMeterReadings: MainMeterReading[] = [
  { id: 'MM-WATER-A-2026-05', blockId: 'block-a', month: '2026-05', utility: 'water', previousValue: 18520, currentValue: 18560 },
  { id: 'MM-WATER-B-2026-05', blockId: 'block-b', month: '2026-05', utility: 'water', previousValue: 9440, currentValue: 9482 },
]
