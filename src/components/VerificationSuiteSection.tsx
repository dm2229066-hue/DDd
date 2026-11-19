import React, { useMemo, useState } from 'react';
import { CheckCircle2, Play, XCircle } from 'lucide-react';
import { runCalculatorTestSuite, TestExecutionResult } from '../engine/calculatorTests';

const CATEGORIES = [
  'All',
  'Basic & BODMAS',
  'Decimals & Formatting',
  'Scientific',
  'Edge Cases & Errors',
] as const;

export const VerificationSuiteSection: React.FC = () => {
  const [results, setResults] = useState<TestExecutionResult[]>(() => runCalculatorTestSuite());
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>('All');
  const [lastRunAt, setLastRunAt] = useState<string>(() => new Date().toLocaleTimeString());

  const handleRunTests = () => {
    setResults(runCalculatorTestSuite());
    setLastRunAt(new Date().toLocaleTimeString());
  };

  const filtered = useMemo(() => {
    if (filter === 'All') return results;
    return results.filter((r) => r.category === filter);
  }, [filter, results]);

  const passedCount = results.filter((r) => r.passed).length;

  return (
    <section id="tests" className="py-12 border-t border-slate-200 dark:border-slate-800/80">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            02. Engine Verification
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Mathematical &amp; Edge-Case Test Suite
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            Live verification of BODMAS precedence, brackets, floating-point decimal precision,
            trigonometry in DEG/RAD, factorials, and division-by-zero protection.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
            {passedCount}/{results.length} passed · Ran at {lastRunAt}
          </div>
          <button
            type="button"
            onClick={handleRunTests}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            Re-run All Tests
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === cat
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40">
                <th className="py-3 px-4">Test Case</th>
                <th className="py-3 px-4">Expression</th>
                <th className="py-3 px-4">Expected</th>
                <th className="py-3 px-4">Actual</th>
                <th className="py-3 px-4 text-right">Time</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.category}
                      {item.angleUnit ? ` · ${item.angleUnit}` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {item.expression}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {item.expectedOutput}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                    {item.actualOutput}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {item.durationMs.toFixed(2)} ms
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {item.passed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
