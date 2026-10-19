const { DataTypes } = require('sequelize');
const { sequelizePostgres } = require('../../../config/postgres');

/**
 * Modelo: Paciente (Hospital General - PostgreSQL)
 */
const PacienteHospital = sequelizePostgres.define(
  'PacienteHospital',
  {
    id_paciente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_paciente',
    },
    cui: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    genero: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'pacientes',
    timestamps: true,
  }
);

/**
 * Modelo: Medico (Hospital General - PostgreSQL)
 */
const MedicoHospital = sequelizePostgres.define(
  'MedicoHospital',
  {
    id_medico: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_medico',
    },
    colegiado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: 'medicos',
    timestamps: true,
  }
);

/**
 * Modelo: Consulta (Hospital General - PostgreSQL)
 */
const ConsultaHospital = sequelizePostgres.define(
  'ConsultaHospital',
  {
    id_consulta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_consulta',
    },
    fecha_consulta: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sintomas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'consultas',
    timestamps: true,
  }
);

// Relaciones
PacienteHospital.hasMany(ConsultaHospital, { foreignKey: 'id_paciente', as: 'consultas' });
ConsultaHospital.belongsTo(PacienteHospital, { foreignKey: 'id_paciente', as: 'paciente' });

MedicoHospital.hasMany(ConsultaHospital, { foreignKey: 'id_medico', as: 'consultas' });
ConsultaHospital.belongsTo(MedicoHospital, { foreignKey: 'id_medico', as: 'medico' });

module.exports = {
  PacienteHospital,
  MedicoHospital,
  ConsultaHospital,
};
