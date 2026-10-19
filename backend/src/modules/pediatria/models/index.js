const { DataTypes } = require('sequelize');
const { sequelizeMySQL } = require('../../../config/mysql');

/**
 * Modelo: Tutor (Centro Pediátrico - MySQL)
 */
const TutorPediatria = sequelizeMySQL.define(
  'TutorPediatria',
  {
    id_tutor: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_tutor',
    },
    cui: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    nombre_completo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    parentesco: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'tutores',
    timestamps: true,
  }
);

/**
 * Modelo: Paciente Pediátrico (Centro Pediátrico - MySQL)
 */
const PacientePediatrico = sequelizeMySQL.define(
  'PacientePediatrico',
  {
    id_paciente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_paciente',
    },
    cui: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    nombre_completo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    genero: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    tipo_sangre: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    alergias: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'pacientes_pediatricos',
    timestamps: true,
  }
);

/**
 * Modelo: Control de Crecimiento y Desarrollo (Centro Pediátrico - MySQL)
 */
const ControlCrecimiento = sequelizeMySQL.define(
  'ControlCrecimiento',
  {
    id_control: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_control',
    },
    fecha_control: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    edad_meses: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    peso_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    talla_cm: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    perimetro_cefalico_cm: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'controles_crecimiento',
    timestamps: true,
  }
);

// Relaciones
PacientePediatrico.belongsTo(TutorPediatria, { foreignKey: 'id_tutor', as: 'tutor' });
TutorPediatria.hasMany(PacientePediatrico, { foreignKey: 'id_tutor', as: 'pacientes' });

PacientePediatrico.hasMany(ControlCrecimiento, { foreignKey: 'id_paciente', as: 'controles' });
ControlCrecimiento.belongsTo(PacientePediatrico, { foreignKey: 'id_paciente', as: 'paciente' });

module.exports = {
  TutorPediatria,
  PacientePediatrico,
  ControlCrecimiento,
};
