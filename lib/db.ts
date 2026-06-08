import { ParsedFile } from '@/types/data';

const DB_NAME = 'AxiomDB';
const DB_VERSION = 1;
const STORE_NAME = 'parsedFiles';
const FILE_KEY = 'currentFile';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveFileToDB(file: ParsedFile): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, FILE_KEY);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function getFileFromDB(): Promise<ParsedFile | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(FILE_KEY);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

export async function deleteFileFromDB(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(FILE_KEY);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}
