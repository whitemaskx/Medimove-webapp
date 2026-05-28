import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  const client = await pool.connect()
  try {
    // Eliminar tablas viejas si existen
    await client.query(`DROP TABLE IF EXISTS reservas CASCADE`)
    await client.query(`DROP TABLE IF EXISTS pacientes CASCADE`)
    await client.query(`DROP TABLE IF EXISTS clinicas CASCADE`)
    await client.query(`DROP TABLE IF EXISTS conductores CASCADE`)
    await client.query(`DROP TABLE IF EXISTS test_inserts CASCADE`)

    // Crear tabla unificada sin constraints problemáticos
    await client.query(`
      CREATE TABLE reservas (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        numero_identificacion VARCHAR(50) NOT NULL,
        nombre_paciente VARCHAR(200) NOT NULL,
        edad INTEGER,
        sexo VARCHAR(20),
        tipo_regimen VARCHAR(50),
        clinica_nombre VARCHAR(200),
        clinica_direccion VARCHAR(300),
        especialidad VARCHAR(100) NOT NULL,
        fecha_cita DATE NOT NULL,
        hora_cita TIME NOT NULL,
        origen_direccion VARCHAR(300),
        destino_direccion VARCHAR(300),
        distancia_km NUMERIC(8,2),
        vehiculo_tipo VARCHAR(50),
        vehiculo_modelo VARCHAR(100),
        vehiculo_placa VARCHAR(20),
        sintomas TEXT,
        nivel_urgencia VARCHAR(20),
        tiene_acompanante BOOLEAN DEFAULT false,
        costo_consulta NUMERIC(12,2) DEFAULT 0,
        costo_transporte NUMERIC(12,2) DEFAULT 0,
        costo_total NUMERIC(12,2) DEFAULT 0,
        descuento_tercera_edad BOOLEAN DEFAULT false,
        descuento_discapacidad BOOLEAN DEFAULT false,
        descuento_subsidio_eps BOOLEAN DEFAULT false,
        estado VARCHAR(20) DEFAULT 'pendiente',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    return NextResponse.json({ success: true, message: 'Base de datos inicializada correctamente' })
  } catch (error) {
    console.error('Error inicializando DB:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
