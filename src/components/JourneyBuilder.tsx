import { Plus, Trash2, GripVertical, MousePointer, Scroll, Clock, Type, Hand, Camera } from 'lucide-react';
import type { Database } from '../lib/database.types';

type UserJourney = Database['public']['Tables']['user_journeys']['Row'];
type ActionType = 'navigate' | 'click' | 'scroll' | 'wait' | 'fill_form' | 'hover' | 'screenshot';

interface JourneyBuilderProps {
  journeys: Partial<UserJourney>[];
  onChange: (journeys: Partial<UserJourney>[]) => void;
}

const actionTypes: { value: ActionType; label: string; icon: any }[] = [
  { value: 'navigate', label: 'Navigate to URL', icon: MousePointer },
  { value: 'click', label: 'Click Element', icon: MousePointer },
  { value: 'fill_form', label: 'Fill Form Field', icon: Type },
  { value: 'scroll', label: 'Scroll', icon: Scroll },
  { value: 'hover', label: 'Hover Element', icon: Hand },
  { value: 'wait', label: 'Wait', icon: Clock },
  { value: 'screenshot', label: 'Take Screenshot', icon: Camera },
];

export default function JourneyBuilder({ journeys, onChange }: JourneyBuilderProps) {
  function addStep() {
    onChange([
      ...journeys,
      {
        action_type: 'navigate',
        selector: '',
        value: '',
        wait_before: 0,
        wait_after: 1000,
      },
    ]);
  }

  function removeStep(index: number) {
    onChange(journeys.filter((_, i) => i !== index));
  }

  function updateStep(index: number, updates: Partial<UserJourney>) {
    onChange(journeys.map((j, i) => (i === index ? { ...j, ...updates } : j)));
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    const newJourneys = [...journeys];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= journeys.length) return;
    [newJourneys[index], newJourneys[newIndex]] = [newJourneys[newIndex], newJourneys[index]];
    onChange(newJourneys);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">User Journey Steps</h3>
          <p className="text-slate-400 text-sm">Define the sequence of actions bots will perform</p>
        </div>
        <button
          type="button"
          onClick={addStep}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {journeys.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-700">
          <MousePointer className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No steps defined yet. Add your first step to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((journey, index) => {
            const ActionIcon = actionTypes.find((a) => a.value === journey.action_type)?.icon || MousePointer;

            return (
              <div
                key={index}
                className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2 pt-3">
                    <GripVertical className="w-5 h-5 text-slate-500 cursor-move" />
                    <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Action Type
                        </label>
                        <div className="relative">
                          <ActionIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <select
                            value={journey.action_type}
                            onChange={(e) =>
                              updateStep(index, {
                                action_type: e.target.value as ActionType,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                          >
                            {actionTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {journey.action_type === 'navigate' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            URL / Path
                          </label>
                          <input
                            type="text"
                            value={journey.value || ''}
                            onChange={(e) => updateStep(index, { value: e.target.value })}
                            placeholder="/about"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      )}

                      {(journey.action_type === 'click' ||
                        journey.action_type === 'hover' ||
                        journey.action_type === 'fill_form') && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            CSS Selector
                          </label>
                          <input
                            type="text"
                            value={journey.selector || ''}
                            onChange={(e) => updateStep(index, { selector: e.target.value })}
                            placeholder="#submit-btn, .nav-link"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      )}

                      {journey.action_type === 'scroll' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Scroll Amount (px)
                          </label>
                          <input
                            type="number"
                            value={journey.value || ''}
                            onChange={(e) => updateStep(index, { value: e.target.value })}
                            placeholder="500"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      )}

                      {journey.action_type === 'wait' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Duration (ms)
                          </label>
                          <input
                            type="number"
                            value={journey.value || ''}
                            onChange={(e) => updateStep(index, { value: e.target.value })}
                            placeholder="2000"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      )}
                    </div>

                    {journey.action_type === 'fill_form' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Value to Fill
                        </label>
                        <input
                          type="text"
                          value={journey.value || ''}
                          onChange={(e) => updateStep(index, { value: e.target.value })}
                          placeholder="Enter text value"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Wait Before (ms)
                        </label>
                        <input
                          type="number"
                          value={journey.wait_before || 0}
                          onChange={(e) =>
                            updateStep(index, { wait_before: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Wait After (ms)
                        </label>
                        <input
                          type="number"
                          value={journey.wait_after || 1000}
                          onChange={(e) =>
                            updateStep(index, { wait_after: parseInt(e.target.value) || 1000 })
                          }
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === journeys.length - 1}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
