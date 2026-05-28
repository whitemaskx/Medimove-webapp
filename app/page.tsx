"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  Loader2,
  MapPin,
  Plus,
  Stethoscope,
  Truck,
  User,
  Users,
  Zap,
  Navigation,
  Route,
  Percent,
  FileText,
  TrendingUp,
  DollarSign,
  Accessibility,
  Baby,
  Building2,
  TreePine,
  BadgePercent,
  UserPlus,
  X,
  Search,
  IdCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { guardarReserva, consultarReservas } from "@/app/actions/reservas"

// ─── CONSTANTES ────────────────────────────────────────────────────────────────

const SINTOMAS = [
  "Fiebre",
  "Dolor de cabeza",
  "Tos",
  "Dificultad para respirar",
  "Dolor de pecho",
  "Náuseas",
  "Dolor abdominal",
  "Mareos",
  "Dolor de garganta",
  "Fatiga extrema",
  "Erupción cutánea",
  "Diarrea",
]

const URGENCIAS = {
  alta: {
    label: "Urgencia Alta",
    color: "destructive",
    tiempo: "Atención inmediata",
  },
  media: {
    label: "Urgencia Media",
    color: "warning",
    tiempo: "Menos de 2 horas",
  },
  baja: {
    label: "Urgencia Baja",
    color: "success",
    tiempo: "Consulta programada",
  },
}

const CLINICAS = [
  {
    id: 1,
    nombre: "Clínica Universitaria San Juan de Dios",
    dir: "Cl. 24 #29-20, Cartagena",
    direccionCompleta: "Clínica Universitaria San Juan de Dios, Calle 24 #29-20, Cartagena, Colombia",
    especialidades: ["Medicina General", "Cardiología", "Neurología", "Pediatría"],
    rating: 4.8,
    zona: "urbana",
  },
  {
    id: 2,
    nombre: "Hospital Naval de Cartagena",
    dir: "Isla de Manzanillo, Cartagena",
    direccionCompleta: "Hospital Naval de Cartagena, Isla de Manzanillo, Cartagena, Colombia",
    especialidades: ["Medicina General", "Cirugía", "Urgencias"],
    rating: 4.5,
    zona: "urbana",
  },
  {
    id: 3,
    nombre: "Clínica Medihelp Services",
    dir: "Av. Pedro de Heredia, Cartagena",
    direccionCompleta: "Clínica Medihelp Services, Avenida Pedro de Heredia, Cartagena, Colombia",
    especialidades: ["Medicina General", "Ginecología", "Dermatología", "Ortopedia"],
    rating: 4.7,
    zona: "urbana",
  },
  {
    id: 4,
    nombre: "Hospital de Turbaco",
    dir: "Turbaco, Bolívar",
    direccionCompleta: "Hospital de Turbaco, Turbaco, Bolívar, Colombia",
    especialidades: ["Medicina General", "Urgencias", "Pediatría"],
    rating: 4.2,
    zona: "rural",
  },
]

const HORARIOS = ["7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"]

const AUTOS = [
  {
    id: 1,
    tipo: "Moto taxi",
    icon: Zap,
    tarifaBase: 800,
    tarifaUrbana: 800,
    tarifaRural: 1000,
    descripcion: "Rápido para zonas congestionadas",
    eta: "3-5 min",
    capacidad: 1,
  },
  {
    id: 2,
    tipo: "Auto Estándar",
    icon: Car,
    tarifaBase: 1200,
    tarifaUrbana: 1200,
    tarifaRural: 1500,
    descripcion: "Sedán cómodo con aire acondicionado",
    eta: "5-8 min",
    capacidad: 4,
  },
  {
    id: 3,
    tipo: "Auto Médico",
    icon: Heart,
    tarifaBase: 2500,
    tarifaUrbana: 2500,
    tarifaRural: 3000,
    descripcion: "Con kit de primeros auxilios a bordo",
    eta: "8-12 min",
    capacidad: 3,
  },
  {
    id: 4,
    tipo: "Van Familiar",
    icon: Truck,
    tarifaBase: 1800,
    tarifaUrbana: 1800,
    tarifaRural: 2200,
    descripcion: "Ideal para ir acompañado",
    eta: "6-10 min",
    capacidad: 7,
  },
]

const TARJETAS_INICIALES = [
  { id: 1, tipo: "Visa", ultimos: "4242" },
  { id: 2, tipo: "Mastercard", ultimos: "5353" },
]

// Configuración de descuentos
const DESCUENTOS = {
  terceraEdad: { porcentaje: 15, minEdad: 60, label: "Tercera Edad (15%)" },
  discapacidad: { porcentaje: 20, label: "Discapacidad (20%)" },
  subsidioEPS: { porcentaje: 30, label: "Subsidio EPS (30%)" },
}

// Configuración de peajes (simulados)
const PEAJES = [
  { nombre: "Peaje Turbaco", costo: 8500, rutasAfectadas: ["rural"] },
  { nombre: "Peaje La Heroica", costo: 6200, rutasAfectadas: ["urbana", "rural"] },
]

// ─── TIPOS ─────────────────────────────────────────────────────────────────────

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

interface Clinica {
  id: number
  nombre: string
  dir: string
  direccionCompleta: string
  especialidades: string[]
  rating: number
  zona: "urbana" | "rural"
}

interface Auto {
  id: number
  tipo: string
  icon: React.ComponentType<{ className?: string }>
  tarifaBase: number
  tarifaUrbana: number
  tarifaRural: number
  descripcion: string
  eta: string
  capacidad: number
}

interface DistanciaResult {
  distancia: { km: number; texto: string }
  duracion: { minutos: number; texto: string }
}

interface RegistroViaje {
  id: string
  fecha: Date
  paciente: string
  origen: string
  destino: string
  distanciaKm: number
  tipoVehiculo: string
  costoBase: number
  descuentos: number
  peajes: number
  total: number
  tieneAcompanante: boolean
}

// ─── COMPONENTES UI ────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  )
}

function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: "default" | "success" | "warning" | "destructive" | "outline"
  children: React.ReactNode
  className?: string
}) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
    outline: "bg-muted text-muted-foreground border-border",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const isActive = currentStep === i
        const isDone = currentStep > i

        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all",
                isDone && "bg-emerald-500 text-white",
                isActive && "bg-primary text-primary-foreground",
                !isDone && !isActive && "bg-muted text-muted-foreground"
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs whitespace-nowrap",
                isActive && "font-medium text-foreground",
                !isActive && "text-muted-foreground"
              )}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 transition-colors",
                  isDone ? "bg-emerald-500" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function Button({
  children,
  variant = "default",
  size = "default",
  disabled,
  className,
  onClick,
}: {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  disabled?: boolean
  className?: string
  onClick?: () => void
}) {
  const variants = {
    default: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    outline: "border border-border bg-background hover:bg-muted",
    ghost: "hover:bg-muted",
  }

  const sizes = {
    default: "h-10 px-4 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  )
}

function Input({
  label,
  ...props
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <input
        {...props}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          props.className
        )}
      />
    </div>
  )
}

function Select({
  label,
  children,
  ...props
}: { label?: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <select
        {...props}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          props.className
        )}
      >
        {children}
      </select>
    </div>
  )
}

function Textarea({
  label,
  ...props
}: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <textarea
        {...props}
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none",
          props.className
        )}
      />
    </div>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
        checked ? "border-emerald-300 bg-emerald-50" : "border-border hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all mt-0.5",
          checked ? "bg-emerald-500 border-emerald-500" : "border-border"
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────

// Precios de consulta según régimen
const PRECIOS_CONSULTA = {
  contributivo: 45000,
  subsidiado: 2500,
}

export default function RutaMedica() {
  // Estados
  const [step, setStep] = useState(0)
  const [datos, setDatos] = useState({ identificacion: "", nombre: "", edad: "", sexo: "" })
  const [tipoRegimen, setTipoRegimen] = useState<"contributivo" | "subsidiado">("contributivo")
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [extra, setExtra] = useState("")
  const [resultado, setResultado] = useState<ResultadoTriaje | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [cita, setCita] = useState<{
    clinica: Clinica | null
    fecha: string
    hora: string
    especialidad: string
  }>({ clinica: null, fecha: "", hora: "", especialidad: "" })
  const [autoSel, setAutoSel] = useState<Auto | null>(null)
  const [tarjetaSel, setTarjetaSel] = useState(1)
  const [tarjetas, setTarjetas] = useState(TARJETAS_INICIALES)
  const [mostrarModalTarjeta, setMostrarModalTarjeta] = useState(false)
  const [nuevaTarjeta, setNuevaTarjeta] = useState({
    numero: "",
    nombre: "",
    vencimiento: "",
    cvv: "",
  })
  const [origenDir, setOrigenDir] = useState("")

  // Estados para consulta de reservas
  const [mostrarModalReservas, setMostrarModalReservas] = useState(false)
  const [consultaIdentificacion, setConsultaIdentificacion] = useState("")
  const [reservasEncontradas, setReservasEncontradas] = useState<any[]>([])
  const [buscandoReservas, setBuscandoReservas] = useState(false)
  const [errorReservas, setErrorReservas] = useState("")
  const [guardandoReserva, setGuardandoReserva] = useState(false)

  // Estados para Google Maps y cálculo de distancia
  const [distanciaInfo, setDistanciaInfo] = useState<DistanciaResult | null>(null)
  const [calculandoDistancia, setCalculandoDistancia] = useState(false)
  const [errorDistancia, setErrorDistancia] = useState("")

  // Estados para descuentos
  const [descuentosActivos, setDescuentosActivos] = useState({
    terceraEdad: false,
    discapacidad: false,
    subsidioEPS: false,
  })

  // Estado para acompañante (auto-detectado para mayores de 70)
  const [tieneAcompanante, setTieneAcompanante] = useState(false)

  // Estados para registro de viajes
  const [registroViajes, setRegistroViajes] = useState<RegistroViaje[]>([])
  const [vistaRegistro, setVistaRegistro] = useState<"diario" | "semanal" | "mensual">("diario")
  const [mostrarRegistro, setMostrarRegistro] = useState(false)

  // Estado para geolocalización
  const [ubicacionActual, setUbicacionActual] = useState<{ lat: number; lng: number } | null>(null)
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)

  // Refs para input
  const origenInputRef = useRef<HTMLInputElement>(null)

  // Obtener ubicación del usuario al cargar
  useEffect(() => {
    if (navigator.geolocation) {
      setObteniendoUbicacion(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionActual({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setObteniendoUbicacion(false)
        },
        () => {
          setObteniendoUbicacion(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    }
  }, [])

  // Auto-detectar si necesita acompañante (mayores de 70)
  useEffect(() => {
    const edad = parseInt(datos.edad)
    if (edad >= 70) {
      setTieneAcompanante(true)
    }
  }, [datos.edad])

  // Auto-marcar descuento de tercera edad
  useEffect(() => {
    const edad = parseInt(datos.edad)
    if (edad >= DESCUENTOS.terceraEdad.minEdad) {
      setDescuentosActivos((prev) => ({ ...prev, terceraEdad: true }))
    }
  }, [datos.edad])

  // Calcular distancia usando coordenadas del navegador
  const calcularDistancia = useCallback(async () => {
    if (!cita.clinica) return

    setCalculandoDistancia(true)
    setErrorDistancia("")

    try {
      const res = await fetch("/api/distancia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen: origenDir || "Mi ubicación actual",
          destino: cita.clinica.direccionCompleta,
          coordenadasOrigen: ubicacionActual,
        }),
      })

      if (!res.ok) {
        throw new Error("Error al calcular distancia")
      }

      const data = await res.json()
      setDistanciaInfo(data)
    } catch {
      setErrorDistancia("No se pudo calcular la distancia. Intenta de nuevo.")
    } finally {
      setCalculandoDistancia(false)
    }
  }, [origenDir, cita.clinica, ubicacionActual])

  // Helpers
  const toggleSintoma = (s: string) =>
    setSeleccionados((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))

  const datosOk = datos.identificacion.trim() && datos.nombre.trim() && datos.edad && datos.sexo
  const sintomasOk = seleccionados.length > 0 || extra.trim().length > 2
  const citaOk = cita.clinica && cita.fecha && cita.hora && cita.especialidad

  // Calcular tarifa según zona (usar datos de la API si están disponibles)
  const getTarifa = (auto: Auto): number => {
    // Si la API indica zona rural, usar tarifa rural
    if (distanciaInfo?.zonaRural) {
      return auto.tarifaRural
    }
    if (!cita.clinica) return auto.tarifaBase
    return cita.clinica.zona === "rural" ? auto.tarifaRural : auto.tarifaUrbana
  }

  // Calcular peajes según la ruta (usar datos de la API)
  const calcularPeajes = (): number => {
    if (!distanciaInfo) return 0
    // Usar los peajes calculados por la API
    return distanciaInfo.totalPeajes || 0
  }

  // Calcular descuentos
  const calcularDescuentoTotal = (): { porcentaje: number; monto: number; detalles: string[] } => {
    const detalles: string[] = []
    let porcentajeTotal = 0

    if (descuentosActivos.terceraEdad) {
      porcentajeTotal += DESCUENTOS.terceraEdad.porcentaje
      detalles.push(DESCUENTOS.terceraEdad.label)
    }
    if (descuentosActivos.discapacidad) {
      porcentajeTotal += DESCUENTOS.discapacidad.porcentaje
      detalles.push(DESCUENTOS.discapacidad.label)
    }
    if (descuentosActivos.subsidioEPS) {
      porcentajeTotal += DESCUENTOS.subsidioEPS.porcentaje
      detalles.push(DESCUENTOS.subsidioEPS.label)
    }

    // Máximo 50% de descuento
    porcentajeTotal = Math.min(porcentajeTotal, 50)

    const costoTransporte = autoSel && distanciaInfo
      ? Math.round(getTarifa(autoSel) * distanciaInfo.distancia.km)
      : 0
    const monto = Math.round(costoTransporte * (porcentajeTotal / 100))

    return { porcentaje: porcentajeTotal, monto, detalles }
  }

  // Calcular costo total de transporte
  const calcularCostoTransporte = (): {
    base: number
    peajes: number
    descuento: number
    total: number
    distanciaKm: number
  } => {
    if (!autoSel || !distanciaInfo) {
      return { base: 0, peajes: 0, descuento: 0, total: 0, distanciaKm: 0 }
    }

    const km = distanciaInfo.distancia.km
    const tarifa = getTarifa(autoSel)
    const base = Math.round(tarifa * km)
    const peajes = calcularPeajes()
    const descuento = calcularDescuentoTotal().monto
    const total = Math.max(base + peajes - descuento, 0)

    return { base, peajes, descuento, total, distanciaKm: km }
  }

  // Registrar viaje completado
  const registrarViaje = () => {
    if (!autoSel || !distanciaInfo || !cita.clinica) return

    const costos = calcularCostoTransporte()
    const nuevoViaje: RegistroViaje = {
      id: Date.now().toString(),
      fecha: new Date(),
      paciente: datos.nombre,
      origen: origenDir,
      destino: cita.clinica.nombre,
      distanciaKm: costos.distanciaKm,
      tipoVehiculo: autoSel.tipo,
      costoBase: costos.base,
      descuentos: costos.descuento,
      peajes: costos.peajes,
      total: costos.total,
      tieneAcompanante,
    }

    setRegistroViajes((prev) => [...prev, nuevoViaje])
  }

  // Filtrar viajes por periodo
  const filtrarViajesPorPeriodo = (): RegistroViaje[] => {
    const ahora = new Date()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

    return registroViajes.filter((viaje) => {
      const fechaViaje = new Date(viaje.fecha)
      
      switch (vistaRegistro) {
        case "diario":
          return fechaViaje >= inicioHoy
        case "semanal":
          const inicioSemana = new Date(inicioHoy)
          inicioSemana.setDate(inicioSemana.getDate() - 7)
          return fechaViaje >= inicioSemana
        case "mensual":
          const inicioMes = new Date(inicioHoy)
          inicioMes.setMonth(inicioMes.getMonth() - 1)
          return fechaViaje >= inicioMes
        default:
          return true
      }
    })
  }

  // Calcular totales del periodo
  const calcularTotalesPeriodo = () => {
    const viajesFiltrados = filtrarViajesPorPeriodo()
    return {
      totalViajes: viajesFiltrados.length,
      totalKm: viajesFiltrados.reduce((acc, v) => acc + v.distanciaKm, 0),
      totalIngresos: viajesFiltrados.reduce((acc, v) => acc + v.total, 0),
      totalDescuentos: viajesFiltrados.reduce((acc, v) => acc + v.descuentos, 0),
      totalPeajes: viajesFiltrados.reduce((acc, v) => acc + v.peajes, 0),
    }
  }

  // Análisis de síntomas
  async function analizar() {
    setError("")
    setIsLoading(true)
    setStep(3)

    try {
      const res = await fetch("/api/triaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre,
          edad: datos.edad,
          sexo: datos.sexo,
          sintomas: seleccionados,
          descripcion: extra,
        }),
      })

      if (!res.ok) throw new Error("Error en la respuesta")

      const parsed = await res.json()
      setResultado(parsed)
      setStep(4)
    } catch (err) {
      console.error("[v0] Error al analizar:", err)
      setError("Error al analizar los síntomas. Por favor intenta de nuevo.")
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  // Reiniciar flujo
  function reiniciar() {
    setStep(0)
    setDatos({ identificacion: "", nombre: "", edad: "", sexo: "" })
    setTipoRegimen("contributivo")
    setSeleccionados([])
    setExtra("")
    setResultado(null)
    setError("")
    setCita({ clinica: null, fecha: "", hora: "", especialidad: "" })
    setAutoSel(null)
    setOrigenDir("")
    setDistanciaInfo(null)
    setDescuentosActivos({ terceraEdad: false, discapacidad: false, subsidioEPS: false })
    setTieneAcompanante(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Agregar nueva tarjeta
  function agregarTarjeta() {
    if (nuevaTarjeta.numero.length < 16) return
    
    const ultimosCuatro = nuevaTarjeta.numero.slice(-4)
    const tipoTarjeta = nuevaTarjeta.numero.startsWith("4") 
      ? "Visa" 
      : nuevaTarjeta.numero.startsWith("5") 
        ? "Mastercard" 
        : nuevaTarjeta.numero.startsWith("3") 
          ? "American Express" 
          : "Tarjeta"
    
    const nuevaId = Math.max(...tarjetas.map(t => t.id)) + 1
    const tarjetaNueva = {
      id: nuevaId,
      tipo: tipoTarjeta,
      ultimos: ultimosCuatro,
    }
    
    setTarjetas([...tarjetas, tarjetaNueva])
    setTarjetaSel(nuevaId)
    setNuevaTarjeta({ numero: "", nombre: "", vencimiento: "", cvv: "" })
    setMostrarModalTarjeta(false)
  }

  // Formatear número de tarjeta
  function formatearNumeroTarjeta(valor: string) {
    const soloNumeros = valor.replace(/\D/g, "").slice(0, 16)
    const grupos = soloNumeros.match(/.{1,4}/g)
    return grupos ? grupos.join(" ") : soloNumeros
  }

  // Formatear fecha de vencimiento
  function formatearVencimiento(valor: string) {
    const soloNumeros = valor.replace(/\D/g, "").slice(0, 4)
    if (soloNumeros.length >= 2) {
      return soloNumeros.slice(0, 2) + "/" + soloNumeros.slice(2)
    }
    return soloNumeros
  }

  // Buscar reservas por número de identificación
  async function buscarReservas() {
    if (!consultaIdentificacion.trim()) return
    
    setBuscandoReservas(true)
    setErrorReservas("")
    setReservasEncontradas([])
    
    const result = await consultarReservas(consultaIdentificacion.trim())
    
    if (result.success) {
      setReservasEncontradas(result.reservas || [])
      if (result.reservas?.length === 0) {
        setErrorReservas("No se encontraron reservas con este número de identificación")
      }
    } else {
      setErrorReservas(result.error || "Error al consultar")
    }
    
    setBuscandoReservas(false)
  }

  // Guardar reserva en la base de datos
  async function procesarPago() {
    setGuardandoReserva(true)
    
    const reservaData = {
      numeroIdentificacion: datos.identificacion,
      nombrePaciente: datos.nombre,
      edad: parseInt(datos.edad),
      sexo: datos.sexo,
      tipoRegimen: tipoRegimen,
      clinicaNombre: cita.clinica?.nombre || "",
      clinicaDireccion: cita.clinica?.dir || "",
      clinicaId: cita.clinica?.id || undefined,
      especialidad: cita.especialidad,
      fechaCita: cita.fecha,
      horaCita: cita.hora,
      vehiculoTipo: autoSel?.tipo || undefined,
      vehiculoModelo: autoSel?.descripcion || undefined,
      vehiculoPlaca: `${autoSel?.tipo?.substring(0, 3).toUpperCase() || ""}${Math.floor(Math.random() * 900) + 100}` || undefined,
      origenDireccion: origenDir || undefined,
      destinoDireccion: cita.clinica?.dir || undefined,
      distanciaKm: distanciaInfo?.distancia?.km || undefined,
      costoConsulta: PRECIOS_CONSULTA[tipoRegimen],
      costoTransporte: autoSel ? costoTransporte.total : undefined,
      costoTotal: PRECIOS_CONSULTA[tipoRegimen] + (autoSel ? costoTransporte.total : 0),
      sintomas: seleccionados.join(", "),
      nivelUrgencia: resultado?.urgencia || undefined,
      tieneAcompanante: tieneAcompanante,
      descuentoTerceraEdad: descuentosActivos.terceraEdad,
      descuentoDiscapacidad: descuentosActivos.discapacidad,
      descuentoSubsidioEps: descuentosActivos.subsidioEPS,
    }
    
    const result = await guardarReserva(reservaData)
    
    setGuardandoReserva(false)
    
    if (result.success) {
      setStep(8) // Ir al paso de confirmación
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      setError("Error al procesar el pago. Intenta nuevamente.")
    }
  }

  const STEPS = ["Datos", "Síntomas", "Ruta", "Cita", "Transporte", "Pago"]
  const stepIndex = step === 1 ? 0 : step === 2 ? 1 : step === 4 ? 2 : step === 5 ? 3 : step === 6 ? 4 : step === 7 ? 5 : -1
  const showProgress = step > 0 && step !== 3 && step !== 8

  const costoTransporte = calcularCostoTransporte()
  const descuentoInfo = calcularDescuentoTotal()

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="MediMove Logo"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <div>
                <h1 className="text-xl font-semibold text-foreground">MediMove</h1>
                <p className="text-sm text-muted-foreground">Tu Ruta Médica Inteligente</p>
              </div>
            </div>
            
            {/* Botón de consultar reservas */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalReservas(true)}
              className="shrink-0"
            >
              <Search className="h-4 w-4" />
              Mis Citas
            </Button>

            {/* Botón de registro */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarRegistro(!mostrarRegistro)}
              className="shrink-0"
            >
              <FileText className="h-4 w-4" />
              Registro
            </Button>
          </div>

          {showProgress && <StepIndicator steps={STEPS} currentStep={stepIndex} />}
        </header>

        {/* Modal de Registro de Costos */}
        {mostrarRegistro && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Registro de Costos</h2>
              </div>
              <button
                onClick={() => setMostrarRegistro(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Selector de periodo */}
            <div className="flex gap-2 mb-4">
              {(["diario", "semanal", "mensual"] as const).map((periodo) => (
                <button
                  key={periodo}
                  onClick={() => setVistaRegistro(periodo)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all capitalize",
                    vistaRegistro === periodo
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {periodo}
                </button>
              ))}
            </div>

            {/* Resumen de totales */}
            {(() => {
              const totales = calcularTotalesPeriodo()
              return (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs text-muted-foreground">Total Viajes</p>
                    <p className="text-xl font-bold text-emerald-700">{totales.totalViajes}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs text-muted-foreground">Total Km</p>
                    <p className="text-xl font-bold text-blue-700">{totales.totalKm.toFixed(1)} km</p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-3">
                    <p className="text-xs text-muted-foreground">Ingresos</p>
                    <p className="text-xl font-bold text-purple-700">
                      ${totales.totalIngresos.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-xs text-muted-foreground">Descuentos</p>
                    <p className="text-xl font-bold text-amber-700">
                      ${totales.totalDescuentos.toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Lista de viajes */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filtrarViajesPorPeriodo().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay viajes registrados en este periodo
                </p>
              ) : (
                filtrarViajesPorPeriodo().map((viaje) => (
                  <div key={viaje.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{viaje.paciente}</span>
                      <span className="text-emerald-700 font-semibold">
                        ${viaje.total.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {viaje.origen} → {viaje.destino}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {viaje.distanciaKm.toFixed(1)} km
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {viaje.tipoVehiculo}
                      </Badge>
                      {viaje.tieneAcompanante && (
                        <Badge variant="success" className="text-[10px]">
                          +1 acomp.
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* ── PASO 0: INICIO ── */}
        {step === 0 && (
          <Card className="text-center">
            <div className="py-6">
              <div className="mx-auto mb-6">
                <Image
                  src="/logo.png"
                  alt="MediMove"
                  width={100}
                  height={100}
                  className="mx-auto rounded-2xl"
                />
              </div>

              <h2 className="mb-2 text-2xl font-semibold text-balance">Bienvenido al triaje inteligente</h2>
              <p className="mx-auto mb-6 max-w-md text-muted-foreground leading-relaxed">
                Describe tus síntomas, recibe tu ruta médica con IA, agenda tu cita y solicita
                transporte con cálculo real por kilómetros usando Google Maps.
              </p>

              <div className="mb-8 flex flex-wrap justify-center gap-2">
                <Badge variant="success">Análisis IA</Badge>
                <Badge variant="default">Google Maps</Badge>
                <Badge variant="outline">Cobro por km</Badge>
                <Badge variant="warning">Descuentos</Badge>
              </div>

              <Button size="lg" onClick={() => setStep(1)} className="w-full sm:w-auto">
                Comenzar evaluación
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── PASO 1: DATOS ── */}
        {step === 1 && (
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">Datos del paciente</h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Número de identificación"
                value={datos.identificacion}
                onChange={(e) => setDatos((p) => ({ ...p, identificacion: e.target.value.replace(/\D/g, "") }))}
                placeholder="Ej. 1234567890"
              />

              <Input
                label="Nombre completo"
                value={datos.nombre}
                onChange={(e) => setDatos((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej. María García"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Edad"
                  type="number"
                  min={0}
                  max={120}
                  value={datos.edad}
                  onChange={(e) => setDatos((p) => ({ ...p, edad: e.target.value }))}
                  placeholder="Años"
                />

                <Select
                  label="Sexo biológico"
                  value={datos.sexo}
                  onChange={(e) => setDatos((p) => ({ ...p, sexo: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </Select>
              </div>

              {/* Selector de régimen de salud */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tipo de régimen de salud
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoRegimen("contributivo")}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      tipoRegimen === "contributivo"
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-border hover:border-emerald-200 hover:bg-emerald-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className={cn("h-4 w-4", tipoRegimen === "contributivo" ? "text-emerald-600" : "text-muted-foreground")} />
                      <span className={cn("font-medium text-sm", tipoRegimen === "contributivo" ? "text-emerald-700" : "text-foreground")}>
                        Contributivo
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Empleados, independientes
                    </p>
                    <p className="text-xs font-medium text-emerald-600 mt-1">
                      Copago: ${PRECIOS_CONSULTA.contributivo.toLocaleString()}
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTipoRegimen("subsidiado")}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      tipoRegimen === "subsidiado"
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-border hover:border-emerald-200 hover:bg-emerald-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className={cn("h-4 w-4", tipoRegimen === "subsidiado" ? "text-emerald-600" : "text-muted-foreground")} />
                      <span className={cn("font-medium text-sm", tipoRegimen === "subsidiado" ? "text-emerald-700" : "text-foreground")}>
                        Subsidiado
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SISBEN, beneficiarios
                    </p>
                    <p className="text-xs font-medium text-emerald-600 mt-1">
                      Copago: ${PRECIOS_CONSULTA.subsidiado.toLocaleString()}
                    </p>
                  </button>
                </div>
              </div>

              {parseInt(datos.edad) >= 60 && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                  <strong>Nota:</strong> Como paciente de tercera edad, aplicará un descuento automático del 15% en transporte.
                </div>
              )}

              {parseInt(datos.edad) >= 70 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  <strong>Importante:</strong> Por su edad, se incluirá automáticamente un acompañante en la reserva del vehículo.
                </div>
              )}

              <Button onClick={() => setStep(2)} disabled={!datosOk} className="w-full">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── PASO 2: SÍNTOMAS ── */}
        {step === 2 && (
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">¿Qué síntomas tienes?</h2>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {SINTOMAS.map((s) => {
                const selected = seleccionados.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleSintoma(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-all",
                      selected
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-medium"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>

            <Textarea
              label="Descripción adicional (recomendado)"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Ej. Llevo 3 días con fiebre alta y no puedo dormir..."
              rows={3}
            />

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
              <Button onClick={analizar} disabled={!sintomasOk} className="flex-[2]">
                Analizar con IA
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ── PASO 3: CARGANDO ── */}
        {step === 3 && (
          <Card className="text-center">
            <div className="py-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>

              <h2 className="mb-2 text-lg font-semibold">Analizando síntomas...</h2>
              <p className="mb-6 text-muted-foreground">La IA está evaluando tu caso</p>

              <div className="flex justify-center mb-6">
                <LoadingDots />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {["Evaluando gravedad", "Identificando diagnósticos", "Generando ruta personalizada"].map(
                  (text, i) => (
                    <div key={i} className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {text}
                    </div>
                  )
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ── PASO 4: RUTA MÉDICA ── */}
        {step === 4 && resultado && (() => {
          const u = URGENCIAS[resultado.urgencia] || URGENCIAS.baja
          const urgencyStyles = {
            alta: "border-l-red-500 bg-red-50/50",
            media: "border-l-amber-500 bg-amber-50/50",
            baja: "border-l-emerald-500 bg-emerald-50/50",
          }
          const urgencyTextStyles = {
            alta: "text-red-700",
            media: "text-amber-700",
            baja: "text-emerald-700",
          }

          return (
            <div className="space-y-4">
              {/* Nivel de urgencia */}
              <Card className={cn("border-l-4", urgencyStyles[resultado.urgencia])}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nivel de urgencia</p>
                    <h3 className={cn("text-xl font-semibold", urgencyTextStyles[resultado.urgencia])}>
                      {u.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {u.tiempo}
                    </p>
                  </div>
                  <Badge variant={u.color as "success" | "warning" | "destructive"}>
                    {resultado.especialidad}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">{resultado.resumen}</p>
                </div>
              </Card>

              {/* Ruta médica */}
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Tu ruta médica
                </h3>

                <div className="space-y-0">
                  {resultado.pasos?.map((p, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                          {p.orden}
                        </div>
                        {i < resultado.pasos.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{p.titulo}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {p.tiempo}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {p.descripcion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Diagnósticos y exámenes */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <h4 className="text-sm font-semibold mb-3">Posibles diagnósticos</h4>
                  <ul className="space-y-1.5">
                    {resultado.diagnosticos_posibles?.map((d, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <h4 className="text-sm font-semibold mb-3">Exámenes recomendados</h4>
                  <ul className="space-y-1.5">
                    {resultado.examenes_recomendados?.map((e, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Recomendaciones y alarmas */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-t-2 border-t-emerald-500">
                  <h4 className="text-sm font-semibold mb-3 text-emerald-700">Recomendaciones</h4>
                  <ul className="space-y-1.5">
                    {resultado.recomendaciones_inmediatas?.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="border-t-2 border-t-red-500">
                  <h4 className="text-sm font-semibold mb-3 text-red-700">Señales de alarma</h4>
                  <ul className="space-y-1.5">
                    {resultado.señales_alarma?.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Aviso */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <strong>Importante:</strong> Esta evaluación es orientativa y no reemplaza la consulta
                médica profesional.
              </div>

              {/* Acciones */}
              <div className="pt-2">
                <Button
                  onClick={() => {
                    setCita((p) => ({ ...p, especialidad: resultado.especialidad }))
                    setStep(5)
                  }}
                  className="w-full"
                  size="lg"
                >
                  Agendar cita médica
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button variant="ghost" onClick={reiniciar} className="w-full mt-2">
                  Nueva evaluación
                </Button>
              </div>
            </div>
          )
        })()}

        {/* ── PASO 5: AGENDAR CITA ── */}
        {step === 5 && (
          <div className="space-y-4">
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Selecciona la clínica</h2>
              </div>

              <div className="space-y-3">
                {CLINICAS.map((c) => {
                  const selected = cita.clinica?.id === c.id
                  return (
                    <div
                      key={c.id}
                      onClick={() => setCita((p) => ({ ...p, clinica: c, especialidad: c.especialidades[0] }))}
                      className={cn(
                        "rounded-xl border p-4 cursor-pointer transition-all",
                        selected
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-border hover:border-emerald-200 hover:bg-emerald-50/50"
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{c.nombre}</h3>
                            {selected && (
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />
                            {c.dir}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={c.zona === "rural" ? "warning" : "outline"}
                              className="text-[10px]"
                            >
                              {c.zona === "rural" ? (
                                <><TreePine className="h-2.5 w-2.5 mr-1" />Rural</>
                              ) : (
                                <><Building2 className="h-2.5 w-2.5 mr-1" />Urbana</>
                              )}
                            </Badge>
                            {c.especialidades.slice(0, 2).map((e) => (
                              <Badge
                                key={e}
                                variant={e === resultado?.especialidad ? "success" : "outline"}
                                className="text-[10px]"
                              >
                                {e}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-emerald-700">$45.000</p>
                          <p className="text-[10px] text-muted-foreground">Consulta</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {cita.clinica && (
              <Card>
                <h3 className="font-semibold mb-4">Fecha y hora</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Fecha"
                    type="date"
                    value={cita.fecha}
                    onChange={(e) => setCita((p) => ({ ...p, fecha: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                  />

                  <Select
                    label="Especialidad"
                    value={cita.especialidad}
                    onChange={(e) => setCita((p) => ({ ...p, especialidad: e.target.value }))}
                  >
                    {cita.clinica.especialidades.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </Select>
                </div>

                <label className="text-sm text-muted-foreground block mb-2">
                  Horario disponible
                </label>
                <div className="flex flex-wrap gap-2">
                  {HORARIOS.map((h) => {
                    const selected = cita.hora === h
                    return (
                      <button
                        key={h}
                        onClick={() => setCita((p) => ({ ...p, hora: h }))}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-all",
                          selected
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-medium"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
              <Button onClick={() => setStep(6)} disabled={!citaOk} className="flex-[2]">
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── PASO 6: TRANSPORTE ── */}
        {step === 6 && (
          <div className="space-y-4">
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Car className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Transporte Inteligente</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Calcularemos la ruta más eficiente y el costo real por kilómetros recorridos.
              </p>

              {/* Estado de ubicación */}
              <div className="rounded-xl bg-muted/50 p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className={cn("h-4 w-4", ubicacionActual ? "text-emerald-600" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">Tu ubicación</span>
                  </div>
                  {obteniendoUbicacion ? (
                    <Badge variant="outline" className="text-[10px]">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Detectando...
                    </Badge>
                  ) : ubicacionActual ? (
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-800">
                      <Check className="h-3 w-3 mr-1" />
                      Detectada
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      No disponible
                    </Badge>
                  )}
                </div>
                {ubicacionActual && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Coordenadas: {ubicacionActual.lat.toFixed(4)}, {ubicacionActual.lng.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Input de dirección opcional */}
              <div className="space-y-1.5 mb-4">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección de origen (opcional)
                </label>
                <input
                  ref={origenInputRef}
                  type="text"
                  value={origenDir}
                  onChange={(e) => setOrigenDir(e.target.value)}
                  placeholder="Ej. Bocagrande Calle 5, Cartagena (o usa tu ubicación actual)"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Si no escribes una dirección, usaremos tu ubicación GPS actual
                </p>
              </div>

              {/* Destino (clínica seleccionada) */}
              <div className="rounded-xl bg-muted/50 p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Destino</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  {cita.clinica?.nombre}
                </p>
                <p className="text-xs text-muted-foreground ml-6">{cita.clinica?.dir}</p>
                <Badge
                  variant={cita.clinica?.zona === "rural" ? "warning" : "outline"}
                  className="mt-2 text-[10px]"
                >
                  Zona {cita.clinica?.zona}
                </Badge>
              </div>

              {/* Botón para calcular distancia */}
              <Button
                onClick={calcularDistancia}
                disabled={calculandoDistancia || (!ubicacionActual && !origenDir.trim())}
                variant="outline"
                className="w-full mb-4"
              >
                {calculandoDistancia ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Route className="h-4 w-4" />
                )}
                {calculandoDistancia ? "Calculando ruta..." : "Calcular distancia y costo"}
              </Button>

              {errorDistancia && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  {errorDistancia}
                </div>
              )}

              {/* Resultado de la distancia */}
              {distanciaInfo && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Ruta calculada
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-blue-700">Distancia</p>
                      <p className="text-xl font-bold text-blue-900">{distanciaInfo.distancia.km} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Tiempo estimado</p>
                      <p className="text-xl font-bold text-blue-900">{distanciaInfo.duracion.texto}</p>
                    </div>
                  </div>
                  
                  {/* Información adicional de la ruta */}
                  <div className="border-t border-blue-200 pt-3 mt-3 space-y-2">
                    {distanciaInfo.zonaRural && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-2">
                        <AlertTriangle className="h-4 w-4" />
                        Zona rural detectada - Tarifa especial aplicada
                      </div>
                    )}
                    {distanciaInfo.peajes && distanciaInfo.peajes.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">Peajes en la ruta:</p>
                        {distanciaInfo.peajes.map((p: { nombre: string; precio: number }, i: number) => (
                          <div key={i} className="flex justify-between text-blue-700">
                            <span>{p.nombre}</span>
                            <span>${p.precio.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selección de vehículo */}
              {distanciaInfo && (
                <>
                  <h3 className="font-semibold mb-3">Selecciona tu vehículo</h3>
                  <div className="space-y-3">
                    {AUTOS.map((a) => {
                      const selected = autoSel?.id === a.id
                      const tarifa = getTarifa(a)
                      const costo = Math.round(tarifa * distanciaInfo.distancia.km)
                      const Icon = a.icon

                      return (
                        <div
                          key={a.id}
                          onClick={() => setAutoSel(selected ? null : a)}
                          className={cn(
                            "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all",
                            selected
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-border hover:border-emerald-200"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                              selected ? "bg-emerald-100" : "bg-muted"
                            )}
                          >
                            <Icon className={cn("h-6 w-6", selected ? "text-emerald-600" : "text-muted-foreground")} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{a.tipo}</span>
                              <span className={cn("font-semibold", selected && "text-emerald-700")}>
                                ${costo.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{a.descripcion}</p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[10px]">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                {a.eta}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                <Users className="h-2.5 w-2.5 mr-1" />
                                {a.capacidad} pasajeros
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                ${tarifa.toLocaleString()}/km
                              </Badge>
                            </div>
                          </div>

                          {selected && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* Descuentos y opciones adicionales */}
            {autoSel && distanciaInfo && (
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold">Descuentos disponibles</h3>
                </div>

                <div className="space-y-2 mb-4">
                  <Checkbox
                    checked={descuentosActivos.terceraEdad}
                    onChange={(checked) =>
                      setDescuentosActivos((p) => ({ ...p, terceraEdad: checked }))
                    }
                    label="Tercera Edad (60+ años)"
                    description="15% de descuento en transporte"
                    icon={Baby}
                  />
                  <Checkbox
                    checked={descuentosActivos.discapacidad}
                    onChange={(checked) =>
                      setDescuentosActivos((p) => ({ ...p, discapacidad: checked }))
                    }
                    label="Persona con discapacidad"
                    description="20% de descuento en transporte"
                    icon={Accessibility}
                  />
                  <Checkbox
                    checked={descuentosActivos.subsidioEPS}
                    onChange={(checked) =>
                      setDescuentosActivos((p) => ({ ...p, subsidioEPS: checked }))
                    }
                    label="Subsidio EPS"
                    description="30% de descuento autorizado por la EPS"
                    icon={BadgePercent}
                  />
                </div>

                {/* Acompañante */}
                {parseInt(datos.edad) >= 70 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <UserPlus className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Acompañante incluido automáticamente
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1 ml-6">
                      Por la edad del paciente, se reservará espacio para 1 acompañante
                    </p>
                  </div>
                )}

                {/* Peajes */}
                {calcularPeajes() > 0 && (
                  <div className="rounded-xl bg-muted/50 p-3 mb-4">
                    <p className="text-sm font-medium mb-1">Peajes en la ruta:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {PEAJES.filter(p => p.rutasAfectadas.includes(cita.clinica!.zona) && distanciaInfo.distancia.km > 10).map((p) => (
                        <li key={p.nombre} className="flex justify-between">
                          <span>{p.nombre}</span>
                          <span>${p.costo.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resumen de costos */}
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Desglose del costo
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tarifa base ({distanciaInfo.distancia.km} km x ${getTarifa(autoSel).toLocaleString()}/km)
                      </span>
                      <span>${costoTransporte.base.toLocaleString()}</span>
                    </div>
                    {costoTransporte.peajes > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peajes</span>
                        <span>+${costoTransporte.peajes.toLocaleString()}</span>
                      </div>
                    )}
                    {costoTransporte.descuento > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Descuentos ({descuentoInfo.porcentaje}%)</span>
                        <span>-${costoTransporte.descuento.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-emerald-200">
                      <span>Total transporte</span>
                      <span className="text-emerald-700">${costoTransporte.total.toLocaleString()}</span>
                    </div>
                  </div>
                  {descuentoInfo.detalles.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-xs text-emerald-700">Descuentos aplicados:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {descuentoInfo.detalles.map((d) => (
                          <Badge key={d} variant="success" className="text-[10px]">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(5)} className="flex-1">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
              <Button onClick={() => setStep(7)} className="flex-[2]">
                {autoSel ? "Ir al pago" : "Continuar sin transporte"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── PASO 7: PAGO ── */}
        {step === 7 && (
          <div className="space-y-4">
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Resumen del pago</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <div>
                    <p className="text-sm">Consulta médica ({tipoRegimen === "subsidiado" ? "Subsidiado" : "Contributivo"})</p>
                    <p className="text-xs text-muted-foreground">{cita.clinica?.nombre}</p>
                  </div>
                  <span className="font-medium">${PRECIOS_CONSULTA[tipoRegimen].toLocaleString()}</span>
                </div>

                {autoSel && distanciaInfo && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <div>
                        <p className="text-sm">Transporte {autoSel.tipo}</p>
                        <p className="text-xs text-muted-foreground">
                          {distanciaInfo.distancia.km} km - {origenDir}
                        </p>
                      </div>
                      <span className="font-medium">
                        ${costoTransporte.base.toLocaleString()}
                      </span>
                    </div>

                    {costoTransporte.peajes > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <div>
                          <p className="text-sm">Peajes</p>
                          <p className="text-xs text-muted-foreground">Zona {cita.clinica?.zona}</p>
                        </div>
                        <span className="font-medium">
                          ${costoTransporte.peajes.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {costoTransporte.descuento > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-border text-emerald-700">
                        <div>
                          <p className="text-sm">Descuentos aplicados</p>
                          <p className="text-xs">{descuentoInfo.detalles.join(", ")}</p>
                        </div>
                        <span className="font-medium">
                          -${costoTransporte.descuento.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {tieneAcompanante && (
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-amber-600" />
                      <p className="text-sm">Acompañante incluido</p>
                    </div>
                    <span className="font-medium text-emerald-700">Gratis</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-emerald-700">
                    ${(PRECIOS_CONSULTA[tipoRegimen] + (autoSel ? costoTransporte.total : 0)).toLocaleString()} COP
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Método de pago</h3>

              <div className="space-y-2">
                {tarjetas.map((t) => {
                  const selected = t.id === tarjetaSel
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTarjetaSel(t.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                        selected ? "border-emerald-300 bg-emerald-50" : "border-border hover:bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-12 items-center justify-center rounded-lg border",
                          selected ? "border-emerald-300 bg-white" : "border-border bg-muted"
                        )}
                      >
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {t.tipo} **** {t.ultimos}
                        </p>
                      </div>
                      {selected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button 
                onClick={() => setMostrarModalTarjeta(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar nueva tarjeta
              </button>
            </Card>

            <Button
              onClick={async () => {
                registrarViaje()
                await procesarPago()
              }}
              disabled={guardandoReserva}
              className="w-full"
              size="lg"
            >
              {guardandoReserva ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  Confirmar y pagar $
                  {(PRECIOS_CONSULTA[tipoRegimen] + (autoSel ? costoTransporte.total : 0)).toLocaleString()} COP
                </>
              )}
            </Button>

            <Button variant="outline" onClick={() => setStep(6)} className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
          </div>
        )}

        {/* ── PASO 8: CONFIRMADO ── */}
        {step === 8 && (
          <div className="space-y-4">
            <Card className="text-center">
              <div className="py-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>

                <h2 className="text-xl font-semibold mb-2">¡Todo confirmado!</h2>
                <p className="text-muted-foreground">
                  Tu cita y transporte han sido reservados y el pago procesado exitosamente.
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Detalles de la reserva</h3>

              <div className="space-y-3">
                {[
                  ["Paciente", datos.nombre],
                  ["Clínica", cita.clinica?.nombre],
                  ["Dirección", cita.clinica?.dir],
                  ["Fecha", cita.fecha],
                  ["Hora", cita.hora],
                  ["Especialidad", cita.especialidad],
                  autoSel && distanciaInfo && [
                    "Transporte",
                    `${autoSel.tipo} · ${distanciaInfo.distancia.km} km`,
                  ],
                  autoSel && distanciaInfo && ["Origen", origenDir],
                  tieneAcompanante && ["Acompañante", "1 persona incluida"],
                  [
                    "Total pagado",
                    `$${(45000 + (autoSel ? costoTransporte.total : 0)).toLocaleString()} COP`,
                  ],
                ]
                  .filter(Boolean)
                  .map(([key, value], i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">{key}</span>
                      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
              </div>
            </Card>

            {autoSel && distanciaInfo && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                <strong>Ruta recomendada:</strong> {distanciaInfo.distancia.texto} - {distanciaInfo.duracion.texto} de viaje.
                El conductor seguirá la ruta más eficiente calculada por Google Maps.
              </div>
            )}

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <strong>Recordatorio:</strong> Recibirás una notificación 1 hora antes de tu cita. El
              conductor llegará 10 minutos antes de la hora acordada.
            </div>

            <Button variant="outline" onClick={reiniciar} className="w-full">
              Nueva evaluación
            </Button>
          </div>
        )}
      </div>

      {/* Modal para agregar nueva tarjeta */}
      {mostrarModalTarjeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Agregar nueva tarjeta</h3>
              <button
                onClick={() => {
                  setMostrarModalTarjeta(false)
                  setNuevaTarjeta({ numero: "", nombre: "", vencimiento: "", cvv: "" })
                }}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={formatearNumeroTarjeta(nuevaTarjeta.numero)}
                  onChange={(e) => setNuevaTarjeta({ 
                    ...nuevaTarjeta, 
                    numero: e.target.value.replace(/\D/g, "").slice(0, 16) 
                  })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Nombre en la tarjeta
                </label>
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  value={nuevaTarjeta.nombre}
                  onChange={(e) => setNuevaTarjeta({ ...nuevaTarjeta, nombre: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={formatearVencimiento(nuevaTarjeta.vencimiento)}
                    onChange={(e) => setNuevaTarjeta({ 
                      ...nuevaTarjeta, 
                      vencimiento: e.target.value.replace(/\D/g, "").slice(0, 4) 
                    })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={nuevaTarjeta.cvv}
                    onChange={(e) => setNuevaTarjeta({ 
                      ...nuevaTarjeta, 
                      cvv: e.target.value.replace(/\D/g, "").slice(0, 4) 
                    })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarModalTarjeta(false)
                    setNuevaTarjeta({ numero: "", nombre: "", vencimiento: "", cvv: "" })
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={agregarTarjeta}
                  disabled={
                    nuevaTarjeta.numero.length < 16 ||
                    !nuevaTarjeta.nombre ||
                    nuevaTarjeta.vencimiento.length < 4 ||
                    nuevaTarjeta.cvv.length < 3
                  }
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Agregar tarjeta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para consultar reservas */}
      {mostrarModalReservas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IdCard className="h-5 w-5 text-emerald-600" />
                Consultar mis citas
              </h3>
              <button
                onClick={() => {
                  setMostrarModalReservas(false)
                  setConsultaIdentificacion("")
                  setReservasEncontradas([])
                  setErrorReservas("")
                }}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Número de identificación
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresa tu número de identificación"
                    value={consultaIdentificacion}
                    onChange={(e) => setConsultaIdentificacion(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && buscarReservas()}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button onClick={buscarReservas} disabled={buscandoReservas || !consultaIdentificacion.trim()}>
                    {buscandoReservas ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {errorReservas && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {errorReservas}
                </div>
              )}

              {reservasEncontradas.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Se encontraron {reservasEncontradas.length} cita(s)
                  </h4>
                  
                  {reservasEncontradas.map((reserva, index) => (
                    <div key={reserva.id || index} className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-700">
                          Cita #{reserva.id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reserva.created_at).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Paciente:</span>
                          <p className="font-medium">{reserva.nombre_paciente}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Régimen:</span>
                          <p className="font-medium capitalize">{reserva.tipo_regimen}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clínica:</span>
                          <p className="font-medium">{reserva.clinica_nombre}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Especialidad:</span>
                          <p className="font-medium">{reserva.especialidad}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fecha:</span>
                          <p className="font-medium">{reserva.fecha_cita}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hora:</span>
                          <p className="font-medium">{reserva.hora_cita}</p>
                        </div>
                      </div>

                      {reserva.vehiculo_tipo && (
                        <div className="border-t border-border pt-3 mt-3">
                          <p className="text-xs text-muted-foreground mb-2">Transporte</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Vehículo:</span>
                              <p className="font-medium">{reserva.vehiculo_tipo} - {reserva.vehiculo_modelo}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Placa:</span>
                              <p className="font-medium">{reserva.vehiculo_placa}</p>
                            </div>
                            {reserva.distancia_km && (
                              <div>
                                <span className="text-muted-foreground">Distancia:</span>
                                <p className="font-medium">{parseFloat(reserva.distancia_km).toFixed(1)} km</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-border pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total pagado:</span>
                          <span className="font-bold text-emerald-700 text-lg">
                            ${parseFloat(reserva.costo_total).toLocaleString("es-CO")} COP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
