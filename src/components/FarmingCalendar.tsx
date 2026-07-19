/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, Sprout, ShieldAlert, Sparkles, Plus, CheckCircle, 
  ChevronRight, RefreshCw, AlertCircle, Trash, Check, Info, Droplets, Leaf
} from 'lucide-react';
import { FarmingPlan, CalendarTask } from '../types';

const COMMON_CROP_PRESETS = [
  { crop: 'Tomato', variety: 'Roma (Determinate)', soil: 'Rich Organic Loam', climate: 'Temperate / Sunny', water: 'Drip Irrigation' },
  { crop: 'Maize (Corn)', variety: 'Sweet Corn F1', soil: 'Sandy Loam', climate: 'Warm Season / Wet', water: 'Regular Sprinklers' },
  { crop: 'Potatoes', variety: 'Russet Burbank', soil: 'Sandy / Loose', climate: 'Cool Season / Temperate', water: 'Moist Drip' },
  { crop: 'Spinach', variety: 'Bloomsdale Savoy', soil: 'Silt Loam', climate: 'Cool temperate / Semi-shade', water: 'Daily light misting' }
];

export default function FarmingCalendar() {
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [soilType, setSoilType] = useState('Loam');
  const [region, setRegion] = useState('');
  const [wateringAvailability, setWateringAvailability] = useState('Drip Irrigation');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<FarmingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Completed task tracker (persisted in session)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  // Active filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const handleApplyPreset = (preset: typeof COMMON_CROP_PRESETS[0]) => {
    setCropName(preset.crop);
    setVariety(preset.variety);
    setSoilType(preset.soil);
    setRegion(preset.climate);
    setWateringAvailability(preset.water);
    setError(null);
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName || !soilType || !region) {
      setError('Please provide at least Crop Name, Soil Type, and Region/Climate.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPlan(null);
    setCompletedTasks({});

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName,
          soilType,
          region,
          variety,
          wateringAvailability
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server returned an error generating schedule.');
      }

      const data: FarmingPlan = await response.json();
      setPlan(data);
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setError(err.message || 'Failed to generate plan. Please verify your Gemini API key in Secrets Settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskCompleted = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const filteredTasks = plan ? plan.calendar.filter((task) => {
    const isDone = !!completedTasks[task.id];
    if (activeFilter === 'completed') return isDone;
    if (activeFilter === 'pending') return !isDone;
    return true;
  }) : [];

  const completionPercentage = plan && plan.calendar.length > 0
    ? Math.round((Object.values(completedTasks).filter(Boolean).length / plan.calendar.length) * 100)
    : 0;

  return (
    <div id="calendar-module" className="space-y-8">
      {/* Intro section */}
      <div id="calendar-intro" className="bg-editorial-forest text-editorial-cream rounded-none p-8 md:p-10 flex flex-col md:flex-row gap-6 justify-between items-center border border-editorial-border">
        <div id="intro-text" className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-editorial-cream/70" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-editorial-cream/80 font-sans">Interactive Grow Engine</span>
          </div>
          <h2 id="intro-title" className="font-serif text-3xl md:text-4xl font-light text-white leading-tight">
            Custom Farming <em>Calendars</em> & Planting Plans
          </h2>
          <p id="intro-desc" className="text-editorial-cream/80 text-xs font-serif leading-relaxed">
            Specify your crop, soil texture, local climate zone, and irrigation parameters. 
            Gemini formulates a highly custom, day-by-day developmental calendar detailing essential fertilization timings, watering schedules, and preventive agricultural maintenance steps.
          </p>
        </div>
        <div id="intro-icon" className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0">
          <Sprout className="w-8 h-8 text-white/85" />
        </div>
      </div>

      <div id="calendar-main-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Controls */}
        <div id="calendar-controls-col" className="lg:col-span-5 space-y-6">
          <div id="plan-builder-card" className="bg-white border border-editorial-border rounded-none p-6 space-y-6">
            <h3 id="builder-title" className="font-serif font-bold text-editorial-dark text-base flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-editorial-sage" /> Grow Parameters
            </h3>

            {/* Quick Presets */}
            <div id="builder-presets" className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-editorial-sage tracking-wider font-sans">Quick Presets</span>
              <div id="presets-flex" className="flex flex-wrap gap-2">
                {COMMON_CROP_PRESETS.map((preset) => (
                  <button
                    key={preset.crop}
                    onClick={() => handleApplyPreset(preset)}
                    id={`crop-preset-btn-${preset.crop}`}
                    className="px-3 py-1.5 bg-editorial-sand/40 hover:bg-editorial-sand border border-editorial-border text-editorial-dark text-[10px] font-sans font-bold uppercase tracking-wider rounded-none transition-all"
                  >
                    {preset.crop}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleGeneratePlan} id="builder-form" className="space-y-4 pt-2">
              <div id="crop-input-group" className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage">Crop Name *</label>
                <input 
                  type="text" 
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="E.g. Tomato, Rice, Soybean, Carrot"
                  required
                  className="w-full text-xs p-3 border border-editorial-border rounded-none focus:outline-none focus:border-editorial-dark bg-editorial-cream/20 text-editorial-dark font-sans"
                />
              </div>

              <div id="variety-input-group" className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage">Variety (Optional)</label>
                <input 
                  type="text" 
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="E.g. heirloom, Determinate Roma, sweet hybrid"
                  className="w-full text-xs p-3 border border-editorial-border rounded-none focus:outline-none focus:border-editorial-dark bg-editorial-cream/20 text-editorial-dark font-sans"
                />
              </div>

              <div id="soil-input-group" className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage">Soil Composition / Texture *</label>
                <input 
                  type="text" 
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  placeholder="E.g. Loam, Clay, Sandy, Silt, Rich compost"
                  required
                  className="w-full text-xs p-3 border border-editorial-border rounded-none focus:outline-none focus:border-editorial-dark bg-editorial-cream/20 text-editorial-dark font-sans"
                />
              </div>

              <div id="region-input-group" className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage">Climate Region / Seasonal Conditions *</label>
                <input 
                  type="text" 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="E.g. Sunny dry summer, Arid, Wet monsoon, Temperate"
                  required
                  className="w-full text-xs p-3 border border-editorial-border rounded-none focus:outline-none focus:border-editorial-dark bg-editorial-cream/20 text-editorial-dark font-sans"
                />
              </div>

              <div id="water-input-group" className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage">Watering / Irrigation setup</label>
                <input 
                  type="text" 
                  value={wateringAvailability}
                  onChange={(e) => setWateringAvailability(e.target.value)}
                  placeholder="E.g. Drip Irrigation, Sprinklers, Manual rainfed"
                  className="w-full text-xs p-3 border border-editorial-border rounded-none focus:outline-none focus:border-editorial-dark bg-editorial-cream/20 text-editorial-dark font-sans"
                />
              </div>

              {error && (
                <div id="builder-error" className="p-3 bg-rose-50 border border-rose-100 rounded-none text-xs text-rose-800 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="font-serif">{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isGenerating}
                id="builder-submit-btn"
                className="w-full py-3.5 bg-editorial-dark hover:bg-editorial-forest text-white font-bold font-sans uppercase tracking-widest text-xs rounded-none shadow-xs transition-all flex items-center justify-center gap-2 disabled:bg-zinc-300 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Customizing Grow Schedule...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-editorial-cream" /> Generate Farming Calendar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Farming Schedule Timeline */}
        <div id="calendar-schedule-col" className="lg:col-span-7">
          {!plan && !isGenerating && (
            <div id="no-schedule-placeholder" className="bg-white border border-editorial-border rounded-none p-12 text-center flex flex-col items-center justify-center h-full min-h-96 space-y-4">
              <div id="sc-placeholder-icon" className="w-16 h-16 rounded-none bg-editorial-sand flex items-center justify-center text-editorial-dark border border-editorial-border">
                <Calendar className="w-8 h-8 text-editorial-sage" />
              </div>
              <h4 id="sc-placeholder-title" className="font-serif font-bold text-editorial-dark text-lg uppercase tracking-wide">
                Farming Schedule & Grow Timeline
              </h4>
              <p id="sc-placeholder-desc" className="text-xs text-editorial-sage font-serif leading-relaxed max-w-sm mx-auto">
                Generate a dynamic developmental plan based on your geographical and soil parameters. Your growth checklist and watering steps will appear here.
              </p>
            </div>
          )}

          {isGenerating && (
            <div id="schedule-loading" className="bg-white border border-editorial-border rounded-none p-12 text-center flex flex-col items-center justify-center h-full min-h-96 space-y-6">
              <div id="sc-loader-spinner" className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-none border border-editorial-border"></div>
                <div className="absolute inset-0 rounded-none border-t-2 border-editorial-dark animate-spin"></div>
                <Calendar className="w-5 h-5 text-editorial-sage absolute inset-0 m-auto animate-pulse" />
              </div>
              <div id="sc-loader-text-block" className="space-y-2">
                <h4 className="font-serif font-light text-editorial-dark text-xl">
                  Gemini Generating Farm Calendar
                </h4>
                <p className="text-xs text-editorial-sage max-w-sm mx-auto leading-relaxed font-serif italic">
                  Structuring sowing deadlines, scheduling fertilizer inputs, establishing irrigation intervals, and calculating harvest window days...
                </p>
              </div>
            </div>
          )}

          {plan && (
            <div id="schedule-timeline-report" className="space-y-6">
              {/* Summary Card with progress */}
              <div id="schedule-overview" className="bg-white border border-editorial-border rounded-none p-6 shadow-xs space-y-4">
                <div id="sc-summary-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-editorial-sage font-sans">Grow Timeline</span>
                    <h3 id="plan-title-heading" className="font-serif font-bold text-editorial-dark text-2xl flex items-center gap-2">
                      <Leaf className="w-5.5 h-5.5 text-editorial-forest" /> {plan.cropName} <span className="font-light italic text-editorial-sage">({plan.variety})</span>
                    </h3>
                  </div>

                  <div id="duration-badge" className="px-3.5 py-1.5 bg-editorial-sand/40 border border-editorial-border text-editorial-dark text-[10px] uppercase font-sans tracking-wider font-bold rounded-none flex items-center gap-1">
                    Duration: {plan.totalDurationDays} Days
                  </div>
                </div>

                <div id="soil-climate-specs" className="grid grid-cols-2 gap-4 text-xs text-editorial-dark border-t border-editorial-border/60 pt-4 font-serif">
                  <div>
                    <strong className="font-sans uppercase text-[9px] tracking-wider text-editorial-sage block mb-0.5">Soil Requirements</strong> {plan.soilRequirements}
                  </div>
                  <div>
                    <strong className="font-sans uppercase text-[9px] tracking-wider text-editorial-sage block mb-0.5">Climate Zone</strong> {plan.climateRequirements}
                  </div>
                </div>

                {/* Grow Progress Checklist Bar */}
                <div id="grow-progress-panel" className="border-t border-editorial-border/60 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-editorial-sage">Grow Progress Checklist</span>
                    <span className="font-mono font-bold text-editorial-dark">{completionPercentage}% Completed</span>
                  </div>
                  <div className="w-full bg-editorial-sand/40 rounded-none h-2 overflow-hidden border border-editorial-border">
                    <div 
                      className="bg-editorial-forest h-2 rounded-none transition-all duration-500" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Task filters */}
              <div id="timeline-filters-flex" className="flex justify-between items-center bg-white border border-editorial-border p-2 rounded-none">
                <div id="filters-group" className="flex gap-1">
                  {(['all', 'pending', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-none transition-all ${
                        activeFilter === filter 
                          ? 'bg-editorial-dark text-white shadow-xs' 
                          : 'text-editorial-sage hover:bg-editorial-sand/60'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <span className="text-[9px] text-editorial-sage pr-2 font-mono uppercase tracking-wider font-bold">
                  {filteredTasks.length} Stages
                </span>
              </div>

              {/* Day-by-Day Timeline */}
              <div id="timeline-stack" className="relative border-l border-editorial-border pl-6 ml-4 space-y-6">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const isDone = !!completedTasks[task.id];
                    return (
                      <div key={task.id} id={`timeline-step-${task.id}`} className="relative space-y-2 group">
                        
                        {/* Timeline node bullet (square checkout indicator) */}
                        <button
                          onClick={() => toggleTaskCompleted(task.id)}
                          className={`absolute -left-[32px] top-1.5 w-4 h-4 rounded-none border flex items-center justify-center transition-all ${
                            isDone 
                              ? 'bg-editorial-dark border-editorial-dark text-white' 
                              : 'bg-white border-editorial-border text-transparent hover:border-editorial-dark group-hover:scale-105'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>

                        <div className={`p-5 bg-white border rounded-none shadow-xs transition-all ${
                          isDone 
                            ? 'border-editorial-border/40 opacity-70 bg-editorial-cream/10' 
                            : 'border-editorial-border hover:border-editorial-dark'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-editorial-border/60 pb-3 mb-3">
                            <div>
                              <span className="text-[9px] text-editorial-sage font-bold font-sans uppercase tracking-widest block">
                                {task.stageName}
                              </span>
                              <h4 className={`font-serif font-bold text-sm text-editorial-dark mt-0.5 ${
                                isDone ? 'line-through text-editorial-sage/80' : ''
                              }`}>
                                {task.taskTitle}
                              </h4>
                            </div>

                            <span className="text-[10px] bg-editorial-sand/40 text-editorial-dark font-mono font-bold px-2.5 py-1 rounded-none border border-editorial-border flex-shrink-0 align-middle">
                              Days {task.startDay} - {task.endDay}
                            </span>
                          </div>

                          <p className="text-xs text-editorial-dark font-serif leading-relaxed">
                            {task.description}
                          </p>

                          {/* Water requirements */}
                          <div className="mt-3 flex items-center gap-2 text-xs text-editorial-dark bg-editorial-sand/30 p-2.5 rounded-none border border-editorial-border">
                            <Droplets className="w-4 h-4 text-editorial-sage flex-shrink-0" />
                            <span className="font-serif"><strong className="font-sans uppercase text-[8px] tracking-wider text-editorial-sage">Watering Guide:</strong> {task.wateringFrequency}</span>
                          </div>

                          {/* Fertilizer Requirements */}
                          {task.fertilizerInfo && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-editorial-dark bg-editorial-cream/50 p-2.5 rounded-none border border-editorial-border">
                              <Info className="w-4 h-4 text-editorial-sage flex-shrink-0" />
                              <span className="font-serif"><strong className="font-sans uppercase text-[8px] tracking-wider text-editorial-sage">Soil Nutrition:</strong> {task.fertilizerInfo}</span>
                            </div>
                          )}

                          {/* Quick tips list */}
                          <div className="mt-4 space-y-1.5 pt-1 border-t border-editorial-border/40">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-editorial-sage font-sans">Pathology & Maintenance Directives</span>
                            <ul className="space-y-1">
                              {task.tips.map((tip, tIdx) => (
                                <li key={tIdx} className="text-xs text-editorial-dark flex items-start gap-1.5 leading-relaxed font-serif">
                                  <ChevronRight className="w-3.5 h-3.5 text-editorial-sage mt-0.5 flex-shrink-0" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div id="no-filtered-tasks" className="p-8 border border-dashed border-editorial-border text-center rounded-none text-xs text-editorial-sage bg-editorial-cream/10 font-serif">
                    No stages found matching the current active checklist filter.
                  </div>
                )}
              </div>

              {/* General tips banner */}
              {plan.generalTips && plan.generalTips.length > 0 && (
                <div id="calendar-general-tips" className="bg-editorial-sand/40 border border-editorial-border rounded-none p-6 space-y-3">
                  <h4 className="font-serif font-bold text-editorial-dark text-sm flex items-center gap-1.5 uppercase tracking-wide border-b border-editorial-border pb-1.5">
                    <Info className="w-4 h-4 text-editorial-sage" /> General Regional Directives & Warnings
                  </h4>
                  <ul className="space-y-2">
                    {plan.generalTips.map((gTip, gIdx) => (
                      <li key={gIdx} className="text-xs text-editorial-dark flex items-start gap-2 leading-relaxed font-serif">
                        <span className="w-1.5 h-1.5 bg-editorial-forest mt-1.5 flex-shrink-0" />
                        {gTip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
