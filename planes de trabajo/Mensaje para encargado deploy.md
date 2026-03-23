# Mensaje para encargado — deploy

> **Quién hace qué**
> - **Administrador del dominio:** solo cambia DNS en el panel del registrador. No entra a Netlify ni Render.
> - **Tú:** Netlify, Render, variables (`VITE_API_BASE_URL`, etc.), código y `git push`.

---

## Opción A — Name servers (lo que estás usando con Netlify DNS)

**Tabla de referencia**

| # | Name server |
|---|-------------|
| 1 | dns1.p06.nsone.net |
| 2 | dns2.p06.nsone.net |
| 3 | dns3.p06.nsone.net |
| 4 | dns4.p06.nsone.net |

**WhatsApp (copiar y pegar):**

---

Hola,

Para que **classviptransfers.com** apunte al sitio web, en el panel del dominio cambia los **name servers** a estos 4:

1. dns1.p06.nsone.net  
2. dns2.p06.nsone.net  
3. dns3.p06.nsone.net  
4. dns4.p06.nsone.net  

Quita los que haya ahora, deja solo estos cuatro y guarda. Puede tardar hasta 24 h.

Gracias.

---

## Opción B — Si no pueden cambiar name servers (registros A + CNAME)

**Tabla Tipo / Host / Points to**

| Tipo | Nombre (Host) | Valor (Points to) | TTL |
|------|----------------|-------------------|-----|
| A | @ | 75.2.60.5 | Automático o 3600 |
| CNAME | www | classvip.netlify.app | Automático o 3600 |

**WhatsApp (copiar y pegar):**

---

Hola,

Agrega estos 2 registros DNS en **classviptransfers.com**:

**Registro 1** — Tipo: **A** — Host: **@** — Points to: **75.2.60.5** — TTL: automático o 3600  

**Registro 2** — Tipo: **CNAME** — Host: **www** — Points to: **classvip.netlify.app** — TTL: automático o 3600  

Guarda. Puede tardar hasta 24 h.

Gracias.

---

## Render / Netlify — no se mandan al administrador

| Servicio | Lo configura |
|----------|----------------|
| Render | Tú (`CORS_ORIGIN`, `FRONTEND_URL`, BD, PayPal, etc.) |
| Netlify | Tú (`VITE_API_BASE_URL` = URL de Render, **sin** barra final) |

---

## Si Netlify cambia los name servers

En **Netlify → DNS → Name servers** copia los 4 que salgan y sustituye la tabla de la Opción A y el mensaje de WhatsApp.

---

*Marzo 2026 — NS p06 confirmados en Netlify.*
