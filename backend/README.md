# Red de Instituciones Médicas - Backend API

Backend unificado multi-base de datos para el Proyecto Final del curso de **Bases de Datos II (Universidad Rafael Landívar)**.

Este sistema implementa una arquitectura modular donde cada institución de la red médica cuenta con su propio motor de base de datos y paradigma de almacenamiento:

| Institución | Paradigma | Motor de Base de Datos | Módulo / Prefijo |
|---|---|---|---|
| **Hospital General** | Relacional (3FN) | PostgreSQL (`pg`, `sequelize`) | `/api/hospital` |
| **Centro Médico Pediátrico** | Relacional | MySQL (`mysql2`, `sequelize`) | `/api/pediatria` |
| **Clínica Odontológica** | NoSQL Documental | Firebase Firestore (`firebase-admin`) | `/api/odontologia` |
| **Laboratorio Clínico** | NoSQL Documental | MongoDB (`mongoose`) | `/api/laboratorio` |

---

## Estructura de Directorios

```
backend/
├── src/
│   ├── config/                  # Configuración de variables y conexiones DB
│   │   ├── env.js               # Carga y validación de variables de entorno
│   │   ├── postgres.js          # Conexión PG (Hospital General)
│   │   ├── mysql.js             # Conexión MySQL (Centro Pediátrico)
│   │   ├── firebase.js          # SDK Firebase (Clínica Odontológica)
│   │   └── mongodb.js           # Conexión Mongoose/Mongo (Laboratorio)
│   │
│   ├── modules/                 # Módulos divididos por institución médica
│   │   ├── hospital/            # 1. Hospital General (PostgreSQL)
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   ├── pediatria/           # 2. Centro Pediátrico (MySQL)
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   ├── odontologia/         # 3. Clínica Odontológica (Firebase)
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── laboratorio/         # 4. Laboratorio Clínico (MongoDB)
│   │       ├── controllers/
│   │       ├── models/
│   │       ├── routes/
│   │       └── services/
│   │
│   ├── middlewares/             # Middlewares globales
│   │   ├── auth.js              # Validación JWT
│   │   ├── error.js             # Manejo centralizado de errores (404, 500)
│   │   └── rbac.js              # Control de acceso basado en roles
│   │
│   ├── utils/                   # Utilidades y funciones de ayuda
│   │   └── helpers.js           # Estandarización de respuestas y asyncHandler
│   │
│   ├── app.js                   # Configuración Express
│   └── server.js                # Punto de entrada y arranque de servidores
│
├── .env                         # Variables de entorno secretas (no incluir en git)
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

---

## Instalación y Puesta en Marcha

### 1. Requisitos Previos
- **Node.js**: v18 o superior (probado en v22)
- **PostgreSQL**: puerto `5432`
- **MySQL**: puerto `3306`
- **MongoDB**: puerto `27017`
- Cuenta de Firebase con archivo Service Account (opcional en desarrollo inicial)

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env` y ajusta las credenciales de tus bases de datos:
```bash
cp .env.example .env
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Ejecutar en Modo Desarrollo
```bash
npm run dev
```

### 5. Ejecutar en Modo Producción
```bash
npm start
```

---

## Endpoints Principales

### Comprobación de Estado (Health Check)
- **`GET /api/health`**: Estado global de la API y de las 4 instituciones.

### 1. Hospital General (`/api/hospital`) - PostgreSQL
- `GET /api/hospital`: Estado y descripción del módulo.
- `GET /api/hospital/pacientes`: Listar pacientes.
- `POST /api/hospital/pacientes`: Registrar nuevo paciente.
- `GET /api/hospital/consultas`: Listar consultas médicas.
- `POST /api/hospital/consultas`: Crear consulta médica.

### 2. Centro Médico Pediátrico (`/api/pediatria`) - MySQL
- `GET /api/pediatria`: Estado y descripción del módulo.
- `GET /api/pediatria/pacientes`: Listar pacientes pediátricos y sus tutores.
- `POST /api/pediatria/pacientes`: Registrar paciente pediátrico.
- `GET /api/pediatria/tutores`: Listar tutores.
- `POST /api/pediatria/tutores`: Registrar tutor.
- `POST /api/pediatria/controles`: Registrar control de crecimiento (peso, talla, perímetro).

### 3. Clínica Odontológica (`/api/odontologia`) - Firebase Firestore
- `GET /api/odontologia`: Estado y conexión con Firebase.
- `GET /api/odontologia/pacientes`: Listar pacientes con su historial odontológico embebido.
- `POST /api/odontologia/pacientes`: Registrar paciente con historial odontológico.
- `GET /api/odontologia/citas`: Listar citas odontológicas.
- `POST /api/odontologia/citas`: Agendar cita odontológica.

### 4. Laboratorio Clínico (`/api/laboratorio`) - MongoDB
- `GET /api/laboratorio`: Estado y descripción del módulo.
- `GET /api/laboratorio/pacientes`: Listar pacientes de laboratorio.
- `POST /api/laboratorio/pacientes`: Registrar paciente en laboratorio.
- `GET /api/laboratorio/ordenes`: Listar órdenes de examen con resultados.
- `POST /api/laboratorio/ordenes`: Crear orden de examen.
- `POST /api/laboratorio/ordenes/:ordenId/resultados`: Agregar resultados embebidos a una orden.
