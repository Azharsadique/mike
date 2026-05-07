"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

interface Metrics {
    competitor_overlap: number;
    fto_risk: number;
    tech_coverage: number;
    market_alignment: number;
}

export function AnalyticsModal({
    isOpen,
    onClose,
    portfolioId,
    portfolioName
}: {
    isOpen: boolean;
    onClose: () => void;
    portfolioId: string | null;
    portfolioName: string;
}) {
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!portfolioId) return;
        setLoading(true);
        setError(null);
        setMetrics(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolios/${portfolioId}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to analyze");

            setMetrics(data.metrics);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const chartData = metrics ? [
        { subject: 'Competitor Overlap', A: metrics.competitor_overlap * 100, fullMark: 100 },
        { subject: 'FTO Risk', A: metrics.fto_risk * 100, fullMark: 100 },
        { subject: 'Tech Coverage', A: metrics.tech_coverage * 100, fullMark: 100 },
        { subject: 'Market Alignment', A: metrics.market_alignment * 100, fullMark: 100 },
    ] : [];

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 -mx-6 -mt-6 rounded-t-2xl">
                    <DialogTitle className="text-2xl font-extrabold text-white tracking-tight">IP Analytics: {portfolioName}</DialogTitle>
                    <DialogDescription className="text-blue-100 font-medium mt-1">
                        AI-powered Variational Quantum Classifier (VQC) Insights
                    </DialogDescription>
                </DialogHeader>

                <div className="py-8 px-2">
                    {!metrics && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="bg-indigo-50 p-4 rounded-full">
                                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                            </div>
                            <p className="text-gray-600 text-center max-w-md">Launch the analytics engine to evaluate this portfolio's market strength, risk factors, and overall coverage footprint.</p>
                            <button 
                                onClick={handleAnalyze}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transform transition hover:scale-105 active:scale-95"
                            >
                                Execute Analysis Run
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-400 rounded-full blur animate-pulse"></div>
                                <div className="relative animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white shadow-inner bg-gradient-to-tr from-blue-600 to-indigo-600"></div>
                            </div>
                            <p className="text-lg font-semibold text-indigo-800 animate-pulse">Calculating IP Matrix via Azure AI...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            <strong>Error executing model:</strong> {error}
                        </div>
                    )}

                    {metrics && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 600 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <RechartsTooltip wrapperClassName="rounded-lg shadow-xl border-none" cursor={{fill: '#f3f4f6'}} />
                                        <Radar name="IP Portfolio" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="url(#colorUv)" fillOpacity={0.6} />
                                        <defs>
                                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                            </linearGradient>
                                        </defs>
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <MetricBadge label="Risk Exposure" value={metrics.fto_risk} inverse />
                                <MetricBadge label="Coverage Footprint" value={metrics.tech_coverage} />
                            </div>
                            
                            <div className="pt-6 flex justify-end">
                                <button 
                                    onClick={onClose}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-full font-semibold transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MetricBadge({ label, value, inverse = false }: { label: string, value: number, inverse?: boolean }) {
    const percentage = Math.round(value * 100);
    const isGood = inverse ? percentage < 50 : percentage > 50;
    const colorClass = isGood ? "text-green-600 bg-green-50 border-green-200" : "text-amber-600 bg-amber-50 border-amber-200";
    
    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${colorClass}`}>
            <span className="text-3xl font-black">{percentage}%</span>
            <span className="text-xs font-semibold uppercase tracking-wider mt-1">{label}</span>
        </div>
    );
}
