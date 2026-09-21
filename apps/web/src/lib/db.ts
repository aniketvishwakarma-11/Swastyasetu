import Dexie, { Table } from 'dexie';
import type { Referral, SyncEvent, Patient, Facility } from '@swastyasetu/shared';

export interface LocalReferral extends Referral {
  localSyncStatus: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  lastAttemptAt?: string;
  errorMessage?: string;
}

export class SwasthyaSetuDatabase extends Dexie {
  referrals!: Table<LocalReferral, string>;
  syncQueue!: Table<SyncEvent, string>;
  patients!: Table<Patient, string>;
  facilities!: Table<Facility, string>;

  constructor() {
    super('SwasthyaSetuOfflineDB');
    this.version(1).stores({
      referrals: 'id, referralNumber, patientId, status, localSyncStatus, createdAt',
      syncQueue: 'id, eventId, entityType, entityId, status, createdAt',
      patients: 'id, name, phone, village, localId',
      facilities: 'id, code, type',
    });
  }
}

export const db = new SwasthyaSetuDatabase();
