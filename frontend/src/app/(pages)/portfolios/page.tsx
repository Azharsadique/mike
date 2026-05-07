"use client";

import { useEffect, useState } from "react";
import { AnalyticsModal } from "../components/AnalyticsModal";

interface Portfolio {
    id: string;
    organisation: string;
    name: string;
    portfolio_uri: string;
    created_at: string;
}

export default function PortfoliosDashboard() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);

    useEffect(() => {
        async function fetchPortfolios() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolios`);
                if (!res.ok) throw new Error("Failed to fetch portfolios");
                const data = await res.json();
                setPortfolios(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchPortfolios();
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">IP Portfolios Dashboard</h1>
                <p className="text-gray-500 mt-2">Manage and analyze your trademark datasets.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                    Error loading portfolios: {error}
                </div>
            )}

            {loading ? (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg w-full"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolios.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                            No portfolios found. The backend bootstrap script should seed these automatically.
                        </div>
                    ) : (
                        portfolios.map((p) => (
                            <div key={p.id} className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-5 flex-grow">
                                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                                        {p.organisation}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                                    <div className="text-xs text-gray-500 font-mono truncate" title={p.portfolio_uri}>
                                        {p.portfolio_uri}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 border-t mt-auto flex justify-end">
                                    <button
                                        onClick={() => setSelectedPortfolio(p)}
                                        className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded font-medium transition-colors w-full"
                                    >
                                        Run Analytics
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Analytics Modal */}
            <AnalyticsModal
                isOpen={!!selectedPortfolio}
                onClose={() => setSelectedPortfolio(null)}
                portfolioId={selectedPortfolio?.id || null}
                portfolioName={selectedPortfolio?.name || ""}
            />
        </div>
    );
}
