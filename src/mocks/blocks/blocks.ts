import type { Block } from '../../types/apartment'

export const blocks: Block[] = [
  { id: 'block-a', name: 'A', hasStaircases: true, address: 'Str. Lalelelor 14, Bucuresti', heatingType: 'district', activeAdminId: 'ADM-1' },
  { id: 'block-b', name: 'B', hasStaircases: false, address: 'Bd. Unirii 88, Bucuresti', heatingType: 'gas_boiler', activeAdminId: 'ADM-2' },
  { id: 'block-c', name: 'C', hasStaircases: true, address: 'Str. Muresului 9, Cluj-Napoca', heatingType: 'central', activeAdminId: 'ADM-1' },
]
