import React from 'react';
import { Network, AlertTriangle, CheckCircle2, Lightbulb, ExternalLink, FileCode2 } from 'lucide-react';

interface PatternsPanelProps {
    patterns: any[];
}

const DEMO_PATTERNS = [
    {
        pattern: 'nested_loops',
        complexity: 'O(n²)',
        severity: 'warning',
        description: 'Detected 2 nested loops in mergeCatalogs()',
        file: 'index.js',
        line: 27,
        suggestion: 'Use a HashMap/Set for O(n) instead of nested iteration.',
        leetcode_problems: [
            { title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
            { title: '3Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/' },
            { title: 'Container With Most Water', difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/' },
        ]
    },
    {
        pattern: 'nested_loops',
        complexity: 'O(n³)',
        severity: 'high',
        description: 'Detected 3 nested loops in buildRecommendationMatrix()',
        file: 'index.js',
        line: 79,
        suggestion: 'Pre-index orders by userId+productId to reduce to O(n).',
        leetcode_problems: [
            { title: 'Maximum Product Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-product-subarray/' },
            { title: 'Spiral Matrix', difficulty: 'Medium', url: 'https://leetcode.com/problems/spiral-matrix/' },
        ]
    },
    {
        pattern: 'sorting',
        complexity: 'O(n log n)',
        severity: 'info',
        description: 'Array.sort() detected in sortByPrice()',
        file: 'index.js',
        line: 43,
        suggestion: 'Good use of built-in sort. Ensure n is bounded.',
        leetcode_problems: [
            { title: 'Merge Intervals', difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/' },
            { title: 'Sort Colors', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-colors/' },
        ]
    },
    {
        pattern: 'binary_search',
        complexity: 'O(log n)',
        severity: 'positive',
        description: 'Binary search pattern in findProductByPrice() and searchProductIndex()',
        file: 'index.js',
        line: 47,
        suggestion: 'Efficient binary search. Keep input sorted with invariants.',
        leetcode_problems: [
            { title: 'Binary Search', difficulty: 'Easy', url: 'https://leetcode.com/problems/binary-search/' },
            { title: 'Search in Rotated Sorted Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
        ]
    },
    {
        pattern: 'recursion',
        complexity: 'Varies',
        severity: 'info',
        description: 'Recursive calls detected in calculateLoyaltyPoints() and findCategoryById()',
        file: 'index.js',
        line: 55,
        suggestion: 'Consider memoization or iterative DP to avoid stack overflow.',
        leetcode_problems: [
            { title: 'Fibonacci Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/fibonacci-number/' },
            { title: 'Climbing Stairs', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' },
            { title: 'House Robber', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber/' },
        ]
    },
];

export const PatternsPanel: React.FC<PatternsPanelProps> = ({ patterns }) => {
    const displayPatterns = patterns && patterns.length > 0 ? patterns.map((p, i) => ({
        ...p,
        file: p.file || 'index.js',
        line: p.line || null,
    })) : DEMO_PATTERNS;

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'warning': return <AlertTriangle size={13} className="text-amber-500" />;
            case 'high': return <AlertTriangle size={13} className="text-red-500" />;
            case 'positive': return <CheckCircle2 size={13} className="text-cyan-400" />;
            default: return <Lightbulb size={13} className="text-cyan-400" />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'warning': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'positive': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
            default: return 'bg-fg/5 text-fg/40 border-border';
        }
    };

    const getDiffColor = (diff: string) => {
        switch ((diff || '').toLowerCase()) {
            case 'easy': return 'text-green-400';
            case 'medium': return 'text-amber-400';
            case 'hard': return 'text-red-400';
            default: return 'text-fg/40';
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <header className="bg-header/10 border border-border p-4 flex items-center gap-3">
                <div className="p-2 bg-cyan-400/5 border border-cyan-400/20">
                    <Network size={14} className="text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-[9px] font-black uppercase text-fg/40 tracking-widest">Complexity Analyzer</h2>
                    <p className="text-[10px] font-bold text-fg/60">{displayPatterns.length} patterns detected in current file</p>
                </div>
            </header>

            <div className="space-y-3">
                {displayPatterns.map((p, idx) => (
                    <div key={`${p.pattern}-${idx}`} className="border border-border bg-header/5 overflow-hidden group hover:border-fg/20 transition-colors">

                        {/* Pattern Header */}
                        <div className="flex items-start gap-3 p-4 pb-3">
                            <div className="mt-0.5">{getSeverityIcon(p.severity)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h4 className="text-[11px] font-black tracking-wider uppercase text-white">
                                        {(p.pattern || '').replace(/_/g, ' ')}
                                    </h4>
                                    <span className={`text-[9px] font-black border px-2 py-0.5 uppercase shrink-0 ${getSeverityBadge(p.severity)}`}>
                                        {p.complexity}
                                    </span>
                                </div>
                                <p className="text-[10px] text-fg/60 font-bold leading-snug">{p.description}</p>

                                {/* File Location */}
                                <div className="flex items-center gap-1.5 mt-2 bg-bg border border-border px-2 py-1 w-fit">
                                    <FileCode2 size={9} className="text-fg/30" />
                                    <span className="text-[8px] font-mono text-fg/50 font-bold">
                                        {p.file || 'index.js'}
                                        {p.line ? `:${p.line}` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* LeetCode Problems */}
                        <div className="border-t border-border bg-bg/50 px-4 py-3">
                            <div className="text-[8px] font-black uppercase text-fg/30 tracking-widest mb-2 flex items-center gap-1.5">
                                <span className="w-3 h-px bg-fg/20 inline-block" />
                                Recommended LeetCode Practice
                                <span className="w-3 h-px bg-fg/20 inline-block" />
                            </div>
                            <ul className="space-y-1.5">
                                {(p.leetcode_problems || []).map((prob: any, j: number) => (
                                    <li key={j} className="flex items-center justify-between gap-2 group/prob">
                                        <a
                                            href={prob.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Use vscode postMessage to open URL in browser
                                                (window as any).vscode?.postMessage({ type: 'openUrl', url: prob.url });
                                                // Fallback
                                                window.open(prob.url, '_blank');
                                            }}
                                            className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                                        >
                                            <ExternalLink size={9} className="opacity-60" />
                                            {prob.title}
                                        </a>
                                        <span className={`text-[8px] font-black uppercase shrink-0 ${getDiffColor(prob.difficulty)}`}>
                                            {prob.difficulty}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Suggestion */}
                        <div className="flex items-start gap-2 text-[9px] text-fg/60 font-bold px-4 py-2.5 border-t border-border border-l-2 border-l-amber-500/60 bg-amber-500/5">
                            <Lightbulb size={9} className="text-amber-500 mt-0.5 shrink-0" />
                            <span>{p.suggestion}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
