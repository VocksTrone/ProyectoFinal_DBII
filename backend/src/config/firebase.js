const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore: getFirestoreInstance } = require('firebase-admin/firestore');
const config = require('./env');

let firestore = null;
let isFirebaseInitialized = false;

const initFirebase = () => {
  if (getApps().length > 0) {
    if (!firestore) {
      firestore = getFirestoreInstance();
    }
    isFirebaseInitialized = true;
    return firestore;
  }

  try {
    let serviceAccountPath = null;
    const candidatePaths = [
      config.firebase.serviceAccountPath ? path.resolve(process.cwd(), config.firebase.serviceAccountPath) : null,
      config.firebase.serviceAccountPath ? path.resolve(__dirname, '../../', config.firebase.serviceAccountPath) : null,
      path.resolve(__dirname, 'firebase-key.json'),
      path.resolve(__dirname, '../../../credentials/clinica_odontologica_firebase.json'),
    ].filter(Boolean);

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        serviceAccountPath = candidate;
        break;
      }
    }

    if (serviceAccountPath) {
      const serviceAccount = require(serviceAccountPath);
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      firestore = getFirestoreInstance(app);
      isFirebaseInitialized = true;
      console.log(`[Clínica Odontológica] Firebase Firestore inicializado con (${path.basename(serviceAccountPath)})`);
    } else if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      const app = initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
      firestore = getFirestoreInstance(app);
      isFirebaseInitialized = true;
      console.log('[Clínica Odontológica] Firebase Firestore inicializado con variables de entorno');
    } else {
      console.warn(
        '[Clínica Odontológica] Firebase no configurado aún (colocar service account en .env o archivo JSON)'
      );
    }
  } catch (error) {
    console.error('[Clínica Odontológica] Error inicializando Firebase:', error.message);
  }

  return firestore;
};

const getFirestore = () => {
  if (!firestore && !isFirebaseInitialized) {
    return initFirebase();
  }
  return firestore;
};

module.exports = {
  initFirebase,
  getFirestore,
  isFirebaseReady: () => isFirebaseInitialized,
};
