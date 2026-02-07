import React, { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

export default function EssenceCalculator() {
    const [numPots, setNumPots] = useState(1);
    const [potVolume, setPotVolume] = useState(200);
    const [essencePercent, setEssencePercent] = useState(10);

    const result = useMemo(() => {
        const totalWeight = numPots * potVolume;
        const divisor = 1 + (essencePercent / 100);
        const waxAmount = totalWeight / divisor;
        const essenceAmount = totalWeight - waxAmount;

        return {
            totalWeight,
            waxAmount: waxAmount.toFixed(2),
            essenceAmount: essenceAmount.toFixed(2)
        };
    }, [numPots, potVolume, essencePercent]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Calculadora de Essência</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                    <Calculator className="text-blue-500" size={20} />
                    Calcular Quantidade de Essência para Velas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Número de Potes</label>
                        <input
                            type="number"
                            min="1"
                            value={numPots}
                            onChange={e => setNumPots(Number(e.target.value) || 1)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Volume do Pote (g)</label>
                        <input
                            type="number"
                            min="1"
                            value={potVolume}
                            onChange={e => setPotVolume(Number(e.target.value) || 1)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Essência (%)</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={essencePercent}
                            onChange={e => setEssencePercent(Number(e.target.value) || 1)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Resultado</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Peso Total</div>
                            <div className="text-2xl font-bold text-white font-mono">{result.totalWeight}g</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Quantidade de Cera</div>
                            <div className="text-2xl font-bold text-amber-400 font-mono">{result.waxAmount}g</div>
                        </div>
                        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-center">
                            <div className="text-blue-300 text-sm mb-1">Quantidade de Essência</div>
                            <div className="text-3xl font-bold text-blue-400 font-mono">{result.essenceAmount}g</div>
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-slate-500 text-center">
                        Fórmula: Essência = Peso Total - (Peso Total / (1 + %Essência/100))
                    </div>
                </div>
            </div>
        </div>
    );
}
