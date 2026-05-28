import { NextResponse } from "next/server"

// Coordenadas de clínicas y centros de salud en Colombia
const CLINICAS_COORDS: Record<string, { lat: number; lng: number; ciudad: string }> = {
  "Clínica Universitaria San Juan de Dios": { lat: 10.4195, lng: -75.5362, ciudad: "Cartagena" },
  "Hospital Universitario del Caribe": { lat: 10.4089, lng: -75.5097, ciudad: "Cartagena" },
  "Centro Médico Crecer": { lat: 10.3932, lng: -75.4794, ciudad: "Cartagena" },
  "Clínica Madre Bernarda": { lat: 10.4156, lng: -75.5241, ciudad: "Cartagena" },
  "Clínica Blas de Lezo": { lat: 10.4012, lng: -75.5089, ciudad: "Cartagena" },
  "Hospital Naval de Cartagena": { lat: 10.3923, lng: -75.5156, ciudad: "Cartagena" },
  "Clínica Medihelp Services": { lat: 10.4102, lng: -75.5234, ciudad: "Cartagena" },
  "Hospital de Turbaco": { lat: 10.3567, lng: -75.4078, ciudad: "Cartagena" },
  // Bogotá
  "Hospital San Ignacio": { lat: 4.6280, lng: -74.0650, ciudad: "Bogotá" },
  "Fundación Santa Fe": { lat: 4.6970, lng: -74.0330, ciudad: "Bogotá" },
  "Clínica del Country": { lat: 4.6690, lng: -74.0560, ciudad: "Bogotá" },
  // Medellín
  "Hospital Pablo Tobón Uribe": { lat: 6.2690, lng: -75.5720, ciudad: "Medellín" },
  "Clínica Las Américas": { lat: 6.2110, lng: -75.5780, ciudad: "Medellín" },
}

// Zonas rurales conocidas (códigos postales o nombres)
const ZONAS_RURALES = [
  "vereda", "corregimiento", "finca", "hacienda", "parcela",
  "rural", "campo", "montaña", "zona rural", "turbaco"
]

// Peajes conocidos por ciudad/región
const PEAJES_POR_REGION: Record<string, { nombre: string; precio: number }[]> = {
  "cartagena": [
    { nombre: "Peaje Turbaco", precio: 11400 },
    { nombre: "Peaje Gambote", precio: 11400 },
  ],
  "bogota": [
    { nombre: "Peaje Chía", precio: 14200 },
    { nombre: "Peaje Siberia", precio: 14200 },
    { nombre: "Peaje Mondoñedo", precio: 12800 },
  ],
  "medellin": [
    { nombre: "Peaje Las Palmas", precio: 15600 },
    { nombre: "Peaje Bello", precio: 12200 },
  ]
}

function calcularDistanciaHaversine(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function esZonaRural(direccion: string): boolean {
  const direccionLower = direccion.toLowerCase()
  return ZONAS_RURALES.some(zona => direccionLower.includes(zona))
}

function detectarCiudad(texto: string): string {
  const textoLower = texto.toLowerCase()
  if (textoLower.includes("cartagena") || textoLower.includes("bolivar")) return "cartagena"
  if (textoLower.includes("bogota") || textoLower.includes("bogotá") || textoLower.includes("cundinamarca")) return "bogota"
  if (textoLower.includes("medellin") || textoLower.includes("medellín") || textoLower.includes("antioquia")) return "medellin"
  if (textoLower.includes("cali") || textoLower.includes("valle")) return "cali"
  if (textoLower.includes("barranquilla") || textoLower.includes("atlantico")) return "barranquilla"
  return "cartagena" // Default
}

function calcularPeajes(distanciaKm: number, ciudad: string): { peajes: { nombre: string; precio: number }[]; total: number } {
  // Solo aplicar peajes si la distancia es mayor a 15km (salida de zona urbana)
  if (distanciaKm < 15) {
    return { peajes: [], total: 0 }
  }
  
  const peajesCiudad = PEAJES_POR_REGION[ciudad] || []
  
  // Determinar cuántos peajes según distancia
  let numPeajes = 0
  if (distanciaKm >= 15 && distanciaKm < 30) numPeajes = 1
  else if (distanciaKm >= 30 && distanciaKm < 60) numPeajes = 2
  else if (distanciaKm >= 60) numPeajes = Math.min(peajesCiudad.length, 3)
  
  const peajesAplicados = peajesCiudad.slice(0, numPeajes)
  const totalPeajes = peajesAplicados.reduce((sum, p) => sum + p.precio, 0)
  
  return { peajes: peajesAplicados, total: totalPeajes }
}

export async function POST(req: Request) {
  try {
    const { origen, destino, coordenadasOrigen } = await req.json()

    if (!destino) {
      return NextResponse.json({ error: "Destino es requerido" }, { status: 400 })
    }

    // Buscar coordenadas del destino (clínica)
    let destinoCoords: { lat: number; lng: number } | null = null
    let clinicaNombre = ""
    
    for (const [nombre, coords] of Object.entries(CLINICAS_COORDS)) {
      if (destino.includes(nombre) || nombre.includes(destino.split(",")[0])) {
        destinoCoords = { lat: coords.lat, lng: coords.lng }
        clinicaNombre = nombre
        break
      }
    }

    // Si no encontramos la clínica, usar coordenadas aproximadas de Cartagena centro
    if (!destinoCoords) {
      destinoCoords = { lat: 10.4195, lng: -75.5362 }
    }

    let origenCoords: { lat: number; lng: number }
    
    // Si tenemos coordenadas del navegador, usarlas
    if (coordenadasOrigen && coordenadasOrigen.lat && coordenadasOrigen.lng) {
      origenCoords = coordenadasOrigen
    } else {
      // Estimación basada en la ciudad detectada
      const ciudad = detectarCiudad(origen || "cartagena")
      // Coordenadas aproximadas del centro de cada ciudad
      const centrosCiudad: Record<string, { lat: number; lng: number }> = {
        cartagena: { lat: 10.3910, lng: -75.4794 },
        bogota: { lat: 4.6097, lng: -74.0817 },
        medellin: { lat: 6.2442, lng: -75.5812 },
        cali: { lat: 3.4516, lng: -76.5320 },
        barranquilla: { lat: 10.9639, lng: -74.7964 },
      }
      origenCoords = centrosCiudad[ciudad] || centrosCiudad.cartagena
      
      // Agregar variación aleatoria para simular diferentes ubicaciones
      origenCoords.lat += (Math.random() - 0.5) * 0.05
      origenCoords.lng += (Math.random() - 0.5) * 0.05
    }

    // Calcular distancia real
    const distanciaLineal = calcularDistanciaHaversine(
      origenCoords.lat, origenCoords.lng,
      destinoCoords.lat, destinoCoords.lng
    )
    
    // Factor de corrección para distancia por carretera (1.3-1.5 típicamente)
    const esRural = esZonaRural(origen || "")
    const factorCorreccion = esRural ? 1.6 : 1.35
    const distanciaKm = Math.round(distanciaLineal * factorCorreccion * 10) / 10

    // Calcular tiempo estimado (velocidad promedio: 30km/h urbano, 50km/h rural)
    const velocidadPromedio = esRural ? 40 : 25
    const duracionMin = Math.ceil((distanciaKm / velocidadPromedio) * 60)

    // Detectar ciudad para peajes
    const ciudadDetectada = detectarCiudad(origen + " " + destino)
    const peajesInfo = calcularPeajes(distanciaKm, ciudadDetectada)

    return NextResponse.json({
      distancia: {
        km: distanciaKm,
        texto: `${distanciaKm} km`,
      },
      duracion: {
        minutos: duracionMin,
        texto: duracionMin >= 60 
          ? `${Math.floor(duracionMin / 60)} h ${duracionMin % 60} min`
          : `${duracionMin} min`,
      },
      zonaRural: esRural,
      peajes: peajesInfo.peajes,
      totalPeajes: peajesInfo.total,
      ruta: {
        origen: origen || "Tu ubicación",
        destino: clinicaNombre || destino,
        ciudad: ciudadDetectada,
      },
      coordenadas: {
        origen: origenCoords,
        destino: destinoCoords,
      }
    })
  } catch (error) {
    console.error("[v0] Error en API distancia:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
