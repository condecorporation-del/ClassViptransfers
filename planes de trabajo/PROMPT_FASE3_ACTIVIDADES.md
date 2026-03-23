# Prompt – Fase 3: Actividades

**Proyecto:** los-cabos-luxe-transfers  
**Contexto:** Plan en `PLAN_CAMBIOS_RESERVA_Y_PRECIOS.md`. Fases 1 y 2 ya implementadas. Implementar **Fase 3**.

---

## Objetivo

1. **Solo combos** – Eliminar venta individual de actividades; ofrecer únicamente **Combo** (2 actividades) y **Crazy Combo** (3 actividades), con duración 1h por actividad.
2. **Nota yates/masajes** – Añadir texto y enlace/botón de WhatsApp para “Yates privados y masajes a domicilio en villas”.

---

## 3.1 Solo combos – sin venta individual

| Producto       | Precio        | Incluye                          |
|----------------|---------------|-----------------------------------|
| **Combo**      | $100 USD/pax  | 2 actividades, 1h cada una       |
| **Crazy Combo**| $125 USD/pax  | 3 actividades, 1h cada una      |

**Tareas:**

| #   | Archivo / Área        | Descripción |
|-----|------------------------|-------------|
| 3.1.1 | `BookActivities.tsx` (o equivalente) | Quitar venta individual; solo mostrar/permitir Combo ($100) y Crazy Combo ($125). |
| 3.1.2 | Flujo de reserva (Book / upsell)     | Si las actividades se ofrecen desde el wizard de reserva, mostrar solo los dos combos (100 y 125); quitar modo “actividad individual”. |
| 3.1.3 | Duración                             | Todas las actividades dentro de combo = **1 hora** cada una (ajustar textos, validaciones y backend si aplica). |
| 3.1.4 | Restricciones                        | Mantener reglas actuales (p. ej. park entrance $25, etc.) sin cambiar lógica de negocio salvo lo de “solo combos” y duración. |

**Entregables:**  
- UI de actividades solo con opciones “Combo” y “Crazy Combo” y sus precios.  
- Duración fija 1h por actividad en combos.  
- Build frontend (y backend si se toca) en verde.

---

## 3.2 Nota: Yates y masajes por WhatsApp

| #   | Descripción |
|-----|-------------|
| 3.2.1 | Añadir el texto: *"Yates privados y masajes a domicilio en villas – reserva directa por WhatsApp"* en el lugar adecuado (p. ej. página de actividades o sección de servicios). |
| 3.2.2 | Incluir **enlace o botón** que abra WhatsApp (número a definir o usar el que ya tenga el proyecto). |

**Entregables:**  
- Texto visible en la sección acordada.  
- Un clic lleva al usuario a WhatsApp.

---

## Criterios de aceptación

- [ ] En la reserva/actividades solo se pueden elegir **Combo $100** (2 actividades) y **Crazy Combo $125** (3 actividades).
- [ ] No hay opción de comprar actividades sueltas/individuales.
- [ ] Cada actividad en combo se muestra o calcula como **1h**.
- [ ] Aparece la frase de yates y masajes y un enlace/botón a WhatsApp.
- [ ] Build correcto y sin errores de lint en los archivos modificados.

---

## Prompts para copiar y pegar

**Prompt 1 – Solo combos de actividades**

```
Proyecto los-cabos-luxe-transfers. Implementa Fase 3.1 del plan (PLAN_CAMBIOS_RESERVA_Y_PRECIOS.md).

Actividades: solo combos. Eliminar venta individual. Mostrar únicamente:
- Combo: $100 USD/persona (2 actividades, 1h cada una)
- Crazy Combo: $125 USD/persona (3 actividades, 1h cada una)

Ajustar BookActivities (o la página de actividades) y cualquier upsell en Book para que solo ofrezcan estos dos combos. Duración 1h por actividad. Mantener reglas actuales (park entrance, etc.). Build en verde.
```

---

**Prompt 2 – Nota yates y masajes por WhatsApp**

```
Proyecto los-cabos-luxe-transfers. Implementa Fase 3.2 del plan (PLAN_CAMBIOS_RESERVA_Y_PRECIOS.md).

Añadir el texto: "Yates privados y masajes a domicilio en villas – reserva directa por WhatsApp" en la página de actividades (o sección de servicios). Incluir enlace o botón que abra WhatsApp (usar el número que ya tenga el proyecto).
```

---

**Prompt único – Fase 3 completa**

```
Proyecto los-cabos-luxe-transfers. Implementa Fase 3 del plan (PLAN_CAMBIOS_RESERVA_Y_PRECIOS.md).

1) Actividades: solo combos. Eliminar venta individual. Mostrar únicamente Combo $100/pax (2 actividades, 1h cada una) y Crazy Combo $125/pax (3 actividades, 1h cada una). Ajustar BookActivities y upsell en Book. Duración 1h por actividad. Mantener reglas actuales (park entrance, etc.).

2) Añadir texto "Yates privados y masajes a domicilio en villas – reserva directa por WhatsApp" con enlace o botón a WhatsApp.
```
