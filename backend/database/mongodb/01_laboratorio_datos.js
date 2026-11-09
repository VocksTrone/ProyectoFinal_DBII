// Carga los datos de prueba del laboratorio.
// Uso (desde backend/): node database/mongodb/01_laboratorio_datos.js
// Contraseña de los usuarios de prueba: Laboratorio2026!
// Ojo: borra lo que haya en las colecciones del laboratorio.

const bcrypt = require('bcryptjs');
const { mongoose, connectMongoDB } = require('../../src/config/mongodb');
const modelos = require('../../src/adaptadores/mongodb/modelos');

const { Usuario, Paciente, CatalogoExamen } = modelos;

const cargar = async () => {
  for (const modelo of Object.values(modelos)) {
    await modelo.collection.drop().catch(() => {});
    await modelo.createCollection();
    await modelo.syncIndexes();
  }

  const hash = await bcrypt.hash('Laboratorio2026!', 10);
  await Usuario.insertMany([
    { usuario: 'acastillo', nombre: 'Lic. Ana Castillo', rol: 'medico', password_hash: hash },
    { usuario: 'pramirez', nombre: 'Paola Ramírez', rol: 'secretaria', password_hash: hash },
  ]);

  await CatalogoExamen.insertMany([
    {
      codigo: 'HEM-001',
      nombre: 'Hematología completa',
      categoria: 'Hematología',
      preparacion: 'No requiere ayuno',
      parametros: [
        { nombre: 'Hemoglobina', unidad: 'g/dL', rango_referencia: '12 - 16' },
        { nombre: 'Hematocrito', unidad: '%', rango_referencia: '36 - 46' },
        { nombre: 'Leucocitos', unidad: 'x10³/µL', rango_referencia: '4.5 - 11' },
        { nombre: 'Plaquetas', unidad: 'x10³/µL', rango_referencia: '150 - 450' },
      ],
    },
    {
      codigo: 'QS-001',
      nombre: 'Glucosa en ayunas',
      categoria: 'Química sanguínea',
      preparacion: 'Ayuno de 8 horas',
      parametros: [{ nombre: 'Glucosa', unidad: 'mg/dL', rango_referencia: '70 - 100' }],
    },
    {
      codigo: 'QS-002',
      nombre: 'Perfil lipídico',
      categoria: 'Química sanguínea',
      preparacion: 'Ayuno de 12 horas',
      parametros: [
        { nombre: 'Colesterol total', unidad: 'mg/dL', rango_referencia: '< 200' },
        { nombre: 'HDL', unidad: 'mg/dL', rango_referencia: '> 40' },
        { nombre: 'LDL', unidad: 'mg/dL', rango_referencia: '< 130' },
        { nombre: 'Triglicéridos', unidad: 'mg/dL', rango_referencia: '< 150' },
      ],
    },
    {
      codigo: 'URO-001',
      nombre: 'Examen general de orina',
      categoria: 'Uroanálisis',
      preparacion: 'Primera orina de la mañana',
      parametros: [
        { nombre: 'Color', unidad: '', rango_referencia: 'Amarillo' },
        { nombre: 'Aspecto', unidad: '', rango_referencia: 'Claro' },
        { nombre: 'pH', unidad: '', rango_referencia: '4.5 - 8' },
        { nombre: 'Densidad', unidad: '', rango_referencia: '1.005 - 1.030' },
        { nombre: 'Proteínas', unidad: '', rango_referencia: 'Negativo' },
        { nombre: 'Glucosa', unidad: '', rango_referencia: 'Negativo' },
      ],
    },
    {
      codigo: 'MIC-001',
      nombre: 'Urocultivo',
      categoria: 'Microbiología',
      preparacion: 'Muestra estéril, primera orina de la mañana',
      parametros: [
        { nombre: 'Microorganismo', unidad: '', rango_referencia: 'Sin crecimiento' },
        { nombre: 'Recuento', unidad: 'UFC/mL', rango_referencia: '< 100000' },
        { nombre: 'Antibiograma', unidad: '', rango_referencia: 'Sensible / Resistente' },
      ],
    },
  ]);

  await Paciente.insertMany([
    {
      dpi: '2456789010101', nombres: 'Ana Lucía', apellidos: 'Pérez García', fecha_nacimiento: '1990-05-20', sexo: 'F',
      contacto: { telefono: '41234567', correo: 'ana.perez@mail.com' }, direccion: 'Zona 3, Quetzaltenango',
    },
    {
      dpi: '2789012340901', nombres: 'Jorge', apellidos: 'Cifuentes Bautista', fecha_nacimiento: '1965-09-12', sexo: 'M',
      contacto: { telefono: '47654321' }, direccion: 'Cantel',
    },
    {
      nombres: 'Lucía', apellidos: 'Sac Tum', fecha_nacimiento: '2015-03-08', sexo: 'F',
      contacto: { telefono: '49876543', correo: 'familia.sac@mail.com' }, direccion: 'Zona 7, Quetzaltenango',
    },
  ]);
};

(async () => {
  if (!(await connectMongoDB())) process.exit(1);
  try {
    await cargar();
    console.log('Datos del laboratorio cargados');
  } catch (error) {
    console.error('Error cargando datos:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
