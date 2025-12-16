# Documentación del Proyecto E-commerce

Esta carpeta contiene toda la documentación técnica del proyecto organizada por categorías.

## Estructura de Carpetas

```
docs/
├── arquitectura/          # Arquitectura del sistema y análisis técnico
├── configuracion/         # Guías de configuración y setup
├── guias/                 # Guías de uso y tutoriales
├── implementacion/        # Documentación de implementaciones específicas
└── troubleshooting/       # Solución de problemas y diagnósticos
```

## 📁 Arquitectura

Documentación sobre la arquitectura del sistema y análisis técnico completo.

- [REPORTE_ARQUITECTURA_BACKEND.md](arquitectura/REPORTE_ARQUITECTURA_BACKEND.md) - Análisis completo de la arquitectura backend (base de datos, APIs, integraciones, seguridad, performance)
- [PLAN_DE_ACCION.md](arquitectura/PLAN_DE_ACCION.md) - Plan de acción ejecutable con prioridades P0-P3 para mejoras críticas

## ⚙️ Configuración

Guías de configuración para diferentes componentes del sistema.

- [CONFIGURACION_EMAIL_VERIFICACION.md](configuracion/CONFIGURACION_EMAIL_VERIFICACION.md) - Setup de verificación de email
- [SUPABASE_EMAIL_SETUP.md](configuracion/SUPABASE_EMAIL_SETUP.md) - Configuración de email con Supabase
- [SISTEMA_VERIFICACION_EMAIL.md](configuracion/SISTEMA_VERIFICACION_EMAIL.md) - Sistema completo de verificación
- [COMO_OBTENER_CREDENCIALES_TEST.md](configuracion/COMO_OBTENER_CREDENCIALES_TEST.md) - Obtener credenciales de test de Mercado Pago
- [MEJORAS_AUTENTICACION.md](configuracion/MEJORAS_AUTENTICACION.md) - Mejoras al sistema de autenticación

## 📚 Guías

Guías de uso para diferentes funcionalidades del sistema.

- [ADMIN_PRODUCTOS_GUIA.md](guias/ADMIN_PRODUCTOS_GUIA.md) - Guía completa del panel de administración de productos
- [GUIA_CATEGORIAS.md](guias/GUIA_CATEGORIAS.md) - Gestión de categorías
- [GUIA_CHECKOUT_API.md](guias/GUIA_CHECKOUT_API.md) - Implementación del checkout con Mercado Pago API
- [GUIA_EMAIL.md](guias/GUIA_EMAIL.md) - Sistema de envío de emails
- [GUIA_MERCADOPAGO.md](guias/GUIA_MERCADOPAGO.md) - Integración completa con Mercado Pago
- [GUIA_PEDIDOS.md](guias/GUIA_PEDIDOS.md) - Gestión de pedidos
- [GUIA_STORAGE.md](guias/GUIA_STORAGE.md) - Manejo de archivos en Supabase Storage
- [GUIA_VARIANTES.md](guias/GUIA_VARIANTES.md) - Sistema de variantes de productos
- [INSTRUCCIONES_PRUEBA_MP.md](guias/INSTRUCCIONES_PRUEBA_MP.md) - Cómo probar pagos con Mercado Pago
- [MERCADOPAGO_QUICKSTART.md](guias/MERCADOPAGO_QUICKSTART.md) - Quick start de Mercado Pago

## 🔧 Implementación

Documentación técnica de implementaciones específicas.

- [IMPLEMENTACION_COMPLETA_VARIANTES.md](implementacion/IMPLEMENTACION_COMPLETA_VARIANTES.md) - Implementación del sistema de variantes
- [IMPLEMENTACION_IMAGENES_REVIEWS.md](implementacion/IMPLEMENTACION_IMAGENES_REVIEWS.md) - Imágenes en reviews
- [REVIEWS_COMPLETE.md](implementacion/REVIEWS_COMPLETE.md) - Sistema completo de reviews
- [REVIEWS_STATUS.md](implementacion/REVIEWS_STATUS.md) - Estados de reviews
- [MEJORAS_CARRITO.md](implementacion/MEJORAS_CARRITO.md) - Mejoras al carrito de compras

## 🔧 Troubleshooting

Soluciones a problemas comunes y diagnósticos.

- [DIAGNOSTICO_MERCADOPAGO.md](troubleshooting/DIAGNOSTICO_MERCADOPAGO.md) - Diagnóstico de problemas con Mercado Pago
- [SOLUCION_ERROR_REGISTRO.md](troubleshooting/SOLUCION_ERROR_REGISTRO.md) - Solución a errores de registro
- [SOLUCION_MERCADOPAGO.md](troubleshooting/SOLUCION_MERCADOPAGO.md) - Solución a problemas de Mercado Pago

## 📖 Base de Datos

Documentación de base de datos en la carpeta `supabase/`:

- [supabase/README_DATABASE_RESET.md](../supabase/README_DATABASE_RESET.md) - Guía de reset y seed de base de datos

---

## Documentos Principales del Proyecto (Raíz)

En la raíz del proyecto se mantienen solo los documentos esenciales:

- [README.md](../README.md) - Documentación principal del proyecto
- Todos los demás documentos técnicos están organizados en esta carpeta `docs/`

---

## Cómo Usar Esta Documentación

### Para Desarrolladores Nuevos

1. Comienza con [README.md](../README.md) en la raíz
2. Lee [REPORTE_ARQUITECTURA_BACKEND.md](arquitectura/REPORTE_ARQUITECTURA_BACKEND.md) para entender la arquitectura
3. Revisa las guías de configuración en [configuracion/](configuracion/)
4. Consulta las guías específicas según lo que necesites implementar

### Para Solucionar Problemas

1. Revisa [troubleshooting/](troubleshooting/) primero
2. Si es un problema de integración, ve a [guias/](guias/)
3. Si necesitas entender cómo funciona algo, revisa [implementacion/](implementacion/)

### Para Implementar Mejoras

1. Revisa [PLAN_DE_ACCION.md](arquitectura/PLAN_DE_ACCION.md) para ver las prioridades
2. Consulta [REPORTE_ARQUITECTURA_BACKEND.md](arquitectura/REPORTE_ARQUITECTURA_BACKEND.md) para el contexto completo
3. Usa las guías relevantes de [guias/](guias/) y [implementacion/](implementacion/)

---

**Última actualización:** 15 de Diciembre, 2025
**Versión:** 1.0
