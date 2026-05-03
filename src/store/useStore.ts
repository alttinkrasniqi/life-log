import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Category, Entry, Metric, Target } from '@/types';
import { buildSeed } from './seed';

const SCHEMA_VERSION = 1;

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// =====================================================================
// Actions interface
// =====================================================================

interface Actions {
  // Categories
  addCategory: (data: Omit<Category, 'id' | 'createdAt' | 'order'>) => string;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id' | 'createdAt'>>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedIds: string[]) => void;

  // Metrics
  addMetric: (
    data: Omit<Metric, 'id' | 'createdAt' | 'order'> & { order?: number },
  ) => string;
  updateMetric: (id: string, patch: Partial<Omit<Metric, 'id' | 'createdAt'>>) => void;
  deleteMetric: (id: string) => void;
  togglePinMetric: (id: string) => void;

  // Entries
  addEntry: (
    data: Omit<Entry, 'id' | 'createdAt'> & { timestamp?: number },
  ) => string;
  updateEntry: (id: string, patch: Partial<Omit<Entry, 'id' | 'createdAt'>>) => void;
  deleteEntry: (id: string) => void;

  // Targets
  setTarget: (data: Omit<Target, 'id'>) => string;
  deleteTarget: (id: string) => void;

  // Bulk
  resetToSeed: () => void;
  clearAll: () => void;

  // Selectors (computed)
  getMetricsByCategory: (categoryId: string) => Metric[];
  getEntriesByMetric: (metricId: string) => Entry[];
  getPinnedMetrics: () => Metric[];
  getCategoriesOrdered: () => Category[];
}

type Store = AppState & Actions;

// =====================================================================
// Initial state — seeded on first launch
// =====================================================================

function initialState(): AppState {
  const seed = buildSeed();
  return {
    categories: seed.categories,
    metrics: seed.metrics,
    entries: {},
    targets: {},
    schemaVersion: SCHEMA_VERSION,
  };
}

// =====================================================================
// Store
// =====================================================================

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState(),

      // -----------------------------------------------------------------
      // Categories
      // -----------------------------------------------------------------
      addCategory: (data) => {
        const id = uid('cat');
        const order = Object.values(get().categories).length;
        const cat: Category = { ...data, id, order, createdAt: Date.now() };
        set((s) => ({ categories: { ...s.categories, [id]: cat } }));
        return id;
      },
      updateCategory: (id, patch) =>
        set((s) =>
          s.categories[id]
            ? { categories: { ...s.categories, [id]: { ...s.categories[id], ...patch } } }
            : s,
        ),
      deleteCategory: (id) =>
        set((s) => {
          // Cascade: remove all metrics in this category, and entries under those metrics
          const metricsToDelete = Object.values(s.metrics)
            .filter((m) => m.categoryId === id)
            .map((m) => m.id);
          const metricSet = new Set(metricsToDelete);

          const categories = { ...s.categories };
          delete categories[id];

          const metrics: Record<string, Metric> = {};
          Object.values(s.metrics).forEach((m) => {
            if (!metricSet.has(m.id)) metrics[m.id] = m;
          });

          const entries: Record<string, Entry> = {};
          Object.values(s.entries).forEach((e) => {
            if (!metricSet.has(e.metricId)) entries[e.id] = e;
          });

          const targets: Record<string, Target> = {};
          Object.values(s.targets).forEach((t) => {
            if (!metricSet.has(t.metricId)) targets[t.id] = t;
          });

          return { categories, metrics, entries, targets };
        }),
      reorderCategories: (orderedIds) =>
        set((s) => {
          const cats = { ...s.categories };
          orderedIds.forEach((id, i) => {
            if (cats[id]) cats[id] = { ...cats[id], order: i };
          });
          return { categories: cats };
        }),

      // -----------------------------------------------------------------
      // Metrics
      // -----------------------------------------------------------------
      addMetric: (data) => {
        const id = uid('met');
        const existingOrder = Object.values(get().metrics).filter(
          (m) => m.categoryId === data.categoryId,
        ).length;
        const metric: Metric = {
          ...data,
          id,
          order: data.order ?? existingOrder,
          createdAt: Date.now(),
        };
        set((s) => ({ metrics: { ...s.metrics, [id]: metric } }));
        return id;
      },
      updateMetric: (id, patch) =>
        set((s) =>
          s.metrics[id]
            ? { metrics: { ...s.metrics, [id]: { ...s.metrics[id], ...patch } } }
            : s,
        ),
      deleteMetric: (id) =>
        set((s) => {
          const metrics = { ...s.metrics };
          delete metrics[id];
          const entries: Record<string, Entry> = {};
          Object.values(s.entries).forEach((e) => {
            if (e.metricId !== id) entries[e.id] = e;
          });
          const targets: Record<string, Target> = {};
          Object.values(s.targets).forEach((t) => {
            if (t.metricId !== id) targets[t.id] = t;
          });
          return { metrics, entries, targets };
        }),
      togglePinMetric: (id) =>
        set((s) =>
          s.metrics[id]
            ? {
                metrics: {
                  ...s.metrics,
                  [id]: { ...s.metrics[id], pinned: !s.metrics[id].pinned },
                },
              }
            : s,
        ),

      // -----------------------------------------------------------------
      // Entries
      // -----------------------------------------------------------------
      addEntry: (data) => {
        const id = uid('ent');
        const entry: Entry = {
          ...data,
          id,
          timestamp: data.timestamp ?? Date.now(),
          createdAt: Date.now(),
        };
        set((s) => ({ entries: { ...s.entries, [id]: entry } }));
        return id;
      },
      updateEntry: (id, patch) =>
        set((s) =>
          s.entries[id]
            ? { entries: { ...s.entries, [id]: { ...s.entries[id], ...patch } } }
            : s,
        ),
      deleteEntry: (id) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[id];
          return { entries };
        }),

      // -----------------------------------------------------------------
      // Targets
      // -----------------------------------------------------------------
      setTarget: (data) => {
        // One target per metric+period — replace if exists
        const existing = Object.values(get().targets).find(
          (t) => t.metricId === data.metricId && t.period === data.period,
        );
        if (existing) {
          set((s) => ({
            targets: { ...s.targets, [existing.id]: { ...existing, ...data } },
          }));
          return existing.id;
        }
        const id = uid('tgt');
        const target: Target = { ...data, id };
        set((s) => ({ targets: { ...s.targets, [id]: target } }));
        return id;
      },
      deleteTarget: (id) =>
        set((s) => {
          const targets = { ...s.targets };
          delete targets[id];
          return { targets };
        }),

      // -----------------------------------------------------------------
      // Bulk
      // -----------------------------------------------------------------
      resetToSeed: () => set(() => initialState()),
      clearAll: () =>
        set(() => ({
          categories: {},
          metrics: {},
          entries: {},
          targets: {},
          schemaVersion: SCHEMA_VERSION,
        })),

      // -----------------------------------------------------------------
      // Selectors
      // -----------------------------------------------------------------
      getMetricsByCategory: (categoryId) =>
        Object.values(get().metrics)
          .filter((m) => m.categoryId === categoryId)
          .sort((a, b) => a.order - b.order),
      getEntriesByMetric: (metricId) =>
        Object.values(get().entries)
          .filter((e) => e.metricId === metricId)
          .sort((a, b) => a.timestamp - b.timestamp),
      getPinnedMetrics: () =>
        Object.values(get().metrics)
          .filter((m) => m.pinned)
          .sort((a, b) => {
            const ca = get().categories[a.categoryId]?.order ?? 0;
            const cb = get().categories[b.categoryId]?.order ?? 0;
            if (ca !== cb) return ca - cb;
            return a.order - b.order;
          }),
      getCategoriesOrdered: () =>
        Object.values(get().categories).sort((a, b) => a.order - b.order),
    }),
    {
      name: 'life-log-store',
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        categories: state.categories,
        metrics: state.metrics,
        entries: state.entries,
        targets: state.targets,
        schemaVersion: state.schemaVersion,
      }),
    },
  ),
);
