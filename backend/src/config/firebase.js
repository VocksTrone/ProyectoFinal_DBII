const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const config = require('./env');

let firestore = null;
let isFirebaseInitialized = false;

/**
 * Inicializar Firebase Admin SDK (Clínica Odontológica)
 */
const initFirebase = () => {
  if (admin.apps.length > 0) {
    firestore = admin.firestore();
    isFirebaseInitialized = true;
    return firestore;
  }

  try {
    const serviceAccountPath = config.firebase.serviceAccountPath
      ? path.resolve(process.cwd(), config.firebase.serviceAccountPath)
      : null;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ [Clínica Odontológica] Firebase inicializado con archivo Service Account');
      firestore = admin.firestore();
      isFirebaseInitialized = true;
    } else if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
      console.log('✅ [Clínica Odontológica] Firebase inicializado con variables de entorno');
      firestore = admin.firestore();
      isFirebaseInitialized = true;
    } else {
      console.warn(
        '⚠️  [Clínica Odontológica] Firebase no configurado aún (colocar service account en .env o archivo JSON)'
      );
    }
  } catch (error) {
    console.error('❌ [Clínica Odontológica] Error inicializando Firebase:', error.message);
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
  admin,
  initFirebase,
  getFirestore,
  isFirebaseReady: () => isFirebaseInitialized,
};
