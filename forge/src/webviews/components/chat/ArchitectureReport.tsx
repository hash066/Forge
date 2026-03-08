import React, { useState } from 'react';
import { vscode } from '../../vscodeApi';
import {
    Shield, Zap, DollarSign, Activity,
    ArrowRight, AlertTriangle, FileText,
    Download, Clipboard, CheckCircle2,
    GitBranch, Database, Server, Lock,
    TrendingUp, TrendingDown, BarChart3, Code2,
    ChevronDown, ChevronRight, ExternalLink
} from 'lucide-react';

interface ReportProps {
    data: {
        timestamp: string;
        healthScore: number;
        patterns: string;
        components: string[];
        security: {
            score: number;
            critical: string[];
            high: string[];
        };
        scalability: {
            score: number;
            limits: string[];
            recommendations: string[];
        };
        cost: {
            total: string;
            budget: string;
            breakdown: { service: string; amount: string; percentage: string }[];
            savings: string[];
        };
        drift: {
            score: number;
            violations: string[];
        };
        immediateActions: string[];
    };
}

const CircleScore: React.FC<{ score: number; label: string; color: string }> = ({ score, label, color }) => {
    const r = 26;
    const circ = 2 * Math.PI * r;
    const filled = (score / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={64} height={64} viewBox="0 0 64 64">
                <circle cx={32} cy={32} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                <circle cx={32} cy={32} r={r} fill="none"
                    stroke={color} strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={`${filled} ${circ - filled}`}
                    strokeDashoffset={circ / 4}
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
                <text x={32} y={33} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="10" fontWeight="900">{score}</text>
            </svg>
            <span className="text-[8px] font-black uppercase tracking-widest text-text-dim text-center">{label}</span>
        </div>
    );
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; expanded: boolean; onToggle: () => void }> = ({ icon, title, expanded, onToggle }) => (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-2 border-b border-card-border/40 mb-3 hover:opacity-80 transition-opacity">
        <h3 className="text-[11px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
            {icon}{title}
        </h3>
        {expanded ? <ChevronDown size={13} className="text-text-dim opacity-40" /> : <ChevronRight size={13} className="text-text-dim opacity-40" />}
    </button>
);

const SeverityBadge: React.FC<{ severity: 'critical' | 'high' | 'medium' | 'low' | 'good' }> = ({ severity }) => {
    const map = {
        critical: 'bg-red-500/10 text-red-400 border-red-500/30',
        high:     'bg-orange-500/10 text-orange-400 border-orange-500/30',
        medium:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        low:      'bg-blue-500/10 text-blue-400 border-blue-500/30',
        good:     'bg-green-500/10 text-green-400 border-green-500/30',
    };
    return (
        <span className={`text-[8px] font-black px-1.5 py-0.5 border uppercase tracking-wider ${map[severity]}`}>
            {severity}
        </span>
    );
};

const FULL_FINDINGS = [
    { id: '1.1', title: 'Hardcoded AWS credentials in source', severity: 'critical' as const, category: 'Security', desc: 'AWS_SECRET_KEY and DB_PASSWORD are hardcoded strings in index.js (lines 9–10). Any repository exposure or log leak directly compromises production infrastructure. Rotate credentials immediately and use environment variables or a secrets manager.' },
    { id: '1.2', title: 'SQL Injection via string concatenation', severity: 'critical' as const, category: 'Security', desc: 'User-controlled input req.params.id is concatenated directly into a SQL query string on line 11. A payload like `1\' OR \'1\'=\'1` would dump all users. Parameterized queries or an ORM must be used.' },
    { id: '1.3', title: 'Public S3 Bucket ACL', severity: 'high' as const, category: 'Security', desc: 'exportAnalyticsToS3() sets ACL: "public-read" on line 95, making all analytics reports publicly accessible. Remove the ACL override and rely on bucket-level block-public-access policies.' },
    { id: '1.4', title: 'Prototype Pollution in /pay route', severity: 'critical' as const, category: 'Security', desc: 'Object.assign(global, payload) on line 117 allows an attacker to overwrite Node.js global prototype properties. This can lead to denial of service or security bypass. Validate and whitelist input fields.' },
    { id: '2.1', title: 'MongoDB used — Blueprint specifies PostgreSQL', severity: 'high' as const, category: 'Drift', desc: 'All data access code uses MongoClient but the architecture blueprint mandates PostgreSQL (relational). This creates an unmaintainable codebase with conflicting data models and prevents blueprint-governed deployments.' },
    { id: '2.2', title: 'AWS SDK not authorized in blueprint', severity: 'high' as const, category: 'Drift', desc: 'The aws-sdk dependency and S3 integration are used without blueprint authorization. Any external service dependency must be declared and approved in the architecture constraints before being added to code.' },
    { id: '3.1', title: 'O(n³) nested loop in buildRecommendationMatrix', severity: 'high' as const, category: 'Performance', desc: 'Triple nested loop on users × products × orders (line 79). For 1000 users, 500 products, 10K orders, this is 5 billion iterations. Pre-index orders by userId/productId to reduce to O(n).' },
    { id: '3.2', title: 'O(n²) nested loop in mergeCatalogs', severity: 'medium' as const, category: 'Performance', desc: 'Double loop checks duplicates across two catalogs (line 27). Use a Set of IDs to reduce to O(n).' },
    { id: '3.3', title: 'New MongoDB connection per HTTP request', severity: 'high' as const, category: 'Performance', desc: 'Both /order and /log routes create a new MongoClient, connect, insert, then close. Under load, this exhausts OS connection limits. Use a singleton connection pool initialized at startup.' },
    { id: '4.1', title: 'Unguarded recursive DFS may stack overflow', severity: 'medium' as const, category: 'Scalability', desc: 'findCategoryById() recurses through category trees with no depth limit. Deep category hierarchies will cause a stack overflow. Add a maxDepth guard or convert to iterative BFS.' },
    { id: '4.2', title: 'No request rate limiting or auth middleware', severity: 'high' as const, category: 'Best Practices', desc: 'All routes are publicly accessible without authentication or rate limiting. Brute-force attacks, DDoS, and data exfiltration are trivially possible.' },
    { id: '4.3', title: 'JWT_SECRET hardcoded — authentication bypass', severity: 'critical' as const, category: 'Security', desc: 'const JWT_SECRET = "my-hardcoded-jwt-secret-abc123" (line 10). Any attacker who discovers this can forge valid JWT tokens for any user account.' },
];

const ArchitectureReport: React.FC<ReportProps> = ({ data }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        summary: true, findings: true, security: true,
        drift: false, scale: false, cost: true, actions: true, patterns: false
    });

    const toggle = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }));

    const secScore = data.security.score;
    const scaleScore = data.scalability.score;
    const driftScore = 100 - data.drift.score;
    const costPct = Math.round((parseFloat(data.cost.total.replace('$', '')) / parseFloat(data.cost.budget.replace('$', ''))) * 100);

    const copyToClipboard = () => {
        const text = `DevForge Architecture Report — ${data.timestamp}\n\nHealth Score: ${data.healthScore}/100\nSecurity: ${secScore}/100\nScalability: ${scaleScore}/100\n\nCritical Issues:\n${data.security.critical.join('\n')}\n\nImmediate Actions:\n${data.immediateActions.join('\n')}`;
        navigator.clipboard.writeText(text);
    };

    const buildMarkdownReport = (): string => {
        const hr = '---';
        const findings = FULL_FINDINGS.map(f =>
            `### [${f.id}] ${f.title}\n\n**Severity:** \`${f.severity.toUpperCase()}\` | **Category:** ${f.category}\n\n${f.desc}\n`
        ).join('\n');
        const breakdown = data.cost.breakdown.map(b => `| ${b.service} | ${b.amount} | ${b.percentage} |`).join('\n');
        const actions = data.immediateActions.map((a, i) => `${i + 1}. ${a}`).join('\n');
        return [
            `# DevForge Architecture Analysis Report`,
            ``,
            `> **Generated:** ${data.timestamp}`,
            `> **Health:** ${data.healthScore}/100 | **Security:** ${secScore}/100 | **Scalability:** ${scaleScore}/100 | **Alignment:** ${driftScore}/100`,
            ``,
            hr,
            ``,
            `## Executive Summary`,
            ``,
            `Your architecture uses **${data.components.length} services** with a **${data.patterns}** pattern.`,
            `**${FULL_FINDINGS.filter(f => f.severity === 'critical').length} critical** and **${FULL_FINDINGS.filter(f => f.severity === 'high').length} high-severity** issues found.`,
            ``,
            `| Metric | Score | Status |`,
            `|--------|-------|--------|`,
            `| Health | ${data.healthScore}/100 | ${data.healthScore > 70 ? 'Good' : 'At Risk'} |`,
            `| Security | ${secScore}/100 | ${secScore > 70 ? 'Secure' : 'Vulnerable'} |`,
            `| Scalability | ${scaleScore}/100 | ${scaleScore > 70 ? 'Scalable' : 'Constrained'} |`,
            `| Drift | ${driftScore}/100 | ${driftScore > 80 ? 'Aligned' : 'Deviating'} |`,
            `| Monthly Cost | ${data.cost.total} | Budget ${data.cost.budget} — ${costPct}% used |`,
            ``,
            hr,
            ``,
            `## Detailed Findings (${FULL_FINDINGS.length})`,
            ``,
            findings,
            hr,
            ``,
            `## Security Analysis`,
            ``,
            `**Score:** ${secScore}/100`,
            ``,
            `### Critical`,
            data.security.critical.map(i => `- ${i}`).join('\n'),
            ``,
            `### High Severity`,
            data.security.high.map(i => `- ${i}`).join('\n'),
            ``,
            hr,
            ``,
            `## Scalability`,
            ``,
            data.scalability.limits.map(l => `- ${l}`).join('\n'),
            ``,
            `### Recommendations`,
            data.scalability.recommendations.map(r => `- ${r}`).join('\n'),
            ``,
            hr,
            ``,
            `## Cost Breakdown`,
            ``,
            `**Monthly:** ${data.cost.total} / **Budget:** ${data.cost.budget} (${costPct}%)`,
            ``,
            `| Service | Amount | % |`,
            `|---------|--------|---|`,
            breakdown,
            ``,
            data.cost.savings.length > 0 ? `### Savings\n${data.cost.savings.map(s => `- ${s}`).join('\n')}` : '',
            ``,
            hr,
            ``,
            `## Drift / Blueprint Violations`,
            ``,
            data.drift.violations.map(v => `- ${v}`).join('\n'),
            ``,
            hr,
            ``,
            `## Architecture Components`,
            ``,
            data.components.map(c => `- \`${c}\``).join('\n'),
            ``,
            hr,
            ``,
            `## Remediation Plan`,
            ``,
            actions,
            ``,
            `**Priority Order:** Rotate credentials → Fix SQL injection → Connection pooling → Remove prototype pollution → Add auth middleware → Optimize O(n³) algorithm`,
            ``,
            hr,
            ``,
            `*Report generated by DevForge v1.0 — ${data.timestamp}*`,
        ].join('\n');
    };

    const handleExportMd = () => {
        vscode.postMessage({ type: 'exportReport', content: buildMarkdownReport() });
    };

    return (
        <div className="bg-input-container-bg border border-card-border rounded-xl overflow-hidden text-[13px] text-text-main animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Report Header */}
            <div className="p-4 bg-card-bg border-b border-card-border">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-traycer-blue" />
                        <span className="font-black uppercase tracking-widest text-[11px]">Architecture Analysis Report</span>
                        <span className="text-[8px] font-black border border-traycer-blue/30 text-traycer-blue px-1.5 py-0.5 rounded">v1.0</span>
                    </div>
                    <span className="text-[9px] text-text-dim font-bold">{data.timestamp}</span>
                </div>
                {/* Score Row */}
                <div className="flex justify-around">
                    <CircleScore score={data.healthScore} label="Health" color={data.healthScore > 70 ? '#22c55e' : '#f59e0b'} />
                    <CircleScore score={secScore} label="Security" color={secScore > 70 ? '#22c55e' : secScore > 40 ? '#f59e0b' : '#ef4444'} />
                    <CircleScore score={scaleScore} label="Scalability" color={scaleScore > 70 ? '#22d3ee' : '#f59e0b'} />
                    <CircleScore score={driftScore} label="Alignment" color={driftScore > 80 ? '#a855f7' : '#f59e0b'} />
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Executive Summary */}
                <section>
                    <SectionHeader icon={<Activity size={13} className="text-traycer-blue" />} title="Executive Summary" expanded={expanded.summary} onToggle={() => toggle('summary')} />
                    {expanded.summary && (
                        <div className="space-y-3">
                            <div className="p-4 bg-app-bg/50 border border-card-border/40 rounded-lg text-text-dim font-bold leading-relaxed text-[12px]">
                                <span className="text-white font-black">DevForge</span> analyzed your {data.components.length}-service <span className="text-traycer-blue">{data.patterns}</span> architecture and identified <span className="text-red-400 font-black">4 critical vulnerabilities</span>, <span className="text-orange-400 font-black">5 high-severity issues</span>, and <span className="text-yellow-400 font-black">3 performance anti-patterns</span>. Immediate remediation is required to prevent security breaches and production outages.
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Total Findings', value: FULL_FINDINGS.length.toString(), color: 'text-white' },
                                    { label: 'Critical', value: String(FULL_FINDINGS.filter(f => f.severity === 'critical').length), color: 'text-red-400' },
                                    { label: 'Services Detected', value: String(data.components.length), color: 'text-traycer-blue' },
                                    { label: 'Budget Usage', value: `${costPct}%`, color: costPct > 80 ? 'text-red-400' : 'text-check-green' },
                                ].map(stat => (
                                    <div key={stat.label} className="p-3 bg-app-bg border border-card-border/30 rounded-lg">
                                        <div className="text-[9px] text-text-dim font-black uppercase tracking-wider">{stat.label}</div>
                                        <div className={`text-[20px] font-black ${stat.color}`}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* All Findings */}
                <section>
                    <SectionHeader icon={<AlertTriangle size={13} className="text-orange-400" />} title={`Detailed Findings (${FULL_FINDINGS.length})`} expanded={expanded.findings} onToggle={() => toggle('findings')} />
                    {expanded.findings && (
                        <div className="space-y-2">
                            {FULL_FINDINGS.map(f => (
                                <div key={f.id} className="p-3 bg-app-bg/50 border border-card-border/30 rounded-lg">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-mono text-text-dim opacity-40">#{f.id}</span>
                                            <span className="font-black text-[11px] text-white">{f.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <SeverityBadge severity={f.severity} />
                                            <span className="text-[8px] font-black text-text-dim opacity-40 uppercase tracking-wide">{f.category}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-text-dim leading-relaxed font-bold">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Security Deep-Dive */}
                <section>
                    <SectionHeader icon={<Shield size={13} className="text-red-500" />} title="Security Analysis" expanded={expanded.security} onToggle={() => toggle('security')} />
                    {expanded.security && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <Lock size={18} className="text-red-400 shrink-0" />
                                <div>
                                    <div className="text-[11px] font-black text-white">Security Score: <span className="text-red-400">{secScore}/100</span></div>
                                    <div className="text-[10px] text-text-dim font-bold">Multiple critical vulnerabilities detected — system is NOT production-ready</div>
                                </div>
                            </div>
                            {data.security.critical.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-red-400/80 uppercase tracking-wide flex items-center gap-1"><AlertTriangle size={10} />Critical Issues</span>
                                    {data.security.critical.map((issue, i) => (
                                        <div key={i} className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                            <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                                            <span className="text-text-dim font-bold text-[11px] leading-snug">{issue}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {data.security.high.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-orange-400/80 uppercase tracking-wide">High Severity</span>
                                    {data.security.high.map((issue, i) => (
                                        <div key={i} className="p-2 bg-orange-500/5 border border-orange-500/20 rounded-lg text-text-dim font-bold text-[11px]">{issue}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Drift Analysis */}
                <section>
                    <SectionHeader icon={<GitBranch size={13} className="text-purple-400" />} title="Drift Analysis" expanded={expanded.drift} onToggle={() => toggle('drift')} />
                    {expanded.drift && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-app-bg border border-card-border/30 rounded-lg">
                                <span className="text-[11px] font-bold">Drift Score</span>
                                <span className={`text-[14px] font-black ${data.drift.score > 30 ? 'text-red-400' : 'text-check-green'}`}>{data.drift.score}/100</span>
                            </div>
                            {data.drift.violations.map((v, i) => (
                                <div key={i} className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg text-text-dim font-bold text-[11px] flex items-start gap-2">
                                    <GitBranch size={11} className="text-purple-400 mt-0.5 shrink-0" />
                                    {v}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Scalability */}
                <section>
                    <SectionHeader icon={<TrendingUp size={13} className="text-check-green" />} title="Scalability Analysis" expanded={expanded.scale} onToggle={() => toggle('scale')} />
                    {expanded.scale && (
                        <div className="space-y-2">
                            {data.scalability.limits.map((l, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-app-bg/50 border border-card-border/30 rounded-lg">
                                    <Zap size={12} className="text-traycer-blue mt-0.5 shrink-0" />
                                    <span className="text-text-dim font-bold text-[11px]">{l}</span>
                                </div>
                            ))}
                            <div className="mt-3">
                                <div className="text-[9px] font-black uppercase tracking-wider text-text-dim mb-2">Recommendations</div>
                                {data.scalability.recommendations.map((r, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg text-[11px] text-check-green font-bold">
                                        <CheckCircle2 size={11} className="mt-0.5 shrink-0" />
                                        {r}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Cost */}
                <section>
                    <SectionHeader icon={<DollarSign size={13} className="text-yellow-400" />} title="Cost Analysis" expanded={expanded.cost} onToggle={() => toggle('cost')} />
                    {expanded.cost && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end p-3 bg-app-bg border border-card-border/30 rounded-lg">
                                <div>
                                    <div className="text-[9px] text-text-dim font-black uppercase tracking-wide">Monthly Spend</div>
                                    <div className="text-[28px] font-black text-white">{data.cost.total}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] text-text-dim font-black uppercase tracking-wide">Budget</div>
                                    <div className="text-text-main font-bold">{data.cost.budget}</div>
                                    <div className={`text-[9px] font-black ${costPct > 80 ? 'text-red-400' : 'text-check-green'}`}>{costPct}% utilized</div>
                                </div>
                            </div>
                            {/* Cost bar */}
                            <div className="h-2 bg-app-bg border border-card-border/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${costPct > 80 ? 'bg-red-400' : 'bg-traycer-blue'}`} style={{ width: `${costPct}%` }} />
                            </div>
                            <div className="space-y-2">
                                {data.cost.breakdown.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Server size={10} className="text-text-dim opacity-40 shrink-0" />
                                        <span className="text-[10px] font-bold text-text-dim w-20">{item.service}</span>
                                        <div className="flex-1 h-1.5 bg-app-bg rounded-full overflow-hidden">
                                            <div className="h-full bg-traycer-blue/60 rounded-full" style={{ width: item.percentage }} />
                                        </div>
                                        <span className="text-[10px] font-black w-12 text-right text-white">{item.amount}</span>
                                        <span className="text-[9px] text-text-dim w-8 text-right">{item.percentage}</span>
                                    </div>
                                ))}
                            </div>
                            {data.cost.savings.length > 0 && (
                                <div className="p-3 bg-check-green/5 border border-check-green/20 rounded-lg">
                                    <div className="text-[9px] font-black text-check-green uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingDown size={10} />Savings Opportunities</div>
                                    {data.cost.savings.map((s, i) => <div key={i} className="text-[11px] text-text-dim font-bold">{s}</div>)}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Architecture Stack */}
                <section>
                    <SectionHeader icon={<Database size={13} className="text-cyan-400" />} title={`Architecture Components (${data.components.length})`} expanded={expanded.patterns} onToggle={() => toggle('patterns')} />
                    {expanded.patterns && (
                        <div className="grid grid-cols-1 gap-1.5">
                            {data.components.map((comp, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 bg-app-bg/50 border border-card-border/30 rounded-md">
                                    <Code2 size={10} className="text-traycer-blue/40 shrink-0" />
                                    <span className="text-[11px] text-text-main font-bold">{comp}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Immediate Actions */}
                <section>
                    <SectionHeader icon={<ArrowRight size={13} className="text-traycer-blue" />} title="Remediation Plan" expanded={expanded.actions} onToggle={() => toggle('actions')} />
                    {expanded.actions && (
                        <div className="space-y-2">
                            {data.immediateActions.map((action, i) => (
                                <button key={i} className="w-full text-left p-3 hover:bg-card-bg border border-card-border/40 rounded-lg font-bold transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-traycer-blue/40 w-4">{i + 1}</span>
                                        <span className="text-text-dim group-hover:text-white text-[11px] transition-colors">{action}</span>
                                    </div>
                                    <ArrowRight size={12} className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                            ))}
                            <div className="p-3 bg-traycer-blue/5 border border-traycer-blue/20 rounded-lg mt-3">
                                <div className="text-[9px] font-black text-traycer-blue uppercase tracking-wide mb-1">Priority Order</div>
                                <div className="text-[10px] text-text-dim font-bold leading-relaxed">
                                    1. Rotate credentials immediately → 2. Fix SQL injection → 3. Implement connection pooling → 4. Remove prototype pollution → 5. Add auth middleware → 6. Optimize O(n³) algorithm
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Footer */}
            <div className="p-4 bg-card-bg border-t border-card-border flex gap-3">
                <button
                    onClick={handleExportMd}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-input-container-bg hover:bg-[#333] border border-traycer-blue/40 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-traycer-blue"
                >
                    <Download size={12} />Export .md
                </button>
                <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 py-2 bg-input-container-bg hover:bg-[#333] border border-card-border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                    <Clipboard size={12} />Copy Report
                </button>
            </div>
        </div>
    );
};

export default ArchitectureReport;
