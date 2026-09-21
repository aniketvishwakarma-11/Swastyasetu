import Dexie, { Table } from 'dexie';
import { Patient, Referral, SyncEvent } from '@swastyasetu/shared';

export interface LocalReferral extends Omit<Referral, 'id'> {
  id?: string;
  localId: string;
  syncStatus: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  lastSyncedAt?: string;
}

export interface LocalPatient extends Omit<Patient, 'id'> {
  id?: string;
  localId: string;
}

export interface LocalSyncEvent extends SyncEvent {
  localId?: string;
}

export class SwasthyaSetuDatabase extends Dexie {
  referrals!: Table<LocalReferral, string>;
  patients!: Table<LocalPatient, string>;
  syncQueue!: Table<LocalSyncEvent, string>;

  constructor() {
    super('SwasthyaSetuDB');
    this.version(1).stores({
      referrals: 'localId, referralNumber, urgency, status, syncStatus, createdAt',
      patients: 'localId, name, phone, village',
      syncQueue: 'eventId, entityType, entityId, status, createdAt',
    });
  }
}

export const localDb = new SwasthyaSetuDatabase();
export const db = localDb;
