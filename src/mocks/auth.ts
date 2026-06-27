import type { MockAccount } from '../types/apartment'

export const mockAccounts: MockAccount[] = [
  {
    id: 'acct-demo',
    name: 'Demo Account',
    email: 'demo.account@example.com',
    roles: ['Admin', 'Resident'],
    defaultRole: 'Admin',
    adminId: 'ADM-1',
    token: 'mock-jwt-demo-account',
  },
  {
    id: 'acct-popescu-nicolae',
    name: 'Popescu Nicolae',
    email: 'popescu.nicolae@example.com',
    roles: ['Admin', 'Resident'],
    defaultRole: 'Admin',
    adminId: 'ADM-1',
    userId: '20000000-0000-0000-0000-000000000003',
    residentId: '10000000-0000-0000-0000-000000000003',
    token: 'mock-jwt-popescu-nicolae',
  },
  {
    id: 'acct-popescu-g',
    name: 'Popescu G',
    email: 'popescu.g@example.com',
    roles: ['Resident', 'Censor'],
    defaultRole: 'Censor',
    userId: '20000000-0000-0000-0000-000000000002',
    residentId: '10000000-0000-0000-0000-000000000002',
    token: 'mock-jwt-popescu-g',
  },
  {
    id: 'acct-olteanu-ion',
    name: 'Olteanu Ion',
    email: 'olteanu.ion@example.com',
    roles: ['Resident'],
    defaultRole: 'Resident',
    userId: '20000000-0000-0000-0000-000000000001',
    residentId: '10000000-0000-0000-0000-000000000001',
    token: 'mock-jwt-olteanu-ion',
  },
]
