/**
 * Validadores para direcciones en "Transporte Inteligente"
 * Funciona tanto en backend (API routes) como en frontend (componentes)
 */

export interface ValidacionDireccion {
  valida: boolean
  mensaje?: string
  direccionSanitizada?: string
}

/**
 * Valida una dirección con reglas básicas:
 * - No está vacía
 * - Tiene longitud mínima (3 caracteres)
 * - Tiene longitud máxima (200 caracteres)
 * - Contiene solo caracteres permitidos (letras, números, espacios, guiones, comas, puntos, #)
 */
export function validarDireccionBasica(direccion: string): ValidacionDireccion {
  // Validar que no sea vacío o null
  if (!direccion || typeof direccion !== 'string') {
    return {
      valida: false,
      mensaje: 'La dirección no puede estar vacía'
    }
  }

  const direccionTrimmed = direccion.trim()

  // Validar longitud mínima
  if (direccionTrimmed.length < 3) {
    return {
      valida: false,
      mensaje: 'La dirección debe tener al menos 3 caracteres'
    }
  }

  // Validar longitud máxima
  if (direccionTrimmed.length > 200) {
    return {
      valida: false,
      mensaje: 'La dirección no puede exceder 200 caracteres'
    }
  }

  // Patrón de caracteres permitidos: letras (a-z, A-Z, áéíóúñ), números, espacios, guiones, comas, puntos, #
  // Regex: permite acentos, letras, dígitos, espacios, guión, coma, punto, numeral
  const patronValido = /^[a-zA-Z0-9\s\-.,#áéíóúñÁÉÍÓÚÑ]+$/

  if (!patronValido.test(direccionTrimmed)) {
    return {
      valida: false,
      mensaje: 'La dirección contiene caracteres no permitidos. Usa solo letras, números, espacios, guiones, comas, puntos y #'
    }
  }

  // Si pasó todas las validaciones
  return {
    valida: true,
    direccionSanitizada: direccionTrimmed
  }
}

/**
 * Sanitiza una dirección removiendo caracteres peligrosos
 * para evitar inyecciones de SQL o XSS
 */
export function sanitizarDireccion(direccion: string): string {
  if (!direccion || typeof direccion !== 'string') {
    return ''
  }

  return (
    direccion
      .trim()
      // Remover caracteres peligrosos: comillas, asteriscos, barras, llaves, paréntesis
      .replace(/['"*/{}<>()[\]]/g, '')
      // Reemplazar múltiples espacios por uno solo
      .replace(/\s+/g, ' ')
      // Remover espacios al inicio y final
      .trim()
  )
}

/**
 * Detecta si la dirección es probablemente una zona rural
 * Retorna true si contiene palabras clave de zonas rurales
 */
export function esZonaRural(direccion: string): boolean {
  if (!direccion || typeof direccion !== 'string') {
    return false
  }

  const PALABRAS_RURALES = [
    'vereda',
    'corregimiento',
    'finca',
    'hacienda',
    'parcela',
    'rural',
    'campo',
    'montaña',
    'zona rural',
    'turbaco',
    'inspección',
    'km',
    'vía'
  ]

  const direccionLower = direccion.toLowerCase()
  return PALABRAS_RURALES.some(palabra => direccionLower.includes(palabra))
}

/**
 * Detecta la ciudad probable basada en el texto de la dirección
 */
export function detectarCiudad(direccion: string): string {
  if (!direccion || typeof direccion !== 'string') {
    return 'cartagena' // Default
  }

  const textoLower = direccion.toLowerCase()

  if (textoLower.includes('cartagena') || textoLower.includes('bolivar')) {
    return 'cartagena'
  }
  if (
    textoLower.includes('bogota') ||
    textoLower.includes('bogotá') ||
    textoLower.includes('cundinamarca')
  ) {
    return 'bogota'
  }
  if (
    textoLower.includes('medellin') ||
    textoLower.includes('medellín') ||
    textoLower.includes('antioquia')
  ) {
    return 'medellin'
  }
  if (textoLower.includes('cali') || textoLower.includes('valle')) {
    return 'cali'
  }
  if (textoLower.includes('barranquilla') || textoLower.includes('atlantico')) {
    return 'barranquilla'
  }

  return 'cartagena' // Default
}

/**
 * Validación completa: ejecuta todas las validaciones básicas
 */
export function validarDireccionCompleta(direccion: string): ValidacionDireccion {
  // Primero sanitizar
  const sanitizada = sanitizarDireccion(direccion)

  // Luego validar
  const validacion = validarDireccionBasica(sanitizada)

  return {
    ...validacion,
    direccionSanitizada: sanitizada
  }
}
