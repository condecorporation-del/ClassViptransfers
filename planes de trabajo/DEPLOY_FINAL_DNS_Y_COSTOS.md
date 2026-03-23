# DEPLOY FINAL — DNS, Costos Reales en Pesos y Pasos Detallados
## Class VIP Transfers — Guía de entrega al cliente

---

## PARTE 0 — PLAN RÁPIDO: Netlify = local + variables + dominio en línea

| # | Acción | Dónde |
|---|--------|--------|
| 1 | Sube el código de tu PC al repo (`git add`, `git commit`, `git push`) en la **misma rama** que Netlify despliega (revisa *Site settings → Build & deploy → Branches*, normalmente `main`). | Tu PC + GitHub |
| 2 | En Netlify: **Deploys** → **Trigger deploy** → *Deploy site*. Si sigue viejo: *Clear cache and deploy site*. | Netlify |
| 3 | Revisa variables **Netlify** y **Render** (PARTE 3). Corrige lo que falte. | Dashboards |
| 4 | Abre `https://classvip.netlify.app` y prueba `/book`, `/contact`, chat. | Navegador |
| 5 | Manda al administrador del dominio el mensaje de **PARTE 1 Opción A** (name servers). Solo **Opción B** si no pueden cambiar NS. | WhatsApp |
| 6 | Cuando propague DNS: `https://classviptransfers.com` con candado HTTPS. | Navegador |

**Si Netlify muestra otra versión que tu local:** casi siempre falta **push** o **deploy manual**. Menos frecuente: Netlify apuntando a otra rama o repo.

---

## PARTE 1 — MENSAJE PARA EL ADMINISTRADOR DEL DOMINIO

**Quién hace qué:** el administrador solo entra al **panel del dominio** (Namecheap, GoDaddy, etc.). **No** usa Netlify ni Render. Tú configuras Netlify y Render.

### Opción A — RECOMENDADA (Netlify DNS): cambiar name servers

Valores actuales de tu zona en Netlify (si Netlify te muestra otros `p05`/`p07`, usa los de la pantalla):

| # | Name server |
|---|-------------|
| 1 | `dns1.p06.nsone.net` |
| 2 | `dns2.p06.nsone.net` |
| 3 | `dns3.p06.nsone.net` |
| 4 | `dns4.p06.nsone.net` |

**Copiar y pegar (WhatsApp):**

---

Hola,

Para que **classviptransfers.com** apunte al sitio web, en el panel del dominio cambia los **name servers** a estos 4:

1. dns1.p06.nsone.net  
2. dns2.p06.nsone.net  
3. dns3.p06.nsone.net  
4. dns4.p06.nsone.net  

Quita los name servers actuales, deja solo estos cuatro y guarda. Puede tardar hasta 24 horas.

Gracias.

---

### Opción B — Solo si NO pueden cambiar name servers (DNS en el registrador)

Mismo formato que muchos paneles: **Tipo / Nombre (Host) / Valor (Points to)**.

| Tipo | Nombre (Host) | Valor (Points to) | TTL |
|------|----------------|-------------------|-----|
| A | @ | 75.2.60.5 | Automático o 3600 |
| CNAME | www | classvip.netlify.app | Automático o 3600 |

**Copiar y pegar (WhatsApp) — opción B:**

---

Hola,

Agrega estos 2 registros DNS en **classviptransfers.com**:

**Registro 1**  
- Tipo: **A**  
- Nombre (Host): **@**  
- Valor (Points to): **75.2.60.5**  
- TTL: automático o 3600  

**Registro 2**  
- Tipo: **CNAME**  
- Nombre (Host): **www**  
- Valor (Points to): **classvip.netlify.app**  
- TTL: automático o 3600  

Guarda los cambios. Puede tardar hasta 24 h.

Gracias.

---

> Si ya usan la **Opción A**, no hace falta la B. Son alternativas.

### Verificación

- Abre `https://classviptransfers.com` con candado.
- [dnschecker.org](https://dnschecker.org): tipo **NS** (opción A) o **A** en el apex (opción B).

---

## PARTE 2 — COSTOS REALES EN PESOS MEXICANOS

> Tipo de cambio usado: **$18.50 MXN por USD** (promedio 2026)

---

### LO QUE SÍ TIENES QUE PAGAR SÍ O SÍ (obligatorio)

| Servicio | Costo real | Frecuencia | En pesos |
|---|---|---|---|
| **Dominio** (Namecheap) | $499 MXN | 1 vez al año | **$499 MXN/año** |
| **Premium DNS** (Namecheap) | $280 MXN | 1 vez al año | **$280 MXN/año** |
| **Render** (servidor backend) | $7 USD/mes | Mensual | **$130 MXN/mes** |

> **Por qué Premium DNS es necesario:** Sin él, el dominio responde más lento y puedes tener caídas. Para un negocio que depende de reservas online, vale la pena.

---

### LO QUE ES GRATIS (no pagas nada)

| Servicio | Por qué es gratis |
|---|---|
| **Netlify** (frontend / página web) | Free tier: 100 GB bandwidth/mes. Este sitio usa ~2-3 GB. Sobra. |
| **Supabase** (base de datos) | Free tier: 500 MB. Este proyecto usa menos de 50 MB. |
| **Resend** (emails de confirmación) | Free tier: 3,000 emails/mes. Usas máximo 50. |

---

### OPENAI — CUÁNTO REALMENTE CUESTA CON 100 CONSULTAS AL MES

Aquí está el cálculo real:

| Concepto | Detalle |
|---|---|
| Modelo usado | GPT-4o mini (el más barato del bueno) |
| Tokens por consulta | ~1,500 entrada + ~500 salida = ~2,000 tokens |
| 100 consultas al mes | 200,000 tokens/mes |
| Costo input | $0.15 USD por millón = **$0.03 USD** |
| Costo output | $0.60 USD por millón = **$0.06 USD** |
| **Total al mes** | **~$0.09 USD = ~$1.70 MXN** |
| **Total al año** | **~$1 USD = ~$18.50 MXN** |

> **Conclusión:** Con $15 USD de crédito en OpenAI tienes para **más de 10 años** al ritmo de 100 consultas al mes.
> No necesitas recargar OpenAI en mucho tiempo. Solo monitorea que el saldo no llegue a $0.

---

### RESUMEN TOTAL — LO QUE PAGAS REALMENTE

#### Por mes:
| Concepto | Costo |
|---|---|
| Render (backend) | $130 MXN |
| OpenAI (prorrateado) | ~$2 MXN |
| Dominio + DNS (prorrateado) | ~$65 MXN |
| **Total mensual real** | **~$197 MXN/mes** |

#### Por año:
| Concepto | Costo |
|---|---|
| Dominio | $499 MXN |
| Premium DNS | $280 MXN |
| Render × 12 meses | $1,560 MXN |
| OpenAI (casi nada) | ~$18 MXN |
| **Total anual real** | **~$2,357 MXN/año** |

> **Antes de este proyecto, el cliente probablemente pagaba más de $10,000 MXN/año** por una agencia o sistema de reservas externo.
> Este setup cuesta **$2,357 MXN/año** y es tuyo, controlado por ti.

---

## PARTE 3 — CHECKLIST: Netlify + Render (variables y deploy)

### A) Actualizar el sitio en Netlify (misma versión que local)

1. En tu PC, en la carpeta del proyecto: `git status` → confirma que tus cambios están commiteados.
2. `git push origin main` (o la rama que use Netlify).
3. Netlify → **Deploys** → espera a que el deploy termine en verde.
4. Si la versión sigue vieja: **Trigger deploy** → **Clear cache and deploy site**.
5. Compara `https://classvip.netlify.app` con tu `localhost` (misma pantalla / mismos textos).

### B) Variables en Netlify (frontend)

Ruta: **Site configuration → Environment variables** (o *Site settings → Environment variables*).

| Variable | Valor esperado | Notas |
|----------|----------------|-------|
| **`VITE_API_BASE_URL`** | `https://TU-SERVICIO.onrender.com` | **Sin** `/` al final. El código usa este nombre (`src/lib/api.ts`). |
| `NODE_VERSION` | `18` | Opcional si ya está en `netlify.toml`. |

Después de cambiar variables: **Trigger deploy** (Vite “hornea” las variables en el build).

### C) Variables en Render (backend)

Ruta: **Dashboard → tu Web Service → Environment**.

| Variable | Obligatorio | Notas |
|----------|-------------|-------|
| `NODE_ENV` | Sí | `production` |
| `DATABASE_URL` | Sí | Cadena de Supabase (Postgres) |
| **`CORS_ORIGIN`** | Sí en prod | **`https://classviptransfers.com`** — si falta o está mal, el navegador bloquea llamadas al API desde el dominio propio. |
| `FRONTEND_URL` | Sí | `https://classviptransfers.com` (emails y enlaces) |
| `ADMIN_JWT_SECRET` | Sí | Secreto largo para cookies de admin |
| `JWT_SECRET` | Recomendado | Usado en tokens de booking / PDF si aplica |
| `BOOKING_LOOKUP_SECRET` | Recomendado | Distinto del JWT; lookup seguro de reservas |
| `BOOKING_PDF_SECRET` | Recomendado | PDFs firmados |
| `ADMIN_EMAIL` | Sí | Email del admin |
| `ADMIN_PASSWORD_HASH` | Sí | Hash bcrypt del password |
| `OPENAI_API_KEY` | Si usas chat IA | |
| `RESEND_API_KEY` | Si usas Resend | |
| `EMAIL_FROM` | Si usas Resend | Remitente verificado en Resend |
| `COMPANY_BOOKINGS_EMAIL` | Recomendado | A dónde llegan reservas |
| `PAYPAL_CLIENT_ID` | Si hay pagos | |
| `PAYPAL_CLIENT_SECRET` | Si hay pagos | |

Guardar → **Manual Deploy** si hace falta.

### D) Pruebas rápidas

- [ ] `https://TU-BACKEND.onrender.com/health` responde `ok`
- [ ] En el dominio o `.netlify.app`: `/book` hasta review (sin pagar si no quieres)
- [ ] Contacto abre WhatsApp
- [ ] Chat responde (si IA activa)
- [ ] Login admin funciona
- [ ] `https://classviptransfers.com` con HTTPS cuando DNS esté listo

---

## PARTE 4 — DESPUÉS DE ENTREGAR (cómo actualizar la página)

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

Netlify suele desplegar en ~1–2 minutos tras el push.

Para el backend: deploy manual en Render o auto-deploy desde el mismo repo.

---

*Documento actualizado: Marzo 2026*
