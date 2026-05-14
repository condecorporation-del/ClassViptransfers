import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Car, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/shared/providers/LanguageContext';
import { usePricingTable, type PricingRulePublic } from '@/features/booking/hooks/usePricing';
import { Skeleton } from '@/shared/ui/skeleton';
import { LuxurySpinner } from '@/shared/ui/luxury-spinner';
import { cn } from '@/shared/lib/utils';

const priceCellVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.02, duration: 0.25, ease: 'easeOut' },
  }),
};

const VEHICLE_CLASSES = [
  { value: 'SUV', label: 'SUV', pax: '1-5' },
  { value: 'SPRINTER', label: 'Sprinter', pax: '6-14' },
] as const;

function buildPriceMap(rules: PricingRulePublic[], vehicleClass: string) {
  const map = new Map<string, number>();
  for (const r of rules) {
    if (r.tripType === 'ONE_WAY' && r.vehicleClass === vehicleClass) {
      map.set(`${r.zoneFrom}→${r.zoneTo}`, r.basePriceCents);
    }
  }
  return map;
}

export function PriceTable() {
  const { t } = useLanguage();
  const { rules, zones, loading, error } = usePricingTable();
  const [vehicleClass, setVehicleClass] = useState<string>('SUV');
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const priceMap = buildPriceMap(rules, vehicleClass);

  const zoneFromList = zones.filter((z) =>
    rules.some((r) => r.zoneFrom === z && r.tripType === 'ONE_WAY')
  );
  const zoneToList = zones.filter((z) =>
    rules.some((r) => r.zoneTo === z && r.tripType === 'ONE_WAY')
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="flex gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} shimmer className="h-11 w-28 rounded-xl" />
          ))}
        </div>
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="p-4 border-b border-border flex gap-4">
            <Skeleton shimmer className="h-5 w-24 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} shimmer className="h-5 flex-1 min-w-16 rounded" />
            ))}
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="p-4 flex gap-4">
                <Skeleton shimmer className="h-4 w-20 rounded" />
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} shimmer className="h-4 flex-1 min-w-14 rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center py-4">
          <LuxurySpinner size={20} />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6 flex items-center gap-3">
        <AlertCircle size={24} className="text-amber-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">{error}</p>
          <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
            No hay precios configurados. Contacta para cotizar.
          </p>
        </div>
        <Link
          to="/book"
          className="gold-gradient text-secondary-foreground px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all ml-auto"
        >
          Cotiza ahora <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (rules.length === 0 || zones.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground text-sm">No hay precios configurados para mostrar.</p>
        <Link
          to="/book"
          className="gold-gradient text-secondary-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all mt-4 mx-auto"
        >
          Cotiza ahora <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vehicle selector - premium hover */}
      <div className="flex flex-wrap gap-2">
        {VEHICLE_CLASSES.map((v) => (
          <motion.button
            key={v.value}
            onClick={() => setVehicleClass(v.value)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
              vehicleClass === v.value
                ? 'gold-gradient text-secondary-foreground shadow-md shadow-gold/20'
                : 'border border-border hover:border-gold/40 hover:bg-gold/5 hover:shadow-sm'
            )}
          >
            <Car size={16} />
            {v.label} <span className="text-xs opacity-80">({v.pax})</span>
          </motion.button>
        ))}
      </div>

      {/* Desktop table (hidden on mobile) - touch-friendly horizontal scroll */}
      <div className="hidden lg:block table-scroll-x rounded-2xl border border-border bg-card">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 font-semibold text-foreground">Desde / Hacia</th>
              {zoneToList.map((z) => (
                <th key={z} className="p-4 font-semibold text-foreground text-center whitespace-nowrap">
                  {z}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zoneFromList.map((from, fromIdx) => (
              <tr key={from} className="border-b border-border/50 last:border-0">
                <td className="p-4 font-medium text-foreground">{from}</td>
                {zoneToList.map((to, toIdx) => {
                  if (from === to) {
                    return (
                      <td key={to} className="p-4 text-center text-muted-foreground">—</td>
                    );
                  }
                  const key = `${from}→${to}`;
                  const cents = priceMap.get(key);
                  const cellIndex = fromIdx * zoneToList.length + toIdx;
                  return (
                    <td key={to} className="p-4 text-center">
                      {cents != null ? (
                        <motion.span
                          custom={cellIndex}
                          variants={priceCellVariants}
                          initial="hidden"
                          animate="visible"
                          className="inline-block text-gold font-bold"
                        >
                          ${(cents / 100).toFixed(0)}
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs" title="No price configured for this route">
                          No disponible
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: collapsible price section */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileExpanded((e) => !e)}
          className="w-full flex items-center justify-between gap-3 py-4 px-4 rounded-xl border border-border bg-card touch-manipulation min-h-[48px] active:bg-muted/50 transition-colors"
        >
          <span className="font-semibold text-foreground">
            {mobileExpanded ? t('pricing.hidePrices', { en: 'Hide prices', es: 'Ocultar precios' }) : t('pricing.viewPrices', { en: 'View prices by route', es: 'Ver precios por ruta' })}
          </span>
          {mobileExpanded ? <ChevronUp size={20} className="text-gold" /> : <ChevronDown size={20} className="text-gold" />}
        </button>
        <AnimatePresence>
          {mobileExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3 max-h-[320px] overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pr-2 touch-scroll">
        {zoneFromList.flatMap((from, fromIdx) =>
          zoneToList
            .filter((to) => from !== to)
            .map((to, toIdx) => {
              const key = `${from}→${to}`;
              const cents = priceMap.get(key);
              if (cents == null) return null;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (fromIdx + toIdx) * 0.03 }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md hover:border-gold/30"
                >
                  <div>
                    <p className="font-semibold text-foreground">{from} → {to}</p>
                    <p className="text-xs text-muted-foreground">One-way · {VEHICLE_CLASSES.find(v => v.value === vehicleClass)?.label}</p>
                  </div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gold font-bold text-lg"
                  >
                    ${(cents / 100).toFixed(0)}
                  </motion.span>
                </motion.div>
              );
            })
        )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground">
        Precios en USD, trayecto sencillo (one-way). Round-trip = 2× precio base.
      </p>

      <motion.div className="w-full sm:w-auto">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            to="/book"
            className="gold-gradient text-secondary-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow w-full sm:w-auto justify-center block"
          >
            Cotiza ahora <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
