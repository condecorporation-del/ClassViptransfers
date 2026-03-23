# Prompt Fase A – Corrección del flujo de reserva (ChatBookingForm)

**Plan de referencia:** `PLAN_AGENTE_CIERRE_VENTAS.md`  
**Archivo a modificar:** `src/components/chat/ChatBookingForm.tsx`  
**Referencia de flujo:** `src/pages/Book.tsx`  

---

## Objetivo

Corregir el flujo del formulario de reserva en el chat para que siga el estándar de transporte turístico en Los Cabos:

1. **Zona → Hotel** — Tras elegir zona, el cliente debe seleccionar el hotel. Hotel obligatorio.
2. **Llegada** — Arrival flight (número) + Arrival time (hora de aterrizaje). No solo “arrival time” genérico.
3. **Salida (round trip)** — Departure flight + Departure time. Pickup automático 3 horas antes.
4. **Flight number** — Obligatorio, no opcional.

---

## Prompt (copiar y pegar)

```
Proyecto los-cabos-luxe-transfers. Plan: PLAN_AGENTE_CIERRE_VENTAS.md — Fase A (corrección flujo reserva en ChatBookingForm).

Implementa las siguientes correcciones en src/components/chat/ChatBookingForm.tsx, alineando el flujo con src/pages/Book.tsx:

1) ZONA → HOTEL (A1)
   - Añade estado para hoteles: fetch GET /api/pricing/hotels (usa getApiBaseUrl() + '/api/pricing/hotels').
   - Tras seleccionar zona, muestra selector/búsqueda de hoteles filtrados por esa zona (hotels.filter(h => h.zone === data.zone)).
   - Añade selectedHotel: { id, name, zone } | null al estado. Hotel obligatorio para pasar al siguiente paso.
   - isStep1Valid debe requerir: zona + areaId + selectedHotel.
   - pickup/dropoff deben usar selectedHotel.name (ej. "Grand Velas Los Cabos") en vez de genérico "zone Hotel".

2) ARRIVAL FLIGHT + ARRIVAL TIME (A2)
   - Reemplaza el campo "arrival time" genérico por dos campos:
     - Arrival flight: input texto, placeholder "AA 1234", formato validado (ej. /^[A-Za-z]{2,3}\s?\d{1,4}$/).
     - Arrival time: input time o select con horas (hora de aterrizaje del vuelo).
   - Añade arrivalFlight y arrivalTime al interface ChatBookingFormData.
   - Muestra estos campos en el Paso 1 (junto a fecha) o en un paso intermedio antes de extras. Ajusta totalSteps si añades pasos.

3) DEPARTURE FLIGHT + PICKUP 3h ANTES (A3)
   - Solo si tripType === 'roundtrip': añade departureFlight, departureTime y pickupTime.
   - Al cambiar departureTime, calcula pickupTime = departureTime - 3 horas (como en Book.tsx: minutesToTime(timeToMinutes(departureTime) - 180)).
   - Muestra departure flight, departure time y pickup time (sugerido automático) al usuario.
   - El usuario puede editar pickupTime si lo desea, pero por defecto debe ser 3h antes.

4) FLIGHT NUMBER OBLIGATORIO (A4)
   - Quita "(opcional)" / "(optional)" del placeholder del número de vuelo.
   - Cambia a "Número de vuelo" / "Flight number" (obligatorio).
   - isStep4Valid debe incluir: flightNumber.trim() válido (formato AA 1234) además de name, email, phone.
   - En round trip, departure flight también obligatorio para submit.

5) PAYLOAD
   - Incluye en el payload: pickupLocation (SJD Airport o hotel.name según ruta), dropoffLocation, flightNumber (arrival), arrivalTime, y si round trip: departureFlightNumber, departureTime, pickupTime.
   - Usa selectedHotel.name para pickup/dropoff en vez de "zone Hotel".

Verifica que el build pase (npm run build) y que el flujo sea coherente con Book.tsx.
```

---

## Verificación

- [ ] Al elegir zona, aparece selector/búsqueda de hoteles. Hotel obligatorio.
- [ ] Campos: Arrival flight + Arrival time (hora aterrizaje). Formato vuelo validado.
- [ ] Round trip: Departure flight + Departure time. Pickup automático 3h antes.
- [ ] Flight number sin "optional"; obligatorio en validación.
- [ ] `npm run build` pasa.
