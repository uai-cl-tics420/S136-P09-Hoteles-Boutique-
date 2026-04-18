import type { BaseTranslation } from "../i18n-types";

const es = {
  // General
  appName: "Hoteles Boutique",
  loading: "Cargando...",
  error: "Ocurrió un error",
  save: "Guardar",
  cancel: "Cancelar",
  delete: "Eliminar",
  edit: "Editar",
  back: "Volver",
  next: "Siguiente",
  confirm: "Confirmar",
  search: "Buscar",

  // Auth
  auth: {
    login: "Iniciar sesión",
    register: "Registrarse",
    logout: "Cerrar sesión",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    loginWithGoogle: "Continuar con Google",
    noAccount: "¿No tienes cuenta?",
    hasAccount: "¿Ya tienes cuenta?",
    forgotPassword: "¿Olvidaste tu contraseña?",
    loginSuccess: "Sesión iniciada correctamente",
    loginError: "Credenciales incorrectas",
    registerSuccess: "Cuenta creada correctamente",
    otpTitle: "Verificación en dos pasos",
    otpDescription: "Ingresa el código de 6 dígitos de tu app autenticadora",
    otpCode: "Código OTP",
    otpVerify: "Verificar código",
    otpSetupTitle: "Configura tu autenticador",
    otpSetupDescription: "Escanea el código QR con Google Authenticator o Authy",
    otpInvalid: "Código inválido, intenta nuevamente",
    otpRequired: "Debes completar la verificación en dos pasos",
  },

  // Hotels
  hotels: {
    title: "Hoteles Boutique",
    subtitle: "Experiencias exclusivas y personalizadas",
    search: "Buscar hoteles",
    searchPlaceholder: "Ciudad, nombre o tipo de experiencia...",
    noResults: "No se encontraron hoteles",
    filters: "Filtros",
    priceRange: "Rango de precio",
    category: "Categoría",
    location: "Ubicación",
    rating: "Calificación",
    perNight: "por noche",
    viewDetails: "Ver detalles",
    bookNow: "Reservar ahora",
    amenities: "Comodidades",
    rooms: "Habitaciones",
    categories: {
      LUXURY: "Lujo",
      BOUTIQUE: "Boutique",
      ECO: "Eco",
      BEACH: "Playa",
      MOUNTAIN: "Montaña",
      CITY: "Ciudad",
    },
  },

  // Bookings
  bookings: {
    title: "Mis reservas",
    new: "Nueva reserva",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Huéspedes",
    total: "Total",
    status: {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmada",
      CANCELLED: "Cancelada",
      COMPLETED: "Completada",
    },
    extras: "Servicios adicionales",
    specialRequests: "Solicitudes especiales",
    confirmBooking: "Confirmar reserva",
    bookingSuccess: "¡Reserva confirmada!",
    bookingError: "Error al procesar la reserva",
    cancel: "Cancelar reserva",
    cancelConfirm: "¿Estás seguro de que deseas cancelar esta reserva?",
    noBookings: "No tienes reservas aún",
  },

  // Admin
  admin: {
    title: "Panel de administración",
    hotels: "Mis hoteles",
    bookings: "Reservas",
    availability: "Disponibilidad",
    settings: "Configuración",
    newHotel: "Nuevo hotel",
    editHotel: "Editar hotel",
    hotelName: "Nombre del hotel",
    totalBookings: "Total reservas",
    occupancyRate: "Tasa de ocupación",
    revenue: "Ingresos",
    pendingBookings: "Reservas pendientes",
  },

  // Reviews
  reviews: {
    title: "Reseñas",
    write: "Escribir reseña",
    overall: "Calificación general",
    service: "Servicio",
    cleanliness: "Limpieza",
    location: "Ubicación",
    comment: "Comentario",
    submit: "Enviar reseña",
    noReviews: "Sin reseñas aún",
  },

  // Navigation
  nav: {
    home: "Inicio",
    hotels: "Hoteles",
    bookings: "Reservas",
    profile: "Perfil",
    admin: "Administración",
  },

  // Errors
  errors: {
    notFound: "Página no encontrada",
    unauthorized: "No autorizado",
    forbidden: "Acceso denegado",
    serverError: "Error del servidor",
    tryAgain: "Intentar nuevamente",
  },
} satisfies BaseTranslation;

export default es;