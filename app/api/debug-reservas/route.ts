import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { obtenerTodasLasReservas } from '@/app/actions/reservas'

export async function GET() {
  const client = await pool.connect()
  try {
    // Crear tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservas (
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
        fecha_cita VARCHAR(20) NOT NULL,
        hora_cita VARCHAR(10) NOT NULL,
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

    // Obtener info de la tabla
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reservas'
      ORDER BY ordinal_position
    `)

    // Contar total
    const countResult = await client.query(`
      SELECT COUNT(*) as total FROM reservas
    `)

    // Obtener reservas recientes
    const allReservas = await client.query(`
      SELECT 
        id,
        codigo,
        numero_identificacion,
        nombre_paciente,
        especialidad,
        fecha_cita,
        hora_cita,
        estado,
        created_at
      FROM reservas
      ORDER BY created_at DESC
      LIMIT 20
    `)

    // Agrupar por identificación
    const byIdentification = await client.query(`
      SELECT 
        numero_identificacion,
        COUNT(*) as cantidad,
        MAX(created_at) as ultima_reserva
      FROM reservas
      GROUP BY numero_identificacion
      ORDER BY MAX(created_at) DESC
    `)

    return NextResponse.json({
      success: true,
      database_status: '✓ Conectado',
      statistics: {
        total_reservas: parseInt(countResult.rows[0].total),
        pacientes_unicos: byIdentification.rows.length,
      },
      table_schema: tableInfo.rows.map(r => ({
        nombre: r.column_name,
        tipo: r.data_type,
        nullable: r.is_nullable
      })),
      reservas_recientes: allReservas.rows,
      por_paciente: byIdentification.rows,
      environment_check: {
        database_url: process.env.DATABASE_URL ? '✓ Sí' : '✗ No',
        neon_url: process.env.NEON_DATABASE_URL ? '✓ Sí' : '✗ No',
        pg_host: process.env.PGHOST ? '✓ Sí' : '✗ No',
      }
    })
  } catch (error) {
    console.error('Error en debug:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
