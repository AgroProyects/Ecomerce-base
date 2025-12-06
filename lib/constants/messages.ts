// Mensajes y textos de la aplicación

export const MESSAGES = {
  // Éxito
  SUCCESS: {
    PRODUCT_CREATED: 'Producto creado exitosamente',
    PRODUCT_UPDATED: 'Producto actualizado exitosamente',
    PRODUCT_DELETED: 'Producto eliminado exitosamente',
    CATEGORY_CREATED: 'Categoría creada exitosamente',
    CATEGORY_UPDATED: 'Categoría actualizada exitosamente',
    CATEGORY_DELETED: 'Categoría eliminada exitosamente',
    ORDER_UPDATED: 'Orden actualizada exitosamente',
    SETTINGS_SAVED: 'Configuración guardada exitosamente',
    IMAGE_UPLOADED: 'Imagen subida exitosamente',
    IMAGE_DELETED: 'Imagen eliminada exitosamente',
    LOGGED_IN: 'Sesión iniciada correctamente',
    LOGGED_OUT: 'Sesión cerrada correctamente',
  },

  // Errores
  ERROR: {
    GENERIC: 'Ha ocurrido un error. Por favor, intenta nuevamente.',
    NOT_FOUND: 'El recurso solicitado no existe',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
    UNAUTHENTICATED: 'Debes iniciar sesión para continuar',
    VALIDATION: 'Por favor, verifica los datos ingresados',
    NETWORK: 'Error de conexión. Verifica tu internet.',
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    CATEGORY_NOT_FOUND: 'Categoría no encontrada',
    ORDER_NOT_FOUND: 'Orden no encontrada',
    OUT_OF_STOCK: 'Producto sin stock disponible',
    INSUFFICIENT_STOCK: 'Stock insuficiente para la cantidad solicitada',
    INVALID_QUANTITY: 'Cantidad inválida',
    CART_EMPTY: 'El carrito está vacío',
    PAYMENT_FAILED: 'El pago no pudo procesarse',
    UPLOAD_FAILED: 'Error al subir la imagen',
    FILE_TOO_LARGE: 'El archivo es demasiado grande',
    INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
    SLUG_EXISTS: 'El slug ya existe, elige otro nombre',
  },

  // Confirmaciones
  CONFIRM: {
    DELETE_PRODUCT: '¿Estás seguro de eliminar este producto?',
    DELETE_CATEGORY: '¿Estás seguro de eliminar esta categoría?',
    DELETE_IMAGE: '¿Estás seguro de eliminar esta imagen?',
    CANCEL_ORDER: '¿Estás seguro de cancelar esta orden?',
    CLEAR_CART: '¿Estás seguro de vaciar el carrito?',
    LOGOUT: '¿Estás seguro de cerrar sesión?',
  },

  // Información
  INFO: {
    NO_PRODUCTS: 'No hay productos disponibles',
    NO_CATEGORIES: 'No hay categorías disponibles',
    NO_ORDERS: 'No hay órdenes registradas',
    NO_RESULTS: 'No se encontraron resultados',
    LOADING: 'Cargando...',
    SAVING: 'Guardando...',
    PROCESSING: 'Procesando...',
    UPLOADING: 'Subiendo...',
  },

  // Carrito
  CART: {
    ADDED: 'Producto agregado al carrito',
    UPDATED: 'Carrito actualizado',
    REMOVED: 'Producto eliminado del carrito',
    CLEARED: 'Carrito vaciado',
  },

  // Checkout
  CHECKOUT: {
    REDIRECTING: 'Redirigiendo al pago...',
    SUCCESS: '¡Pago exitoso! Gracias por tu compra.',
    PENDING: 'Tu pago está siendo procesado.',
    FAILURE: 'Hubo un problema con tu pago.',
  },
} as const

// Textos de UI
export const UI_TEXT = {
  BUTTONS: {
    SAVE: 'Guardar',
    CANCEL: 'Cancelar',
    DELETE: 'Eliminar',
    EDIT: 'Editar',
    CREATE: 'Crear',
    ADD: 'Agregar',
    REMOVE: 'Quitar',
    SEARCH: 'Buscar',
    FILTER: 'Filtrar',
    CLEAR: 'Limpiar',
    CONFIRM: 'Confirmar',
    BACK: 'Volver',
    NEXT: 'Siguiente',
    PREVIOUS: 'Anterior',
    SUBMIT: 'Enviar',
    UPLOAD: 'Subir',
    DOWNLOAD: 'Descargar',
    EXPORT: 'Exportar',
    IMPORT: 'Importar',
    VIEW_ALL: 'Ver todos',
    ADD_TO_CART: 'Agregar al carrito',
    BUY_NOW: 'Comprar ahora',
    CHECKOUT: 'Finalizar compra',
    CONTINUE_SHOPPING: 'Seguir comprando',
    LOGIN: 'Iniciar sesión',
    LOGOUT: 'Cerrar sesión',
    REGISTER: 'Registrarse',
  },
  LABELS: {
    NAME: 'Nombre',
    EMAIL: 'Email',
    PASSWORD: 'Contraseña',
    PHONE: 'Teléfono',
    ADDRESS: 'Dirección',
    CITY: 'Ciudad',
    STATE: 'Provincia',
    ZIP_CODE: 'Código postal',
    COUNTRY: 'País',
    PRICE: 'Precio',
    STOCK: 'Stock',
    CATEGORY: 'Categoría',
    DESCRIPTION: 'Descripción',
    IMAGES: 'Imágenes',
    STATUS: 'Estado',
    DATE: 'Fecha',
    QUANTITY: 'Cantidad',
    SUBTOTAL: 'Subtotal',
    SHIPPING: 'Envío',
    DISCOUNT: 'Descuento',
    TOTAL: 'Total',
  },
} as const
