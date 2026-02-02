/**
 * Three-Way Merge Synchronization Service
 *
 * A strict synchronization mechanism using snapshot-based conflict resolution.
 * NO deleted flags - physical deletion only.
 *
 * Data Structure:
 * - Remote JSON uses URLs as keys (Record<url, TabData>)
 * - Snapshot stored in chrome.storage.local
 * - Three-way merge: Local vs Snapshot vs Remote
 */

import type { TabItem } from '../types/tab';
import type { Group } from '../types/group';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Tab data stored in sync (URL is the key)
 * NO 'deleted' field allowed - physical deletion only
 */
export interface TabData {
  url: string; // Unique Identifier (also the key in the record)
  title: string;
  group: string; // Name of the group (not ID!)
  updatedAt: number;
}

/**
 * Group metadata stored in sync
 */
export interface GroupMeta {
  name: string;
  color: string;
  updatedAt: number;
}

/**
 * Complete sync data structure
 */
export interface SyncData {
  version: number; // Schema version
  updatedAt: number; // Last sync time
  tabs: Record<string, TabData>; // KEY is the URL
  groups: Record<string, GroupMeta>; // KEY is group name
}

/**
 * Merge result with actions to perform
 */
export interface MergeResult {
  finalTabs: Record<string, TabData>;
  finalGroups: Record<string, GroupMeta>;
  actions: SyncAction[];
  groupsActions: SyncAction[];
}

/**
 * Actions to perform after merge
 */
export interface SyncAction {
  type: 'ADD_TAB' | 'DELETE_TAB' | 'ADD_GROUP' | 'DELETE_GROUP';
  url?: string; // For ADD_TAB, DELETE_TAB
  groupName?: string; // For ADD_GROUP, DELETE_GROUP
  data?: TabData | GroupMeta; // Data to use
}

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  addedToLocal: number;
  deletedFromLocal: number;
  addedToRemote: number;
  deletedFromRemote: number;
  error?: string;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const SYNC_DATA_VERSION = 1;
const SNAPSHOT_KEY = 'tabdav_sync_snapshot';

// ============================================================================
// Three-Way Merge Algorithm (Pure Function)
// ============================================================================

/**
 * Core Three-Way Merge Algorithm
 *
 * Logic Matrix:
 * | Local(L) | Snapshot(S) | Remote(R) | Action              | Reasoning                    |
 * |----------|-------------|-----------|---------------------|------------------------------|
 * | null     | null        | exists    | ADD to Local        | New data from another device |
 * | exists   | null        | null      | ADD to Remote       | New data created locally     |
 * | null     | exists      | null      | DELETE from Remote  | User deleted it locally      |
 * | exists   | exists      | null      | DELETE from Local   | Deleted on other device      |
 * | null     | exists      | exists    | Keep Newer          | Zombie: L is new, R is old   |
 * | exists   | exists      | exists    | Keep Newer          | Both modified, compare time  |
 */
export function mergeTabs(
  localMap: Record<string, TabData>,
  snapshotMap: Record<string, TabData>,
  remoteMap: Record<string, TabData>
): MergeResult {
  const finalTabs: Record<string, TabData> = {};
  const actions: SyncAction[] = [];

  // Get all unique URLs from all three sources
  const allUrls = new Set([
    ...Object.keys(localMap),
    ...Object.keys(snapshotMap),
    ...Object.keys(remoteMap),
  ]);

  for (const url of allUrls) {
    const L = localMap[url];
    const S = snapshotMap[url];
    const R = remoteMap[url];

    // Case 1: L=null, S=null, R=exists → ADD to Local
    if (!L && !S && R) {
      finalTabs[url] = R;
      actions.push({
        type: 'ADD_TAB',
        url,
        data: R,
      });
      continue;
    }

    // Case 2: L=exists, S=null, R=null → ADD to Remote
    if (L && !S && !R) {
      finalTabs[url] = L;
      actions.push({
        type: 'ADD_TAB',
        url,
        data: L,
      });
      continue;
    }

    // Case 3: L=null, S=exists, R=null → DELETE from Remote
    // User deleted it locally (present in S but not in L)
    if (!L && S && !R) {
      // Don't add to finalTabs (it's deleted)
      actions.push({
        type: 'DELETE_TAB',
        url,
      });
      continue;
    }

    // Case 4: L=exists, S=exists, R=null → DELETE from Local
    // User deleted it on another device
    if (L && S && !R) {
      // Don't add to finalTabs (it's deleted)
      actions.push({
        type: 'DELETE_TAB',
        url,
      });
      continue;
    }

    // Case 5: L=null, S=exists, R=exists → Keep Newer (Zombie case)
    // L is new (not in S), R is old (in S)
    if (!L && S && R) {
      const newerTab = R.updatedAt > S.updatedAt ? R : S;
      finalTabs[url] = newerTab;
      // If R is newer, it's a delete on local, otherwise add to local
      if (R.updatedAt > S.updatedAt) {
        actions.push({
          type: 'DELETE_TAB',
          url,
        });
      } else {
        actions.push({
          type: 'ADD_TAB',
          url,
          data: newerTab,
        });
      }
      continue;
    }

    // Case 6: Both exist (L=exists, S=exists, R=exists) → Keep Newer
    if (L && S && R) {
      // Compare updatedAt, take the newest
      const newerTab = L.updatedAt >= R.updatedAt ? L : R;
      finalTabs[url] = newerTab;

      // If L is newer, we need to upload to remote
      if (L.updatedAt > R.updatedAt) {
        actions.push({
          type: 'ADD_TAB',
          url,
          data: newerTab,
        });
      }
      // If R is newer and L is not S, we need to add to local
      else if (R.updatedAt > L.updatedAt && L.updatedAt !== S.updatedAt) {
        actions.push({
          type: 'ADD_TAB',
          url,
          data: newerTab,
        });
      }
      // If they're equal or L==S==R, no action needed
      continue;
    }

    // Case 7: L=exists, S=null, R=exists → Keep Newer (Zombie case variant)
    // L is new (not in S), R exists
    if (L && !S && R) {
      const newerTab = L.updatedAt >= R.updatedAt ? L : R;
      finalTabs[url] = newerTab;

      if (L.updatedAt > R.updatedAt) {
        actions.push({
          type: 'ADD_TAB',
          url,
          data: newerTab,
        });
      }
      continue;
    }

    // Case 8: L=null, S=null, R=null → Should not happen, skip
  }

  return { finalTabs, actions, finalGroups: {}, groupsActions: [] };
}

/**
 * Merge groups with same three-way logic
 */
export function mergeGroups(
  localGroups: Record<string, GroupMeta>,
  snapshotGroups: Record<string, GroupMeta>,
  remoteGroups: Record<string, GroupMeta>
): { finalGroups: Record<string, GroupMeta>; groupsActions: SyncAction[] } {
  const finalGroups: Record<string, GroupMeta> = {};
  const groupsActions: SyncAction[] = [];

  const allGroupNames = new Set([
    ...Object.keys(localGroups),
    ...Object.keys(snapshotGroups),
    ...Object.keys(remoteGroups),
  ]);

  for (const name of allGroupNames) {
    const L = localGroups[name];
    const S = snapshotGroups[name];
    const R = remoteGroups[name];

    // Same logic as tabs, but for groups
    if (!L && !S && R) {
      finalGroups[name] = R;
      groupsActions.push({
        type: 'ADD_GROUP',
        groupName: name,
        data: R,
      });
      continue;
    }

    if (L && !S && !R) {
      finalGroups[name] = L;
      groupsActions.push({
        type: 'ADD_GROUP',
        groupName: name,
        data: L,
      });
      continue;
    }

    if (!L && S && !R) {
      groupsActions.push({
        type: 'DELETE_GROUP',
        groupName: name,
      });
      continue;
    }

    if (L && S && !R) {
      groupsActions.push({
        type: 'DELETE_GROUP',
        groupName: name,
      });
      continue;
    }

    if (!L && S && R) {
      const newer = R.updatedAt > S.updatedAt ? R : S;
      finalGroups[name] = newer;
      continue;
    }

    if (L && !S && R) {
      const newer = L.updatedAt >= R.updatedAt ? L : R;
      finalGroups[name] = newer;
      continue;
    }

    if (L && S && R) {
      const newer = L.updatedAt >= R.updatedAt ? L : R;
      finalGroups[name] = newer;
      continue;
    }
  }

  return { finalGroups, groupsActions };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if data is TabData
 */
function isTabData(data: TabData | GroupMeta): data is TabData {
  return 'url' in data && 'title' in data && 'group' in data;
}

/**
 * Generate a deterministic ID from URL
 */
function generateId(url: string): string {
  const timestamp = Date.now().toString(36);
  const hash = url
    .split('')
    .reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0)
    .toString(36);
  return `${timestamp}-${hash}`;
}

// ============================================================================
// WebDAV Operations
// ============================================================================

/**
 * Upload sync data to WebDAV
 */
export async function uploadToWebDAV(
  data: SyncData,
  webdavClient: {
    upload: (data: string) => Promise<boolean>;
  }
): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  return await webdavClient.upload(json);
}

/**
 * Download sync data from WebDAV
 * Returns empty object on 404 (not found)
 */
export async function downloadFromWebDAV(webdavClient: {
  download: () => Promise<string | null>;
}): Promise<Record<string, TabData>> {
  try {
    const json = await webdavClient.download();
    if (!json) return {};

    const data = JSON.parse(json) as SyncData;
    return data.tabs || {};
  } catch (error) {
    return {};
  }
}

// ============================================================================
// Storage Operations
// ============================================================================

/**
 * Save snapshot to chrome.storage.local
 */
export async function saveSnapshot(snapshot: SyncData): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [SNAPSHOT_KEY]: snapshot }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get snapshot from chrome.storage.local
 */
export async function getSnapshot(): Promise<Record<string, TabData>> {
  return new Promise(resolve => {
    chrome.storage.local.get(SNAPSHOT_KEY, result => {
      const snapshot = result[SNAPSHOT_KEY] as SyncData | undefined;
      resolve(snapshot?.tabs || {});
    });
  });
}

/**
 * Get snapshot with groups from chrome.storage.local
 */
export async function getFullSnapshot(): Promise<SyncData | null> {
  return new Promise(resolve => {
    chrome.storage.local.get(SNAPSHOT_KEY, result => {
      resolve((result[SNAPSHOT_KEY] as SyncData | undefined) || null);
    });
  });
}

/**
 * Clear snapshot (for testing or reset)
 */
export async function clearSnapshot(): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.remove(SNAPSHOT_KEY, () => {
      resolve();
    });
  });
}

/**
 * Convert SyncData tabs to TabItem array
 */
export function denormalizeTabs(tabsMap: Record<string, TabData>): TabItem[] {
  return Object.values(tabsMap).map(tab => ({
    id: generateId(tab.url),
    url: tab.url,
    title: tab.title,
    favicon: undefined,
    groupId: undefined, // Will be set when saving to storage
    createdAt: tab.updatedAt,
    updatedAt: tab.updatedAt,
    syncStatus: 'synced' as const,
  }));
}

/**
 * Convert local TabItem array to Record<url, TabData>
 */
export function normalizeLocalTabs(tabs: TabItem[]): Record<string, TabData> {
  const result: Record<string, TabData> = {};

  for (const tab of tabs) {
    result[tab.url] = {
      url: tab.url,
      title: tab.title,
      group: tab.groupId || '', // TODO: Need to map groupId to groupName
      updatedAt: tab.updatedAt,
    };
  }

  return result;
}

// ============================================================================
// Main Sync Function
// ============================================================================

/**
 * Perform the complete three-way sync operation
 */
export async function performSync(params: {
  webdavClient: {
    download: () => Promise<string | null>;
    upload: (data: string) => Promise<boolean>;
  };
  getLocalTabs: () => Promise<TabItem[]>;
  getGroups: () => Promise<Group[]>;
  saveTabs: (tabs: TabItem[]) => Promise<void>;
  deleteTabsByUrl: (urls: string[]) => Promise<void>;
  createTab: (url: string) => Promise<void>;
  closeTabs: (tabIds: number[]) => Promise<void>;
}): Promise<SyncResult> {
  const { webdavClient, getLocalTabs, getGroups, saveTabs, deleteTabsByUrl, createTab, closeTabs } =
    params;

  try {
    // Step 1: Get Local tabs
    const localTabs = await getLocalTabs();
    const localMap = normalizeLocalTabs(localTabs);

    // Step 2: Get Snapshot from storage.local
    const snapshotMap = await getSnapshot();

    // Step 3: Download Remote from WebDAV
    const remoteMap = await downloadFromWebDAV(webdavClient);

    // Step 4: Get groups
    const localGroups = await getGroups();
    const groupMap: Record<string, GroupMeta> = {};
    for (const group of localGroups) {
      groupMap[group.name] = {
        name: group.name,
        color: group.color || '#3b82f6', // Default blue
        updatedAt: group.updatedAt,
      };
    }

    // Get remote groups (for now, derive from tabs or empty)
    // In full implementation, groups would be stored separately
    const remoteGroups: Record<string, GroupMeta> = {};

    // Step 5: Perform Three-Way Merge
    const tabsResult = mergeTabs(localMap, snapshotMap, remoteMap);
    const groupsResult = mergeGroups(groupMap, {}, remoteGroups);

    // Count actions by type
    let addedToLocal = 0;
    let deletedFromLocal = 0;
    let addedToRemote = 0;
    let deletedFromRemote = 0;

    // Step 6: Apply actions
    const tabsToDelete: string[] = [];
    const tabsToAdd: TabData[] = [];
    const tabIdsToClose: number[] = [];

    for (const action of tabsResult.actions) {
      switch (action.type) {
        case 'ADD_TAB':
          if (action.data && isTabData(action.data)) {
            tabsToAdd.push(action.data);
            addedToRemote++; // Need to upload to remote
          }
          break;
        case 'DELETE_TAB':
          tabsToDelete.push(action.url!);
          deletedFromRemote++; // Need to delete from remote
          break;
      }
    }

    // Apply to local: ADD_TAB → open in browser
    for (const tab of tabsToAdd) {
      // Check if URL is already open
      const existingTabs = await chrome.tabs.query({ url: tab.url });
      if (!existingTabs || existingTabs.length === 0) {
        await createTab(tab.url);
        addedToLocal++;
      }
    }

    // Apply to local: DELETE_TAB → close if open
    for (const url of tabsToDelete) {
      const existingTabs = await chrome.tabs.query({ url });
      if (existingTabs && existingTabs.length > 0) {
        for (const t of existingTabs) {
          if (t.id) {
            tabIdsToClose.push(t.id);
          }
        }
        deletedFromLocal++;
      }
    }

    // Close tabs in batch
    if (tabIdsToClose.length > 0) {
      await closeTabs(tabIdsToClose);
    }

    // Delete tabs from local storage
    if (tabsToDelete.length > 0) {
      await deleteTabsByUrl(tabsToDelete);
    }

    // Step 7: Save merged result to local storage
    const finalSyncData: SyncData = {
      version: SYNC_DATA_VERSION,
      updatedAt: Date.now(),
      tabs: tabsResult.finalTabs,
      groups: groupsResult.finalGroups,
    };

    await saveTabs(denormalizeTabs(tabsResult.finalTabs));
    await saveSnapshot(finalSyncData);

    // Step 8: Upload to WebDAV
    const uploadSuccess = await uploadToWebDAV(finalSyncData, webdavClient);
    if (!uploadSuccess) {
      throw new Error('Failed to upload to WebDAV');
    }

    return {
      success: true,
      addedToLocal,
      deletedFromLocal,
      addedToRemote,
      deletedFromRemote,
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      addedToLocal: 0,
      deletedFromLocal: 0,
      addedToRemote: 0,
      deletedFromRemote: 0,
      error: errorMessage,
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if sync is needed (compare local vs snapshot)
 * Requires a getLocalTabs function to be passed
 */
export async function checkSyncNeeded(getLocalTabs: () => Promise<TabItem[]>): Promise<boolean> {
  const localTabs = await getLocalTabs();
  const snapshotMap = await getSnapshot();

  const localUrls = Object.keys(normalizeLocalTabs(localTabs));
  const snapshotUrls = Object.keys(snapshotMap);

  if (localUrls.length !== snapshotUrls.length) return true;

  const localSet = new Set(localUrls);
  for (const url of snapshotUrls) {
    if (!localSet.has(url)) return true;
  }

  return false;
}

/**
 * Get sync status (for UI display)
 * Requires getLocalTabs function to be passed
 */
export async function getSyncStatus(getLocalTabs: () => Promise<TabItem[]>): Promise<{
  lastSync: number | null;
  localCount: number;
  remoteCount: number;
}> {
  const snapshot = await getFullSnapshot();
  const localTabs = await getLocalTabs();

  return {
    lastSync: snapshot?.updatedAt || null,
    localCount: Object.keys(normalizeLocalTabs(localTabs)).length,
    remoteCount: snapshot ? Object.keys(snapshot.tabs).length : 0,
  };
}
