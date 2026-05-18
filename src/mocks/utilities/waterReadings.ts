import type { MainMeterReading, WaterReading } from '../../types/apartment'

export const waterReadings: WaterReading[] = [
  { id: 'WR-7001-C', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-05', waterType: 'cold', previousValue: 1280, currentValue: 1298 },
  { id: 'WR-7001-H', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-05', waterType: 'hot', previousValue: 410, currentValue: 418 },
  { id: 'WR-7002-C', residentId: 'R-1002', apartmentId: 'apt-a-18', month: '2026-05', waterType: 'cold', previousValue: 860, currentValue: 869 },
  { id: 'WR-7002-H', residentId: 'R-1002', apartmentId: 'apt-a-18', month: '2026-05', waterType: 'hot', previousValue: 312, currentValue: 318 },
  { id: 'WR-7003-C', residentId: 'R-1003', apartmentId: 'apt-b-41', month: '2026-05', waterType: 'cold', previousValue: 1530, currentValue: 1572 },
  { id: 'WR-7003-H', residentId: 'R-1003', apartmentId: 'apt-b-41', month: '2026-05', waterType: 'hot', previousValue: 0, currentValue: 0 },
  { id: 'WR-7004-C', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-04', waterType: 'cold', previousValue: 1265, currentValue: 1280 },
  { id: 'WR-7004-H', residentId: 'R-1001', apartmentId: 'apt-a-12', month: '2026-04', waterType: 'hot', previousValue: 402, currentValue: 410 },
]

export const mainMeterReadings: MainMeterReading[] = [
  { id: 'MM-WATER-A-2026-05', blockId: 'block-a', month: '2026-05', utility: 'water', previousValue: 18520, currentValue: 18560 },
  { id: 'MM-WATER-B-2026-05', blockId: 'block-b', month: '2026-05', utility: 'water', previousValue: 9440, currentValue: 9482 },
]
