# Contrato común de la API

El frontend siempre llama a las mismas rutas. El backend lee la institución del usuario (del token) y manda la operación al adaptador de su motor.

| Institución | Código | Motor | Responsable |
|---|---|---|---|
| Hospital General | `hospital` | PostgreSQL | Mily |
| Centro Médico Pediátrico | `pediatria` | MySQL | Javier |
| Clínica Odontológica | `odontologia` | Firebase | Javier |
| Laboratorio Clínico | `laboratorio` | MongoDB | Mily |

## 1. Login

- Cada institución guarda **sus propios usuarios** en su motor.
- El usuario lleva la institución: `rdiaz@hospital`, `gchoc@pediatria`.
- Contraseñas guardadas con hash (bcrypt), nunca en texto plano.

```
POST /api/auth/login   { "usuario": "rdiaz@hospital", "password": "..." }
→ { token, usuario: { id, nombre, rol, institucion } }
```

Token (JWT): `{ id, nombre, rol, institucion }`. Se envía en `Authorization: Bearer <token>`.

Roles:
- `medico` (incluye odontólogo y laboratorista): todo lo de su institución.
- `secretaria`: datos personales, citas y archivo. **No** ve diagnósticos, tratamientos, recetas ni resultados.

## 2. Rutas comunes

Todas requieren token.

| Método | Ruta | Qué hace | Rol |
|---|---|---|---|
| GET | `/api/pacientes?buscar=texto` | Lista / búsqueda | ambos |
| POST | `/api/pacientes` | Registrar paciente nuevo | ambos |
| GET | `/api/pacientes/:id` | Ficha del paciente | ambos |
| GET | `/api/pacientes/:id/historial` | Historial completo | medico |
| PATCH | `/api/pacientes/:id/archivar` | Archivar `{ motivo }` | ambos |
| POST | `/api/pacientes/:id/atenciones` | Consulta + diagnósticos + receta (todo o nada) | medico |
| GET | `/api/catalogos/:tipo` | `medicamentos`, `especialidades`, `examenes`… | ambos |

Rutas propias (cada quien las define en su módulo):

- `/api/hospital/...` → citas, internamientos
- `/api/laboratorio/...` → órdenes, resultados
- `/api/pediatria/...` → controles de crecimiento, vacunas
- `/api/odontologia/...` → citas, odontograma

## 3. Formato de datos

Reglas generales:
- `id` siempre como **string** (aunque en SQL sea número).
- Fechas en formato `YYYY-MM-DD`; fecha y hora en ISO.
- `sexo`: `"M"` o `"F"`.
- `estado` del paciente: `"activo"` o `"archivado"`.

### Paciente

```json
{
  "id": "15",
  "dpi": "1234567890101",
  "nombres": "Ana",
  "apellidos": "López",
  "fecha_nacimiento": "1990-05-20",
  "sexo": "F",
  "telefono": "55551234",
  "correo": "ana@mail.com",
  "direccion": "Zona 1",
  "estado": "activo",
  "extra": {}
}
```

`extra` lleva lo propio de cada institución (tipo de sangre, encargado del menor, contacto de emergencia…).

### Atención (registrar)

`POST /api/pacientes/:id/atenciones`

```json
{
  "motivo": "Dolor de cabeza",
  "notas": "Paciente refiere...",
  "diagnosticos": [
    {
      "nombre": "Migraña",
      "tipo": "presuntivo",
      "codigo": "G43",
      "descripcion": "...",
      "tratamientos": [
        { "descripcion": "Reposo", "duracion_dias": 3, "fecha_inicio": "2026-11-04" }
      ]
    }
  ],
  "receta": {
    "medicamentos": [
      { "id_medicamento": "4", "dosis": "500 mg", "frecuencia": "cada 8 horas",
        "via": "oral", "duracion_dias": 5, "indicaciones": "Después de comer" }
    ]
  },
  "extra": {}
}
```

- Si algo falla, **no se guarda nada** (transacción).
- `receta` es opcional.
- Laboratorio: la atención es la **orden de examen** y los diagnósticos son los **resultados** (van en `extra`). `receta` no aplica.

### Historial (respuesta)

```json
{
  "paciente": { "...": "Paciente" },
  "antecedentes": [ { "tipo": "alergia", "descripcion": "Penicilina", "fecha": "2020-01-10" } ],
  "atenciones": [
    { "id": "8", "fecha": "2026-11-04", "profesional": "Dr. Roberto Díaz",
      "motivo": "...", "notas": "...", "diagnosticos": [], "receta": null, "extra": {} }
  ]
}
```

Las atenciones van de la más reciente a la más antigua.

## 4. Respuestas y errores

Éxito (ya existe `sendSuccess`):

```json
{ "status": "success", "message": "...", "data": {}, "timestamp": "..." }
```

Error (ya existe `AppError`):

```json
{ "status": "fail", "message": "...", "details": [] }
```

| Código | Cuándo |
|---|---|
| 400 | Datos inválidos |
| 401 | Sin token o token inválido |
| 403 | El rol no tiene permiso |
| 404 | No existe |
| 409 | Duplicado (DPI) o paciente archivado al que se le intenta registrar algo |

## 5. Adaptador (lo que implementa cada motor)

Cada motor crea `src/adaptadores/<motor>/` y exporta un objeto con **estas funciones**. Todas devuelven datos con el formato de la sección 3.

```js
module.exports = {
  buscarUsuario(usuario),                 // "rdiaz" (sin @institucion) -> { id, nombre, rol, password_hash } o null
  buscarPacientes(texto),                 // [Paciente]
  crearPaciente(datos),                   // Paciente
  obtenerPaciente(id),                    // Paciente o null
  obtenerHistorial(id),                   // Historial o null
  archivarPaciente(id, motivo),           // Paciente
  registrarAtencion(idPaciente, datos, usuario), // Atención
  obtenerCatalogo(tipo),                  // [ { id, nombre, ... } ]
};
```

La lógica común (validar, revisar roles, rechazar pacientes archivados) va en `src/core/`. El core nunca importa un motor directamente.

Para activar una institución basta con crear `src/adaptadores/<motor>/index.js` (`postgres`, `mongodb`, `mysql`, `firebase`). Mientras no exista, sus rutas responden 503.

Los usuarios se guardan en cada motor con: `usuario`, `nombre`, `rol` (`medico` o `secretaria`) y `password_hash` (bcrypt, `bcryptjs`).
