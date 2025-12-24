# Documentacion de Costos Operativos

Esta carpeta contiene el analisis completo de costos operativos mensuales del e-commerce.

## Documentos Disponibles

### 1. [ANALISIS_COSTOS_OPERATIVOS.md](./ANALISIS_COSTOS_OPERATIVOS.md)
**Documento principal - Analisis detallado completo**

Contenido:
- Desglose de todos los servicios de infraestructura
- Estimaciones de uso real basadas en codigo fuente
- Comparaciones de planes (Free, Pro, Enterprise)
- Proyecciones anuales
- Optimizaciones recomendadas
- Riesgos y contingencias

**Audiencia:** CTO, CFO, Equipo tecnico
**Longitud:** ~15,000 palabras
**Tiempo de lectura:** 45-60 minutos

---

### 2. [DASHBOARD_COSTOS.md](./DASHBOARD_COSTOS.md)
**Vista ejecutiva - Metricas y graficos**

Contenido:
- Resumen ejecutivo (TL;DR)
- Visualizaciones ASCII de costos
- KPIs y health score
- Sistema de alertas
- Quick wins y optimizaciones
- Decision matrix para upgrades

**Audiencia:** Management, Product Owners
**Longitud:** ~5,000 palabras
**Tiempo de lectura:** 15-20 minutos

---

## Resumen Rapido

### Costos Mensuales por Escenario

| Escenario | Transacciones | Costos Fijos | Comisiones MP | Total Mensual |
|-----------|---------------|--------------|---------------|---------------|
| **Basico** | 1,000 | $26.50 | $224.00 | **$250.50** |
| **Medio** | 5,000 | $94.50 | $1,122.00 | **$1,216.50** |
| **Escalado** | 20,000 | $208.35 | $4,490.00 | **$4,698.35** |

### Stack Tecnologico

| Servicio | Proveedor | Uso |
|----------|-----------|-----|
| Database + Auth + Storage | Supabase | PostgreSQL, Auth, File storage |
| Cache + Rate Limiting | Upstash Redis | Cache layer, BullMQ queues |
| Email Service | Nodemailer/Resend | Transactional emails |
| Payment Gateway | MercadoPago | Pagos en Argentina |
| Monitoring | Sentry | Error tracking, performance |
| Hosting + CDN | Vercel | Next.js hosting, Edge network |

---

## Calculadora Rapida de Costos

### Formula Basica

```
Costo Total Mensual = Costos Fijos + (Transacciones × Costo Variable)

Donde:
- Costos Fijos = Supabase + Redis + Email + Sentry + Vercel + Dominio
- Costo Variable = Comisiones MercadoPago (4.49% del GMV)
```

### Ejemplos de Calculo

#### Ejemplo 1: Startup en lanzamiento
```
Transacciones esperadas: 500/mes
Ticket promedio: $5,000 ARS ($5 USD)
GMV mensual: $2,500 USD

Costos Fijos:
- Supabase Pro: $25 (requerido por storage)
- Upstash Redis Free: $0
- Resend Free: $0
- Sentry Free: $0
- Vercel Hobby: $0
- Dominio: $1.50
Total Fijos: $26.50

Costos Variables:
- GMV: 500 × $5 = $2,500
- Comisiones MP: $2,500 × 4.49% = $112.25

TOTAL MENSUAL: $26.50 + $112.25 = $138.75
Costo por transaccion: $0.28
```

#### Ejemplo 2: E-commerce en crecimiento
```
Transacciones esperadas: 10,000/mes
Ticket promedio: $5,000 ARS ($5 USD)
GMV mensual: $50,000 USD

Costos Fijos:
- Supabase Pro: $25
- Upstash Redis Pay-as-go: $3
- Resend Pro: $20
- Sentry Team: $26
- Vercel Pro: $20
- Dominio: $1.50
Total Fijos: $95.50

Costos Variables:
- GMV: 10,000 × $5 = $50,000
- Comisiones MP: $50,000 × 4.49% = $2,245

TOTAL MENSUAL: $95.50 + $2,245 = $2,340.50
Costo por transaccion: $0.23
```

#### Ejemplo 3: E-commerce escalado
```
Transacciones esperadas: 50,000/mes
Ticket promedio: $5,000 ARS ($5 USD)
GMV mensual: $250,000 USD

Costos Fijos:
- Supabase Pro + extras: $75
- Upstash Redis: $10
- SendGrid Pro: $90
- Sentry Team: $30
- Vercel Pro + extras: $50
- Dominio: $1.50
Total Fijos: $256.50

Costos Variables:
- GMV: 50,000 × $5 = $250,000
- Comisiones MP: $250,000 × 4.49% = $11,225

TOTAL MENSUAL: $256.50 + $11,225 = $11,481.50
Costo por transaccion: $0.23
```

---

## Breakpoints de Upgrade

### Cuando Actualizar Servicios

#### Supabase: Free → Pro ($25/mes)
**Trigger:** Necesitas >1 GB storage O >2 GB bandwidth
```
Checklist:
[ ] Tienes >100 productos con imagenes
[ ] Database >500 MB
[ ] Proyecto en produccion (no puede pausarse)
[ ] Necesitas backups automaticos
```

#### Upstash Redis: Free → Pay-as-go
**Trigger:** >10,000 comandos/dia
```
Checklist:
[ ] >500 API requests/dia
[ ] Cache hit ratio >50%
[ ] Queue con >100 jobs/dia
[ ] Rate limiting en >200 requests/dia
```

#### Email: Free → Pro
**Trigger:** >3,000 emails/mes (Resend) o >100 emails/dia (Gmail)
```
Checklist:
[ ] >100 transacciones/dia
[ ] Necesitas analytics de emails
[ ] Bounce rate >5% en free tier
[ ] Necesitas multiples dominios
```

#### Sentry: Free → Team ($26/mes)
**Trigger:** >5,000 events/mes O necesitas >30 dias retention
```
Checklist:
[ ] >1,000 requests/dia en produccion
[ ] Necesitas 90 dias de retention
[ ] Equipo >1 developer
[ ] Necesitas alertas avanzadas
```

#### Vercel: Hobby → Pro ($20/mes)
**Trigger:** >100 GB bandwidth/mes O team collaboration
```
Checklist:
[ ] >5,000 page views/mes
[ ] Necesitas password protection
[ ] Equipo >1 developer
[ ] Necesitas analytics avanzado
[ ] >1,000 image optimizations/mes
```

---

## Unit Economics - Calculadora

### Inputs
```
Ticket Promedio:        $_____ USD
Margin Bruto (%):       _____% (tipico 25-35% e-commerce)
Costo Operativo/txn:    $0.24  (basado en analisis)
Marketing (CAC):        $_____ (tipico 10-15% del GMV)
```

### Formula
```
Revenue por transaccion = Ticket × Margin%
Costos por transaccion  = Costo Ops + CAC
Net Margin             = Revenue - Costos
```

### Ejemplo Real
```
Ticket Promedio:        $5.00 USD
Margin Bruto:           30%
Costo Operativo:        $0.24
Marketing (CAC):        $0.50 (10% del ticket)

Revenue:    $5.00 × 30% = $1.50
Costos:     $0.24 + $0.50 = $0.74
Net Margin: $1.50 - $0.74 = $0.76 por transaccion (15.2% net margin)

ROI por transaccion: $0.76 / $0.74 = 103% ROI
```

### Volumen para Break-Even Mensual

Asumiendo costos fijos de $95/mes (escenario medio):

```
Break-even = Costos Fijos / Net Margin por transaccion
Break-even = $95 / $0.76 = 125 transacciones/mes

Para cubrir TODOS los costos (incluyendo variables):
Total costos/mes = Fijos + (Transacciones × Costo Variable)
$95 + (125 × $0.24) = $95 + $30 = $125/mes

Revenue necesario:
125 × $1.50 = $187.50/mes

Ratio: $187.50 revenue para $125 costos = 67% costos/revenue
Margin neto: 33% - SALUDABLE
```

---

## Optimizaciones por Nivel

### Nivel 1: Gratuitas (0 USD, <2 horas implementacion)

1. **Cache agresivo**
   ```typescript
   // lib/cache/redis.ts
   PRODUCTS: 60 * 10,     // 5min → 10min
   CATEGORIES: 60 * 30,   // 10min → 30min
   FEATURED: 60 * 15,     // 5min → 15min
   ```
   **Ahorro:** $1-2/mes en Redis

2. **Sentry sample rate**
   ```typescript
   // sentry.server.config.ts
   tracesSampleRate: 0.05  // 10% → 5%
   ```
   **Ahorro:** Retrasa upgrade a plan pago

3. **Image optimization**
   ```typescript
   // next.config.ts
   deviceSizes: [640, 1080, 1920]  // De 7 a 3 tamaños
   ```
   **Ahorro:** $5-10/mes en Vercel

**Total ahorro Nivel 1:** $6-12/mes

---

### Nivel 2: Migraciones (0-20 USD setup, 2-8 horas)

1. **Migrar a Resend Email**
   - Setup: 2 horas
   - Costo: $0 (free tier)
   - Beneficio: Mejor deliverability, analytics

2. **Implementar Stripe como backup de MercadoPago**
   - Setup: 4 horas
   - Costo: $0 (solo cobra en uso)
   - Beneficio: Reducir riesgo downtime

3. **Cloudflare CDN para assets estaticos**
   - Setup: 3 horas
   - Costo: $0 (free tier)
   - Beneficio: Mejor performance global

**Total ahorro Nivel 2:** $0/mes (mejoras cualitativas)

---

### Nivel 3: Negociaciones (Requiere volumen)

1. **MercadoPago comisiones**
   - Requisito: >$50M ARS/mes GMV
   - Descuento potencial: 0.5-1%
   - Ahorro: $200-500/mes

2. **Vercel Enterprise**
   - Requisito: >$10k/mes en costos
   - Descuentos: Custom pricing
   - Ahorro: 15-30%

3. **Amazon SES en lugar de SendGrid**
   - Requisito: >100k emails/mes
   - Costo: $10/mes vs $90/mes
   - Ahorro: $80/mes

**Total ahorro Nivel 3:** $280-580/mes (solo a escala)

---

## Red Flags - Cuando Preocuparse

### Alertas de Costos

#### 🟢 Verde - Todo OK
```
✓ Costos diarios <$50
✓ % Costos del GMV <5%
✓ Costo por transaccion <$0.30
✓ Costos fijos <2% del GMV
```

#### 🟡 Amarillo - Revisar
```
⚠ Costos diarios $50-$150
⚠ % Costos del GMV 5-8%
⚠ Costo por transaccion $0.30-$0.50
⚠ Costos fijos 2-5% del GMV
⚠ Servicios cerca del limite del plan
```

**Accion:** Revisar uso, optimizar cache, considerar upgrades planificados

#### 🔴 Rojo - Accion Inmediata
```
✗ Costos diarios >$150 (sin cambio en volumen)
✗ % Costos del GMV >8%
✗ Costo por transaccion >$0.50
✗ Servicios sobre-limite (cargos excesivos)
✗ Downtime de servicio critico
```

**Accion:** Incident response, rollback si es deployment, contactar soporte

---

## Benchmarks de Industria

### Costos Operativos como % del GMV

```
E-commerce Bootstrap (0-100k GMV/mes):
- Excelente: <3%     ✓ Tu posicion actual: 1.6%
- Bueno: 3-5%
- Aceptable: 5-8%
- Malo: >8%

E-commerce Medio (100k-1M GMV/mes):
- Excelente: <2%     ✓ Tu posicion objetivo: 1.5%
- Bueno: 2-4%
- Aceptable: 4-6%
- Malo: >6%

E-commerce Enterprise (>1M GMV/mes):
- Excelente: <1%
- Bueno: 1-2%
- Aceptable: 2-3%
- Malo: >3%
```

### Comparacion con Competidores

| Metrica | Tu Stack | Shopify | WooCommerce | Magento |
|---------|----------|---------|-------------|---------|
| Costo fijo mensual | $26-95 | $79-299 | $30-100 | $2,000+ |
| Comisiones pago | 4.49% | 2.9%+$0.30 | 2.9%+$0.30 | Variable |
| Setup inicial | $0 | $0 | $100-500 | $10k+ |
| Mantenimiento | Bajo | Muy bajo | Medio | Alto |
| Flexibilidad | Alta | Media | Alta | Muy alta |
| Time to market | Rapido | Muy rapido | Medio | Lento |

**Conclusion:** Tu stack es competitivo en costos y superior en flexibilidad.

---

## FAQs

### Costos

**Q: Por que MercadoPago cobra tanto (4.49% del GMV)?**
A: Es el costo estandar en Argentina. Incluye:
- Procesamiento de pagos
- Proteccion contra fraude
- Chargebacks management
- Compliance PCI-DSS
- Soporte 24/7

Competidores (Stripe, PayPal) cobran similar: 2.9% + $0.30/txn = ~4-5%.

**Q: Puedo usar solo free tiers?**
A: Solo temporalmente (<1 mes). Limitaciones criticas:
- Supabase Free pausa despues de 7 dias inactividad
- 500 MB database es muy poco
- 1 GB storage insuficiente para imagenes
- 2 GB bandwidth = ~5,000 page views

**Q: Cuando debo actualizar a planes pagos?**
A: Cuando alcances 80% de los limites del free tier. Ver "Breakpoints de Upgrade" arriba.

### Escalabilidad

**Q: El stack actual puede manejar 100k transacciones/mes?**
A: Si, sin cambios arquitectonicos. Solo upgrades de planes:
- Supabase: Pro o Team
- Vercel: Pro
- Email: SendGrid Pro o Amazon SES
- Redis: Pro 2K o Pay-as-go

Costo estimado: ~$15,000/mes (3% del GMV de $500k)

**Q: Cuando necesito migrar a infraestructura propia?**
A: Solo si:
- GMV >$1M USD/mes
- Costos actuales >$10k/mes
- Tienes equipo DevOps dedicado (2+ personas)
- Compliance requiere infraestructura propia

**Q: Cual es el cuello de botella mas probable?**
A: Database (Supabase). Plan de mitigacion:
1. Implementar read replicas (Supabase Team)
2. Cache agresivo (reduce 70% queries)
3. Archivado de ordenes antiguas
4. Sharding si superas 100 GB database

### Optimizaciones

**Q: Cual es la optimizacion con mejor ROI?**
A: Migrar a Resend Email (2h trabajo, $0 costo, mejor deliverability).

**Q: Vale la pena migrar a AWS/GCP?**
A: No, a menos que tengas >$10k/mes en costos. Razones:
- Costos similares o mayores
- MUCHO mas complejidad
- Requiere equipo DevOps
- Tiempo de desarrollo 10x mas lento

**Q: Como reducir comisiones de MercadoPago?**
A: Requiere volumen:
1. Alcanzar $50M ARS/mes GMV (~$50k USD)
2. Contactar account manager de MercadoPago
3. Negociar descuento (potencial 0.5-1%)

Alternativa: Implementar Stripe como alternativa (similar comisiones pero mejor para internacional).

---

## Next Steps

### Implementacion Inmediata (Esta Semana)

1. **Revisar documentacion completa**
   - Leer [ANALISIS_COSTOS_OPERATIVOS.md](./ANALISIS_COSTOS_OPERATIVOS.md)
   - Revisar [DASHBOARD_COSTOS.md](./DASHBOARD_COSTOS.md)

2. **Implementar monitoreo de costos**
   ```typescript
   // TODO: Agregar a Sentry
   - Alerta si costos diarios >$50
   - Alerta si servicios >80% limite
   - Weekly cost report email
   ```

3. **Quick wins**
   - Migrar a Resend Email (2h)
   - Optimizar cache TTL (1h)
   - Reducir Sentry sample rate (15min)

### Planificacion Mensual

4. **Setup backups y redundancia**
   - Stripe como backup de MercadoPago
   - Disaster recovery plan
   - Runbooks de incidentes

5. **Optimizaciones de performance**
   - Image optimization avanzada
   - Lazy loading
   - CDN para assets

### Revision Trimestral

6. **Evaluar crecimiento**
   - Revisar proyecciones vs real
   - Actualizar precios de servicios
   - Considerar upgrades planificados

7. **Negociaciones**
   - Contactar MercadoPago si >$50M ARS GMV
   - Evaluar migration a Amazon SES si >100k emails
   - Considerar Vercel Enterprise si >$5k/mes

---

## Recursos Adicionales

### Links Utiles

- [Supabase Pricing](https://supabase.com/pricing)
- [Upstash Pricing](https://upstash.com/pricing)
- [Resend Pricing](https://resend.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
- [MercadoPago Costs](https://www.mercadopago.com.ar/costs-section/)
- [Sentry Pricing](https://sentry.io/pricing/)

### Tools

- [Vercel Usage Dashboard](https://vercel.com/dashboard/usage)
- [Supabase Dashboard](https://app.supabase.com/)
- [Upstash Console](https://console.upstash.com/)
- [Sentry Performance](https://sentry.io/performance/)

### Contacto

**Responsable:** Equipo Backend
**Email:** backend@yourcompany.com
**Slack:** #ops-costs

---

**Ultima actualizacion:** 2024-12-24
**Version:** 1.0
**Proxima revision:** 2025-01-24
