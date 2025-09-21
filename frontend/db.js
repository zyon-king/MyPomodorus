const DB_NAME = 'MyPomodorusDB';
const DB_VERSION = 1;
const STORE_NAME = 'pausas';
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Banco de dados IndexedDB aberto com sucesso.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function addPausa(pausa) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(pausa);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Erro ao adicionar pausa: ' + event.target.error);
    });
}

function getAllPausas() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Erro ao buscar pausas: ' + event.target.error);
    });
}

function deletePausa(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Erro ao deletar pausa: ' + event.target.error);
    });
}
