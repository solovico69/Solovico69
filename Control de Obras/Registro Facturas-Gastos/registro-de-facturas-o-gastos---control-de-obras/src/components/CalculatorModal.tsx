import React, { useState } from 'react';
import { Calculator, X, Check, Delete, RefreshCw } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyResult: (val: number, targetField: 'bs' | 'usd') => void;
  targetItemIndex?: number;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyResult,
  targetItemIndex,
}) => {
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [memory, setMemory] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNumClick = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOpClick = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleCalculate = () => {
    try {
      if (!equation) return;
      const fullExpr = equation + display;
      // Sanitize expression
      const sanitized = fullExpr.replace(/×/g, '*').replace(/÷/g, '/');
      // Evaluate safe mathematical expression
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
      } else {
        const rounded = Number(result.toFixed(4));
        setDisplay(String(rounded));
        setEquation('');
      }
    } catch (err) {
      setDisplay('Error');
    }
  };

  const currentVal = parseFloat(display) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn font-sans">
      <div className="w-full max-w-sm bg-slate-900 rounded-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-sm font-mono uppercase tracking-wider">Calculadora de Precios</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Required Notice Banner */}
        <div className="bg-slate-800/80 border-b border-slate-700 p-2.5 text-[11px] text-slate-300 font-mono leading-snug">
          <p>
            💡 Cálculo de adicionales en precios unitarios ($$ o Bss)
          </p>
        </div>

        {/* Display Area */}
        <div className="p-4 bg-slate-950 flex flex-col items-end justify-between min-h-[90px] border-b border-slate-800">
          <span className="text-xs text-slate-500 font-mono h-4 overflow-hidden">
            {equation}
          </span>
          <span className="text-3xl font-black font-mono text-orange-400 tracking-tight break-all">
            {display}
          </span>
        </div>

        {/* Keypad */}
        <div className="p-3 grid grid-cols-4 gap-2 bg-slate-900 font-mono">
          <button
            onClick={handleClear}
            className="col-span-2 py-2.5 rounded font-bold text-xs uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-800 hover:bg-red-900 transition-colors"
          >
            AC / Limpiar
          </button>
          <button
            onClick={handleBackspace}
            className="py-2.5 rounded font-bold text-sm bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Borrar carácter"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpClick('/')}
            className="py-2.5 rounded font-bold text-base bg-orange-950/60 border border-orange-800/80 text-orange-400 hover:bg-orange-900/80 transition-colors"
          >
            ÷
          </button>

          <button
            onClick={() => handleNumClick('7')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            7
          </button>
          <button
            onClick={() => handleNumClick('8')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            8
          </button>
          <button
            onClick={() => handleNumClick('9')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            9
          </button>
          <button
            onClick={() => handleOpClick('*')}
            className="py-2.5 rounded font-bold text-base bg-orange-950/60 border border-orange-800/80 text-orange-400 hover:bg-orange-900/80 transition-colors"
          >
            ×
          </button>

          <button
            onClick={() => handleNumClick('4')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            4
          </button>
          <button
            onClick={() => handleNumClick('5')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            5
          </button>
          <button
            onClick={() => handleNumClick('6')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            6
          </button>
          <button
            onClick={() => handleOpClick('-')}
            className="py-2.5 rounded font-bold text-base bg-orange-950/60 border border-orange-800/80 text-orange-400 hover:bg-orange-900/80 transition-colors"
          >
            -
          </button>

          <button
            onClick={() => handleNumClick('1')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            1
          </button>
          <button
            onClick={() => handleNumClick('2')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            2
          </button>
          <button
            onClick={() => handleNumClick('3')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            3
          </button>
          <button
            onClick={() => handleOpClick('+')}
            className="py-2.5 rounded font-bold text-base bg-orange-950/60 border border-orange-800/80 text-orange-400 hover:bg-orange-900/80 transition-colors"
          >
            +
          </button>

          <button
            onClick={() => handleNumClick('0')}
            className="col-span-2 py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={() => handleNumClick('.')}
            className="py-2.5 rounded font-bold text-base bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            .
          </button>
          <button
            onClick={handleCalculate}
            className="py-2.5 rounded font-bold text-base bg-orange-600 text-white hover:bg-orange-500 transition-colors shadow-md"
          >
            =
          </button>
        </div>

        {/* Transfer Result Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex flex-col gap-2 font-mono">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Copiar resultado ({currentVal}) al formulario:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onApplyResult(currentVal, 'bs');
                onClose();
              }}
              className="px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-orange-400" />
              Aplicar a (Bs)
            </button>
            <button
              onClick={() => {
                onApplyResult(currentVal, 'usd');
                onClose();
              }}
              className="px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              Aplicar a ($)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
