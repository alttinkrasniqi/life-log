import type { Category, Metric } from '@/types';

// Low-saturation, calm accent colors per category
export const PRESET_COLORS = [
  { name: 'Sage', value: '#8aaf9d' },
  { name: 'Amber', value: '#d4a574' },
  { name: 'Slate', value: '#8593a8' },
  { name: 'Plum', value: '#a587a0' },
  { name: 'Terracotta', value: '#c08866' },
  { name: 'Moss', value: '#9a9b6b' },
  { name: 'Dusk', value: '#7a8aa6' },
  { name: 'Rose', value: '#b88991' },
  { name: 'Stone', value: '#a39d94' },
  { name: 'Teal', value: '#7ca8a6' },
];

export const PRESET_ICONS = [
  'Activity',
  'Dumbbell',
  'Heart',
  'Brain',
  'BookOpen',
  'Briefcase',
  'Code',
  'DollarSign',
  'Wallet',
  'TrendingUp',
  'Sparkles',
  'Smile',
  'Moon',
  'Sun',
  'Coffee',
  'Music',
  'Map',
  'Camera',
  'Pencil',
  'Target',
  'Flame',
  'Zap',
  'Globe',
  'Compass',
];

// =====================================================================
// Default seed
// =====================================================================

interface SeedCategory {
  category: Omit<Category, 'id' | 'createdAt'>;
  metrics: Array<Omit<Metric, 'id' | 'categoryId' | 'createdAt'>>;
}

export const DEFAULT_SEED: SeedCategory[] = [
  {
    category: { name: 'Health & Fitness', icon: 'Dumbbell', color: '#8aaf9d', order: 0 },
    metrics: [
      {
        name: 'Body weight',
        unit: 'kg',
        type: 'number',
        aggregation: 'last',
        direction: 'down',
        pinned: true,
        order: 0,
        defaultValue: 75,
      },
      {
        name: 'Calories eaten',
        unit: 'kcal',
        type: 'number',
        aggregation: 'sum',
        direction: 'down',
        pinned: true,
        order: 1,
        defaultValue: 2000,
        quickValues: [500, 800, 1500, 2000, 2500],
      },
      {
        name: 'Protein',
        unit: 'g',
        type: 'number',
        aggregation: 'sum',
        direction: 'up',
        pinned: false,
        order: 2,
        defaultValue: 30,
        quickValues: [20, 30, 40, 50],
      },
      {
        name: 'Cardio',
        unit: 'min',
        type: 'duration',
        aggregation: 'sum',
        direction: 'up',
        pinned: true,
        order: 3,
        defaultValue: 30,
        quickValues: [15, 30, 45, 60],
      },
      {
        name: 'Gym session',
        unit: 'session',
        type: 'count',
        aggregation: 'count',
        direction: 'up',
        pinned: true,
        order: 4,
        defaultValue: 1,
      },
      {
        name: 'Steps',
        unit: 'steps',
        type: 'number',
        aggregation: 'sum',
        direction: 'up',
        pinned: false,
        order: 5,
        defaultValue: 8000,
      },
      {
        name: 'Sleep',
        unit: 'hr',
        type: 'duration',
        aggregation: 'last',
        direction: 'up',
        pinned: false,
        order: 6,
        defaultValue: 480, // 8 hours in minutes
        quickValues: [360, 420, 480, 540],
      },
      {
        name: 'Water',
        unit: 'glasses',
        type: 'count',
        aggregation: 'sum',
        direction: 'up',
        pinned: false,
        order: 7,
        defaultValue: 1,
      },
    ],
  },
  {
    category: { name: 'Learning', icon: 'BookOpen', color: '#d4a574', order: 1 },
    metrics: [
      {
        name: 'Study session',
        unit: 'min',
        type: 'duration',
        aggregation: 'sum',
        direction: 'up',
        pinned: true,
        order: 0,
        defaultValue: 60,
        quickValues: [30, 45, 60, 90, 120],
      },
      {
        name: 'Lab completed',
        unit: 'lab',
        type: 'count',
        aggregation: 'count',
        direction: 'up',
        pinned: true,
        order: 1,
        defaultValue: 1,
      },
      {
        name: 'Notes created',
        unit: 'note',
        type: 'count',
        aggregation: 'count',
        direction: 'up',
        pinned: false,
        order: 2,
        defaultValue: 1,
      },
      {
        name: 'Focus rating',
        unit: '',
        type: 'scale',
        aggregation: 'avg',
        direction: 'up',
        scaleMin: 1,
        scaleMax: 5,
        pinned: true,
        order: 3,
        defaultValue: 3,
      },
    ],
  },
  {
    category: { name: 'Work', icon: 'Briefcase', color: '#8593a8', order: 2 },
    metrics: [
      {
        name: 'Deep work',
        unit: 'min',
        type: 'duration',
        aggregation: 'sum',
        direction: 'up',
        pinned: true,
        order: 0,
        defaultValue: 90,
        quickValues: [30, 60, 90, 120],
      },
      {
        name: 'Tasks completed',
        unit: 'task',
        type: 'count',
        aggregation: 'sum',
        direction: 'up',
        pinned: true,
        order: 1,
        defaultValue: 1,
      },
      {
        name: 'Meetings',
        unit: 'meeting',
        type: 'count',
        aggregation: 'count',
        direction: 'down',
        pinned: false,
        order: 2,
        defaultValue: 1,
      },
      {
        name: 'Applications sent',
        unit: 'app',
        type: 'count',
        aggregation: 'sum',
        direction: 'up',
        pinned: false,
        order: 3,
        defaultValue: 1,
      },
    ],
  },
  {
    category: { name: 'Wellbeing', icon: 'Heart', color: '#a587a0', order: 3 },
    metrics: [
      {
        name: 'Mood',
        unit: '',
        type: 'scale',
        aggregation: 'avg',
        direction: 'up',
        scaleMin: 1,
        scaleMax: 5,
        pinned: true,
        order: 0,
        defaultValue: 3,
      },
      {
        name: 'Meditated',
        unit: '',
        type: 'boolean',
        aggregation: 'last',
        direction: 'up',
        pinned: true,
        order: 1,
        defaultValue: 1,
      },
      {
        name: 'Journaling',
        unit: '',
        type: 'boolean',
        aggregation: 'last',
        direction: 'up',
        pinned: false,
        order: 2,
        defaultValue: 1,
      },
      {
        name: 'Outdoor time',
        unit: 'min',
        type: 'duration',
        aggregation: 'sum',
        direction: 'up',
        pinned: false,
        order: 3,
        defaultValue: 30,
        quickValues: [15, 30, 60, 90],
      },
      {
        name: 'Screen time',
        unit: 'hr',
        type: 'duration',
        aggregation: 'sum',
        direction: 'down',
        pinned: false,
        order: 4,
        defaultValue: 60,
        quickValues: [60, 120, 180, 240],
      },
    ],
  },
  {
    category: { name: 'Finance', icon: 'Wallet', color: '#c08866', order: 4 },
    metrics: [
      {
        name: 'Spent',
        unit: '$',
        type: 'number',
        aggregation: 'sum',
        direction: 'down',
        pinned: true,
        order: 0,
        defaultValue: 20,
      },
      {
        name: 'Saved',
        unit: '$',
        type: 'number',
        aggregation: 'sum',
        direction: 'up',
        pinned: false,
        order: 1,
        defaultValue: 100,
      },
      {
        name: 'Income',
        unit: '$',
        type: 'number',
        aggregation: 'sum',
        direction: 'up',
        pinned: false,
        order: 2,
        defaultValue: 500,
      },
    ],
  },
];

export function buildSeed(): { categories: Record<string, Category>; metrics: Record<string, Metric> } {
  const categories: Record<string, Category> = {};
  const metrics: Record<string, Metric> = {};
  const now = Date.now();

  DEFAULT_SEED.forEach((seed, ci) => {
    const catId = `cat_${ci}_${seed.category.name.toLowerCase().replace(/\W+/g, '_')}`;
    categories[catId] = { ...seed.category, id: catId, createdAt: now };
    seed.metrics.forEach((m, mi) => {
      const metricId = `met_${ci}_${mi}_${m.name.toLowerCase().replace(/\W+/g, '_')}`;
      metrics[metricId] = { ...m, id: metricId, categoryId: catId, createdAt: now };
    });
  });

  return { categories, metrics };
}
