import type { Administrator, BuildingAdminAssignment } from '../types/apartment'

export const administrators: Administrator[] = [
  { id: 'ADM-SUPER', name: 'BlocAdmin Support Team', email: 'support@blocadmin.example.com', phone: '021 000 0000', role: 'SuperAdmin' },
  { id: 'ADM-1', name: 'Andrei Georgescu', email: 'andrei.admin@example.com', phone: '0722 101 101', role: 'Admin' },
  { id: 'ADM-2', name: 'Irina Dumitru', email: 'irina.admin@example.com', phone: '0722 202 202', role: 'Admin' },
  { id: 'ADM-EMPTY-UI', name: 'Admin Empty UI', email: 'admin.empty.ui@example.com', phone: '0700 000 001', role: 'Admin' },
  { id: 'ADM-EMPTY-BACKEND', name: 'Admin Empty Backend Ready', email: 'admin.empty.backend@example.com', phone: '0700 000 002', role: 'Admin' },
  { id: 'ADM-CONFIGURED-BLOCK', name: 'Admin New Block Setup', email: 'admin.new.block.setup@example.com', phone: '0700 000 003', role: 'Admin' },
]

export const buildingAdminAssignments: BuildingAdminAssignment[] = [
  {
    id: 'BAA-A-2025',
    blockId: 'block-a',
    adminId: 'ADM-1',
    startDate: '2025-01-01',
    isActive: true,
    assignmentReason: 'Annual association contract renewed by owner committee.',
    createdBy: 'ADM-SUPER',
    updatedBy: 'ADM-SUPER',
  },
  {
    id: 'BAA-B-2026',
    blockId: 'block-b',
    adminId: 'ADM-2',
    startDate: '2026-02-01',
    isActive: true,
    assignmentReason: 'Transition from prior administrator after service contract change.',
    createdBy: 'ADM-SUPER',
    updatedBy: 'ADM-SUPER',
  },
  {
    id: 'BAA-B-2024',
    blockId: 'block-b',
    adminId: 'ADM-1',
    startDate: '2024-01-01',
    endDate: '2026-01-31',
    isActive: false,
    assignmentReason: 'Previous administrator assignment retained for audit history.',
    createdBy: 'ADM-SUPER',
    updatedBy: 'ADM-SUPER',
  },
  {
    id: 'BAA-C-2025',
    blockId: 'block-c',
    adminId: 'ADM-1',
    startDate: '2025-05-01',
    isActive: true,
    assignmentReason: 'New building added to managed portfolio.',
    createdBy: 'ADM-SUPER',
    updatedBy: 'ADM-SUPER',
  },
  {
    id: 'BAA-CONFIGURED-2026',
    blockId: 'block-new-setup',
    adminId: 'ADM-CONFIGURED-BLOCK',
    startDate: '2026-05-01',
    isActive: true,
    assignmentReason: 'Administrator created the initial block configuration and assigned the first resident.',
    createdBy: 'ADM-SUPER',
    updatedBy: 'ADM-SUPER',
  },
]
