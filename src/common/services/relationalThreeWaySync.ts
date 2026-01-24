/**
 * Relational Three-Way Merge Synchronization Service
 *
 * A strict synchronization mechanism using snapshot-based conflict resolution.
 * NO deleted flags - physical deletion only.
 *
 * Relational Model:
 * - Groups reference by ID (Record<string, GroupData>)
 * - Tabs reference Groups via groupId (TabData.groupId)
 *
 * Architecture:
 * - Remote JSON: groups Record<id, GroupData>, tabs Record<url, TabData>
 * - Snapshot stored in chrome.storage.local
 * - Three-way merge: Local vs Snapshot vs Remote
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Group Data (The Container)
 * NO 'deleted' field - physical deletion only
 * Key = Group ID (id)
 */
export interface GroupData {
  id: string; // Unique Group ID (e.g., "mkqcs538...")
  name: string;
  color: string;
  updatedAt: number;
}

/**
 * Tab Data (The Content)
 * NO 'deleted' field - physical deletion only
 * Key = URL
 */
export interface TabData {
  url: string; // Unique Identifier (Key)
  title: string;
  groupId: string; // REFERENCE to GroupData.id
  pinned: boolean;
  updatedAt: number;
}

/**
 * Complete sync data structure
 * Both cloud data.json and local Snapshot use this structure
 */
export interface SyncData {
  version: number; // Schema version
  updatedAt: number; // Last sync time
  groups: Record<string, GroupData>; // Key = Group ID
  tabs: Record<string, TabData>; // Key = URL
}

/**
 * Merge result type
 */
export type MergeResult<T> = {
  merged: Record<string, T>;
  addedToLocal: string[];
  addedToRemote: string[];
  deletedFromLocal: string[];
  deletedFromRemote: string[];
};

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  addedToLocal: number;
  deletedFromLocal: number;
  addedToRemote: number;
  deletedFromRemote: number;
  conflicts: number;
  integrityRepairs: number;
  error?: string;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const SYNC_DATA_VERSION = 1;
const SNAPSHOT_KEY = 'relational_sync_snapshot';
const DEFAULT_GROUP_ID = 'default';

// ============================================================================
// Three-Way Merge Algorithm - Core Logic Matrix
// ============================================================================

/**
 * Generic Three-Way Merge Algorithm for any Map
 *
 * Logic Matrix (Snapshot-based comparison):
 * | Local(L) | Snapshot(S) | Remote(R) | Action                    |
 * |----------|-------------|-----------|---------------------------|
 * | Null     | Null        | Exists    | ADD to Local              |
 * | Exists   | Null        | Null      | ADD to Remote             |
 * | Null     | Exists      | Exists    | DELETE from Remote        |
 * | Exists   | Exists      | Null      | DELETE from Local         |
 * | Exists   | Null        | Exists    | Keep Newer (Zombie)       |
 * | Exists   | Exists      | Exists    | Keep Newer (Conflict)     |
 *
 * @param localMap - Current local state
 * @param snapshotMap - Last known state (from storage)
 * @param remoteMap - Remote state (from WebDAV)
 * @returns Merge result with all actions
 */
export function mergeThreeWay<T extends { updatedAt: number }>(
  localMap: Record<string, T>,
  snapshotMap: Record<string, T>,
  remoteMap: Record<string, T>
): MergeResult<T> {
  const result: MergeResult<T> = {
    merged: {},
    addedToLocal: [],
    addedToRemote: [],
    deletedFromLocal: [],
    deletedFromRemote: [],
  };

  // Get all unique keys from all three sources
  const allKeys = new Set([
    ...Object.keys(localMap),
    ...Object.keys(snapshotMap),
    ...Object.keys(remoteMap),
  ]);

  for (const key of allKeys) {
    const L = localMap[key];
    const S = snapshotMap[key];
    const R = remoteMap[key];

    // Case 1: L=null, S=null, R=exists → ADD to Local
    // New data from another device
    if (!L && !S && R) {
      result.merged[key] = R;
      result.addedToLocal.push(key);
      continue;
    }

    // Case 2: L=exists, S=null, R=null → ADD to Remote
    // New data created locally
    if (L && !S && !R) {
      result.merged[key] = L;
      result.addedToRemote.push(key);
      continue;
    }

    // Case 3: L=null, S=exists, R=null → DELETE from Remote
    // User deleted it locally (present in S but not in L)
    // Physical deletion: don't add to merged
    if (!L && S && !R) {
      result.deletedFromRemote.push(key);
      continue;
    }

    // Case 4: L=exists, S=exists, R=null → DELETE from Local
    // User deleted it on another device
    // Physical deletion: don't add to merged
    if (L && S && !R) {
      result.deletedFromLocal.push(key);
      continue;
    }

    // Case 5: L=null, S=exists, R=exists → Keep Newer (Zombie resurrection)
    // L is new (not in S), R is old (in S)
    // This handles the case where data was deleted locally but still exists remotely
    if (!L && S && R) {
      const newer = R.updatedAt > S.updatedAt ? R : S;
      result.merged[key] = newer;
      if (R.updatedAt > S.updatedAt) {
        // Remote is newer, so local deletion should propagate
        result.deletedFromLocal.push(key);
      } else {
        // Snapshot is newer, so remote should get the data
        result.addedToLocal.push(key);
      }
      continue;
    }

    // Case 6: L=exists, S=null, R=exists → Keep Newer (Zombie variant)
    // L is new (not in S), R exists
    if (L && !S && R) {
      const newer = L.updatedAt >= R.updatedAt ? L : R;
      result.merged[key] = newer;
      if (L.updatedAt > R.updatedAt) {
        // Local is newer, upload to remote
        result.addedToRemote.push(key);
      }
      continue;
    }

    // Case 7: L=exists, S=exists, R=exists → Keep Newer (Conflict resolution)
    // Both modified, compare timestamps
    if (L && S && R) {
      const newer = L.updatedAt >= R.updatedAt ? L : R;
      result.merged[key] = newer;
      if (L.updatedAt > R.updatedAt && L.updatedAt !== S.updatedAt) {
        // Local is newer and different from snapshot, upload
        result.addedToRemote.push(key);
      } else if (R.updatedAt > L.updatedAt && R.updatedAt !== S.updatedAt) {
        // Remote is newer, download
        result.addedToLocal.push(key);
      }
      continue;
    }

    // Case 8: L=null, S=null, R=null → Should not happen, skip
  }

  return result;
}

// ============================================================================
// Step A: mergeGroups
// ============================================================================

/**
 * Merge groups using the Logic Matrix
 * Uses id as the key
 *
 * @param localGroups - Current local groups
 * @param snapshotGroups - Last known groups state
 * @param remoteGroups - Remote groups from WebDAV
 * @returns Merged groups map
 */
export function mergeGroups(
  localGroups: Record<string, GroupData>,
  snapshotGroups: Record<string, GroupData>,
  remoteGroups: Record<string, GroupData>
): Record<string, GroupData> {
  const result = mergeThreeWay(localGroups, snapshotGroups, remoteGroups);
  return result.merged;
}

// ============================================================================
// Step B: mergeTabs
// ============================================================================

/**
 * Merge tabs using the Logic Matrix
 * Uses url as the key
 *
 * @param localTabs - Current local tabs
 * @param snapshotTabs - Last known tabs state
 * @param remoteTabs - Remote tabs from WebDAV
 * @returns Merged tabs map
 */
export function mergeTabs(
  localTabs: Record<string, TabData>,
  snapshotTabs: Record<string, TabData>,
  remoteTabs: Record<string, TabData>
): Record<string, TabData> {
  const result = mergeThreeWay(localTabs, snapshotTabs, remoteTabs);
  return result.merged;
}

// ============================================================================
// Integrity Check
// ============================================================================

/**
 * Check and fix orphaned tabs
 * If a tab has a groupId that does NOT exist in finalGroups,
 * set its groupId to a default value
 *
 * @param tabs - Merged tabs
 * @param groups - Merged groups
 * @returns Number of repairs made
 */
export function fixOrphanedTabs(
  tabs: Record<string, TabData>,
  groups: Record<string, GroupData>
): number {
  let repairs = 0;
  const groupIds = new Set(Object.keys(groups));

  for (const tab of Object.values(tabs)) {
    if (tab.groupId && !groupIds.has(tab.groupId)) {
      // Tab references a group that doesn't exist
      tab.groupId = DEFAULT_GROUP_ID;
      repairs++;
    }
  }

  return repairs;
}

// ============================================================================
// Data Conversion Utilities
// ============================================================================

/**
 * Convert SyncData to local format
 */
export function syncDataToLocalTabs(syncData: SyncData): Array<{
  id: string;
  url: string;
  title: string;
  groupId?: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'synced';
}> {
  return Object.values(syncData.tabs).map(tab => ({
    id: generateTabId(tab.url),
    url: tab.url,
    title: tab.title,
    groupId: tab.groupId || undefined,
    pinned: tab.pinned,
    createdAt: tab.updatedAt,
    updatedAt: tab.updatedAt,
    syncStatus: 'synced' as const,
  }));
}

/**
 * Convert local tabs to SyncData format
 */
export function localTabsToSyncData(
  localTabs: Array<{
    url: string;
    title: string;
    groupId?: string;
    pinned: boolean;
    updatedAt: number;
  }>
): Record<string, TabData> {
  const result: Record<string, TabData> = {};
  for (const tab of localTabs) {
    result[tab.url] = {
      url: tab.url,
      title: tab.title,
      groupId: tab.groupId || '',
      pinned: tab.pinned,
      updatedAt: tab.updatedAt,
    };
  }
  return result;
}

/**
 * Convert local groups to SyncData format
 */
export function localGroupsToSyncData(
  localGroups: Array<{
    id: string;
    name: string;
    color?: string;
    updatedAt: number;
  }>
): Record<string, GroupData> {
  const result: Record<string, GroupData> = {};
  for (const group of localGroups) {
    result[group.id] = {
      id: group.id,
      name: group.name,
      color: group.color || '#3b82f6',
      updatedAt: group.updatedAt,
    };
  }
  return result;
}

/**
 * Generate a deterministic ID from URL
 */
function generateTabId(url: string): string {
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
export async function getSnapshot(): Promise<SyncData | null> {
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
 * Returns empty structure on 404 (not found)
 */
export async function downloadFromWebDAV(webdavClient: {
  download: () => Promise<string | null>;
}): Promise<SyncData> {
  try {
    const json = await webdavClient.download();
    if (!json) {
      return createEmptySyncData();
    }

    const data = JSON.parse(json) as SyncData;
    return {
      version: data.version || SYNC_DATA_VERSION,
      updatedAt: data.updatedAt || Date.now(),
      groups: data.groups || {},
      tabs: data.tabs || {},
    };
  } catch (error) {
    console.error('[RelationalSync] Download failed:', error);
    return createEmptySyncData();
  }
}

/**
 * Create empty sync data structure
 */
function createEmptySyncData(): SyncData {
  return {
    version: SYNC_DATA_VERSION,
    updatedAt: Date.now(),
    groups: {},
    tabs: {},
  };
}

// ============================================================================
// Step C: performSync - The Orchestrator
// ============================================================================

/**
 * Perform the complete three-way sync operation
 *
 * Process:
 * 1. Load Data: Get Local (Browser), Snapshot (Storage), Remote (WebDAV)
 * 2. Merge Groups FIRST: Call mergeGroups → finalGroups
 * 3. Merge Tabs SECOND: Call mergeTabs → finalTabs
 * 4. Integrity Check: Fix orphaned tabs (groupId not in finalGroups)
 * 5. Apply & Save: Update Browser, Upload to WebDAV, Save Snapshot
 *
 * @param params - Sync parameters
 * @returns Sync result
 */
export async function performSync(params: {
  webdavClient: {
    download: () => Promise<string | null>;
    upload: (data: string) => Promise<boolean>;
  };
  getLocalTabs: () => Promise<
    Array<{
      url: string;
      title: string;
      groupId?: string;
      pinned: boolean;
      updatedAt: number;
    }>
  >;
  getLocalGroups: () => Promise<
    Array<{
      id: string;
      name: string;
      color?: string;
      updatedAt: number;
    }>
  >;
  saveLocalTabs: (
    tabs: Array<{
      id: string;
      url: string;
      title: string;
      groupId?: string;
      pinned: boolean;
      createdAt: number;
      updatedAt: number;
      syncStatus: 'synced';
    }>
  ) => Promise<void>;
  saveLocalGroups: (
    groups: Array<{
      id: string;
      name: string;
      color?: string;
      updatedAt: number;
    }>
  ) => Promise<void>;
  deleteLocalTabsByUrl: (urls: string[]) => Promise<void>;
}): Promise<SyncResult> {
  const {
    webdavClient,
    getLocalTabs,
    getLocalGroups,
    saveLocalTabs,
    saveLocalGroups,
    deleteLocalTabsByUrl,
  } = params;

  try {
    // Step 1: Load Data

    // Get Local (Browser)
    const localTabsInput = await getLocalTabs();
    const localGroupsInput = await getLocalGroups();

    const localTabs = localTabsToSyncData(localTabsInput);
    const localGroups = localGroupsToSyncData(localGroupsInput);

    // Get Snapshot (Storage)
    const snapshot = await getSnapshot();
    const snapshotGroups = snapshot?.groups || {};
    const snapshotTabs = snapshot?.tabs || {};

    // Get Remote (WebDAV)
    const remoteData = await downloadFromWebDAV(webdavClient);
    const remoteGroups = remoteData.groups;
    const remoteTabs = remoteData.tabs;

    // Step 2: Merge Groups FIRST
    const groupsMergeResult = mergeThreeWay(localGroups, snapshotGroups, remoteGroups);
    const finalGroups = groupsMergeResult.merged;

    // Step 3: Merge Tabs SECOND
    const tabsMergeResult = mergeThreeWay(localTabs, snapshotTabs, remoteTabs);
    const finalTabs = tabsMergeResult.merged;

    // Step 4: Integrity Check
    const integrityRepairs = fixOrphanedTabs(finalTabs, finalGroups);

    // Get stats from merge result
    const addedToLocal = tabsMergeResult.addedToLocal.length;
    const deletedFromLocal = tabsMergeResult.deletedFromLocal.length;
    const addedToRemote = tabsMergeResult.addedToRemote.length;
    const deletedFromRemote = tabsMergeResult.deletedFromRemote.length;
    const conflicts =
      tabsMergeResult.addedToLocal.filter(k => tabsMergeResult.addedToRemote.includes(k)).length +
      tabsMergeResult.addedToRemote.filter(k => tabsMergeResult.addedToLocal.includes(k)).length;

    // Step 5: Apply & Save

    // 5a. Update Browser Tabs
    // Convert sync format back to local format
    const localFormatTabs = syncDataToLocalTabs({
      version: SYNC_DATA_VERSION,
      updatedAt: Date.now(),
      groups: finalGroups,
      tabs: finalTabs,
    });
    await saveLocalTabs(localFormatTabs);

    // 5b. Update Browser Groups
    await saveLocalGroups(
      Object.values(finalGroups).map(g => ({
        id: g.id,
        name: g.name,
        color: g.color,
        updatedAt: g.updatedAt,
      }))
    );

    // 5c. Upload to WebDAV
    const finalSyncData: SyncData = {
      version: SYNC_DATA_VERSION,
      updatedAt: Date.now(),
      groups: finalGroups,
      tabs: finalTabs,
    };
    const uploadSuccess = await uploadToWebDAV(finalSyncData, webdavClient);
    if (!uploadSuccess) {
      throw new Error('Failed to upload to WebDAV');
    }

    // 5d. Save Snapshot to chrome.storage.local
    await saveSnapshot(finalSyncData);

    // 5e. Delete tabs that were removed from local
    // These are the tabs that exist in snapshot but not in finalTabs
    const deletedTabUrls = Object.keys(snapshotTabs).filter(url => !finalTabs[url]);
    if (deletedTabUrls.length > 0) {
      await deleteLocalTabsByUrl(deletedTabUrls);
    }

    return {
      success: true,
      addedToLocal,
      deletedFromLocal,
      addedToRemote,
      deletedFromRemote,
      conflicts,
      integrityRepairs,
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[RelationalSync] Sync failed:', error);

    return {
      success: false,
      addedToLocal: 0,
      deletedFromLocal: 0,
      addedToRemote: 0,
      deletedFromRemote: 0,
      conflicts: 0,
      integrityRepairs: 0,
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
 */
export async function checkSyncNeeded(
  getLocalTabs: () => Promise<
    Array<{
      url: string;
      title: string;
      groupId?: string;
      pinned: boolean;
      updatedAt: number;
    }>
  >
): Promise<boolean> {
  const localTabs = await getLocalTabs();
  const snapshot = await getSnapshot();

  if (!snapshot) return true;

  const localUrls = new Set(Object.keys(localTabsToSyncData(localTabs)));
  const snapshotUrls = new Set(Object.keys(snapshot.tabs));

  if (localUrls.size !== snapshotUrls.size) return true;

  for (const url of snapshotUrls) {
    if (!localUrls.has(url)) return true;
  }

  return false;
}

/**
 * Get sync status (for UI display)
 */
export async function getSyncStatus(
  getLocalTabs: () => Promise<
    Array<{
      url: string;
      title: string;
      groupId?: string;
      pinned: boolean;
      updatedAt: number;
    }>
  >
): Promise<{
  lastSync: number | null;
  localCount: number;
  remoteCount: number;
}> {
  const snapshot = await getSnapshot();
  const localTabs = await getLocalTabs();

  return {
    lastSync: snapshot?.updatedAt || null,
    localCount: Object.keys(localTabsToSyncData(localTabs)).length,
    remoteCount: snapshot ? Object.keys(snapshot.tabs).length : 0,
  };
}
