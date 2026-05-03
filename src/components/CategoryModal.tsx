import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Category } from '@/types';
import { PRESET_COLORS, PRESET_ICONS } from '@/store/seed';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  category?: Category | null;
  onClose: () => void;
}

export function CategoryModal({ open, category, onClose }: Props) {
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setIcon(category.icon);
    } else {
      setName('');
      setColor(PRESET_COLORS[0].value);
      setIcon(PRESET_ICONS[0]);
    }
  }, [category, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (category) {
      updateCategory(category.id, { name: name.trim(), color, icon });
    } else {
      addCategory({ name: name.trim(), color, icon });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!category) return;
    if (
      confirm(
        `Delete "${category.name}" and all its metrics & entries? This cannot be undone.`,
      )
    ) {
      deleteCategory(category.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-surface-2 border border-border-strong rounded-2xl shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">
                  {category ? 'Edit category' : 'New category'}
                </div>
                <div className="font-serif text-xl">
                  {category ? category.name : 'Create category'}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-text-3 hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Reading"
                  autoFocus
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={cn(
                        'w-7 h-7 rounded-full border-2 transition-transform',
                        color === c.value
                          ? 'border-text scale-110'
                          : 'border-transparent hover:scale-105',
                      )}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_ICONS.map((iconName) => {
                    const Icon = (Icons as any)[iconName] as React.ComponentType<{
                      className?: string;
                      strokeWidth?: number;
                    }>;
                    if (!Icon) return null;
                    return (
                      <button
                        key={iconName}
                        onClick={() => setIcon(iconName)}
                        className={cn(
                          'h-9 rounded-md border flex items-center justify-center transition-colors',
                          icon === iconName
                            ? 'border-text-2 bg-surface-3 text-text'
                            : 'border-border text-text-2 hover:border-border-strong',
                        )}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-between bg-surface/40">
              {category ? (
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 text-xs text-rose-400/80 hover:text-rose-400 transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-text-2 hover:text-text rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: color, color: '#0f0e0d' }}
                >
                  {category ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
