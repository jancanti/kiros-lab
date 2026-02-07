import React, { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

export default function EssenceCalculator() {
    const [numPots, setNumPots] = useState(1);
    const [potVolume, setPotVolume] = useState(200);
    const [essencePercent, setEssencePercent] = useState(10);

    const result = useMemo(() => {
        const totalWeight = numPots * potVolume;
        const divisor = 1 + (essencePercent / 100);
        const waxAmount = Math.round(totalWeight / divisor);
        const essenceAmount = Math.round(totalWeight - waxAmount);

        return {
            totalWeight,
            waxAmount,
            essenceAmount
        };
    }, [numPots, potVolume, essencePercent]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold uppercase tracking-tighter">Calculadora</h2>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-lg font-medium text-foreground/80 mb-6 flex items-center gap-3">
                    <Calculator className="text-brand shrink-0" size={28} />
                    Experimente diferentes quantidades, volumes e porcentagens para fazer um cálculo preciso
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Número de Potes</label>
                        <input
                            type="number"
                            min="1"
                            value={numPots}
                            onChange={e => setNumPots(Number(e.target.value) || 1)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-lg focus:outline-none focus:border-brand transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Volume do Pote (g)</label>
                        <input
                            type="number"
                            min="1"
                            value={potVolume}
                            onChange={e => setPotVolume(Number(e.target.value) || 1)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-lg focus:outline-none focus:border-brand transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Essência (%)</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={essencePercent}
                            onChange={e => setEssencePercent(Number(e.target.value) || 1)}
                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-lg focus:outline-none focus:border-brand"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="bg-muted/30 border border-border rounded-xl p-6">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Resultado</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface border border-border/50 rounded-lg p-6 text-center flex flex-col justify-center min-h-[160px]">
                            <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Peso Total</div>
                            <div className="text-3xl font-black font-mono">{result.totalWeight} g</div>
                        </div>
                        <div className="bg-surface border border-border/50 rounded-lg p-6 text-center flex flex-col justify-center min-h-[160px]">
                            <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Quantidade de Cera</div>
                            <div className="text-3xl font-black text-foreground/70 font-mono">{result.waxAmount} g</div>
                        </div>
                        <div className="bg-brand/10 border border-brand/30 rounded-lg p-6 text-center flex flex-col justify-center min-h-[160px]">
                            <div className="text-brand text-xs font-bold uppercase tracking-wider mb-2">Qtd de Essência</div>
                            <div className="text-3xl font-black text-brand font-mono">{result.essenceAmount} g</div>
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-muted-foreground text-center">
                        Fórmula: Essência = Peso Total - (Peso Total / (1 + %Essência/100))
                    </div>
                </div>
            </div>
        </div>
    );
}
