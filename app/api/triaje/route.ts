export async function POST(req: Request) {
  const { nombre, edad, sexo, sintomas, descripcion } = await req.json()

  // Sistema de triaje basado en reglas médicas
  const resultado = analizarSintomas(nombre, edad, sexo, sintomas, descripcion)
  
  return Response.json(resultado)
}

interface ResultadoTriaje {
  urgencia: "alta" | "media" | "baja"
  diagnosticos_posibles: string[]
  especialidad: string
  pasos: { orden: number; titulo: string; descripcion: string; tiempo: string }[]
  examenes_recomendados: string[]
  recomendaciones_inmediatas: string[]
  señales_alarma: string[]
  resumen: string
}

function analizarSintomas(
  nombre: string,
  edad: number,
  sexo: string,
  sintomas: string[],
  descripcion: string
): ResultadoTriaje {
  const sintomasLower = sintomas.map(s => s.toLowerCase())
  const descripcionLower = (descripcion || "").toLowerCase()
  const todosSintomas = [...sintomasLower, descripcionLower].join(" ")

  // Síntomas de urgencia alta
  const sintomasUrgenciaAlta = [
    "dolor en el pecho", "dificultad para respirar", "pérdida de consciencia",
    "sangrado abundante", "dolor severo", "convulsiones", "parálisis",
    "confusión repentina", "dolor de cabeza intenso", "visión doble"
  ]

  // Síntomas de urgencia media
  const sintomasUrgenciaMedia = [
    "fiebre alta", "vómitos persistentes", "dolor abdominal", "diarrea severa",
    "infección", "herida", "fractura", "esguince", "alergia", "mareos"
  ]

  // Determinar urgencia
  let urgencia: "alta" | "media" | "baja" = "baja"
  
  for (const sintoma of sintomasUrgenciaAlta) {
    if (todosSintomas.includes(sintoma)) {
      urgencia = "alta"
      break
    }
  }

  if (urgencia !== "alta") {
    for (const sintoma of sintomasUrgenciaMedia) {
      if (todosSintomas.includes(sintoma)) {
        urgencia = "media"
        break
      }
    }
  }

  // Ajustar por edad
  if (edad < 5 || edad > 65) {
    if (urgencia === "baja") urgencia = "media"
  }

  // Determinar especialidad y diagnósticos según síntomas
  let especialidad = "Medicina General"
  let diagnosticos_posibles: string[] = []
  let examenes_recomendados: string[] = []
  let señales_alarma: string[] = []

  if (todosSintomas.includes("dolor de cabeza") || todosSintomas.includes("cefalea") || todosSintomas.includes("migraña")) {
    especialidad = "Neurología"
    diagnosticos_posibles = ["Cefalea tensional", "Migraña", "Cefalea por estrés"]
    examenes_recomendados = ["Evaluación neurológica", "Tomografía si persiste"]
    señales_alarma = ["Dolor súbito muy intenso", "Confusión o alteración del habla", "Rigidez en el cuello"]
  } else if (todosSintomas.includes("fiebre") || todosSintomas.includes("gripe") || todosSintomas.includes("resfriado")) {
    especialidad = "Medicina Interna"
    diagnosticos_posibles = ["Infección viral", "Gripe estacional", "Resfriado común"]
    examenes_recomendados = ["Hemograma completo", "Prueba de COVID si aplica"]
    señales_alarma = ["Fiebre mayor a 39°C por más de 3 días", "Dificultad respiratoria", "Confusión"]
  } else if (todosSintomas.includes("dolor abdominal") || todosSintomas.includes("estómago") || todosSintomas.includes("digestivo")) {
    especialidad = "Gastroenterología"
    diagnosticos_posibles = ["Gastritis", "Síndrome de intestino irritable", "Dispepsia funcional"]
    examenes_recomendados = ["Endoscopia digestiva", "Ecografía abdominal", "Análisis de heces"]
    señales_alarma = ["Sangre en heces", "Vómito con sangre", "Dolor muy intenso y súbito"]
  } else if (todosSintomas.includes("tos") || todosSintomas.includes("respirar") || todosSintomas.includes("pecho")) {
    especialidad = "Neumología"
    diagnosticos_posibles = ["Bronquitis", "Asma", "Infección respiratoria"]
    examenes_recomendados = ["Radiografía de tórax", "Espirometría", "Oximetría"]
    señales_alarma = ["Dificultad para respirar en reposo", "Labios o dedos azulados", "Dolor torácico al respirar"]
  } else if (todosSintomas.includes("hueso") || todosSintomas.includes("articulación") || todosSintomas.includes("espalda") || todosSintomas.includes("rodilla")) {
    especialidad = "Traumatología / Ortopedia"
    diagnosticos_posibles = ["Lesión muscular", "Esguince", "Artritis"]
    examenes_recomendados = ["Radiografía", "Resonancia magnética si es necesario"]
    señales_alarma = ["Deformidad visible", "Incapacidad total de movimiento", "Hinchazón severa"]
  } else if (todosSintomas.includes("piel") || todosSintomas.includes("erupción") || todosSintomas.includes("picazón")) {
    especialidad = "Dermatología"
    diagnosticos_posibles = ["Dermatitis", "Alergia cutánea", "Urticaria"]
    examenes_recomendados = ["Evaluación dermatológica", "Pruebas de alergia si aplica"]
    señales_alarma = ["Hinchazón de cara o garganta", "Dificultad para respirar", "Fiebre con erupción"]
  } else if (todosSintomas.includes("ansiedad") || todosSintomas.includes("depresión") || todosSintomas.includes("estrés") || todosSintomas.includes("insomnio")) {
    especialidad = "Psiquiatría / Psicología"
    diagnosticos_posibles = ["Trastorno de ansiedad", "Estrés crónico", "Trastorno del sueño"]
    examenes_recomendados = ["Evaluación psicológica", "Análisis de tiroides"]
    señales_alarma = ["Pensamientos de autolesión", "Incapacidad de funcionar", "Alucinaciones"]
  } else if (todosSintomas.includes("oído") || todosSintomas.includes("garganta") || todosSintomas.includes("nariz")) {
    especialidad = "Otorrinolaringología"
    diagnosticos_posibles = ["Otitis", "Faringitis", "Sinusitis"]
    examenes_recomendados = ["Otoscopia", "Exploración de garganta"]
    señales_alarma = ["Pérdida de audición súbita", "Dolor severo", "Secreción con sangre"]
  } else if (todosSintomas.includes("corazón") || todosSintomas.includes("palpitaciones") || todosSintomas.includes("presión")) {
    especialidad = "Cardiología"
    diagnosticos_posibles = ["Arritmia", "Hipertensión", "Ansiedad cardíaca"]
    examenes_recomendados = ["Electrocardiograma", "Ecocardiograma", "Holter 24h"]
    señales_alarma = ["Dolor en el pecho que se irradia al brazo", "Desmayo", "Falta de aire severa"]
    urgencia = "alta"
  } else {
    diagnosticos_posibles = ["Requiere evaluación médica general", "Posible condición menor", "Estrés o fatiga"]
    examenes_recomendados = ["Hemograma completo", "Química sanguínea básica"]
    señales_alarma = ["Empeoramiento de síntomas", "Aparición de nuevos síntomas", "Fiebre alta"]
  }

  // Generar pasos según urgencia
  const pasos = generarPasos(urgencia, especialidad)

  // Recomendaciones inmediatas según urgencia
  const recomendaciones_inmediatas = urgencia === "alta"
    ? ["Acudir inmediatamente a urgencias", "No conducir solo/a", "Llevar documentos de identidad y seguro médico"]
    : urgencia === "media"
    ? ["Agendar cita médica en las próximas 24-48 horas", "Mantener reposo", "Hidratarse adecuadamente"]
    : ["Monitorear síntomas en casa", "Descansar adecuadamente", "Consultar si los síntomas persisten más de 3 días"]

  const resumen = `${nombre}, basado en los síntomas reportados (${sintomas.join(", ") || "descripción general"}), se recomienda consulta con ${especialidad}. Nivel de urgencia: ${urgencia}. ${urgencia === "alta" ? "Se recomienda atención inmediata." : urgencia === "media" ? "Se sugiere consulta pronto." : "Puede programar una cita regular."}`

  return {
    urgencia,
    diagnosticos_posibles,
    especialidad,
    pasos,
    examenes_recomendados,
    recomendaciones_inmediatas,
    señales_alarma,
    resumen
  }
}

function generarPasos(urgencia: "alta" | "media" | "baja", especialidad: string) {
  if (urgencia === "alta") {
    return [
      { orden: 1, titulo: "Atención de emergencia", descripcion: "Acudir inmediatamente al servicio de urgencias más cercano", tiempo: "Inmediato" },
      { orden: 2, titulo: "Evaluación inicial", descripcion: "Triage y estabilización por personal de emergencias", tiempo: "15-30 minutos" },
      { orden: 3, titulo: "Diagnóstico y tratamiento", descripcion: "Exámenes de emergencia y tratamiento según hallazgos", tiempo: "1-4 horas" }
    ]
  } else if (urgencia === "media") {
    return [
      { orden: 1, titulo: "Agendar cita prioritaria", descripcion: `Contactar a ${especialidad} para cita en las próximas 24-48 horas`, tiempo: "Hoy" },
      { orden: 2, titulo: "Consulta médica", descripcion: "Evaluación completa con el especialista", tiempo: "30-45 minutos" },
      { orden: 3, titulo: "Exámenes complementarios", descripcion: "Realizar estudios según indicación médica", tiempo: "1-3 días" },
      { orden: 4, titulo: "Seguimiento", descripcion: "Consulta de control para revisar resultados", tiempo: "1 semana" }
    ]
  } else {
    return [
      { orden: 1, titulo: "Monitoreo en casa", descripcion: "Observar evolución de síntomas durante 24-72 horas", tiempo: "1-3 días" },
      { orden: 2, titulo: "Agendar consulta", descripcion: `Programar cita con ${especialidad} si los síntomas persisten`, tiempo: "Esta semana" },
      { orden: 3, titulo: "Consulta médica", descripcion: "Evaluación general y recomendaciones", tiempo: "20-30 minutos" },
      { orden: 4, titulo: "Seguimiento preventivo", descripcion: "Chequeo de control si es necesario", tiempo: "2-4 semanas" }
    ]
  }
}
