import React from 'react';

export default function CarbonImpact({ carbonEmissions }) {
  if (!carbonEmissions) return null;

  const { total, offset } = carbonEmissions;

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-emerald-900">🌍 Carbon Impact</h4>
        <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
          Net negative
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded p-3 border border-emerald-100">
          <p className="text-xs text-gray-600">Emissions</p>
          <p className="text-sm font-bold text-gray-900">{total.toFixed(3)}g</p>
          <p className="text-xs text-gray-500">CO₂e</p>
        </div>

        <div className="bg-white rounded p-3 border border-emerald-100">
          <p className="text-xs text-gray-600">Offset</p>
          <p className="text-sm font-bold text-emerald-600">{offset.toFixed(3)}g</p>
          <p className="text-xs text-gray-500">2x coverage</p>
        </div>

        <div className="bg-white rounded p-3 border border-emerald-100">
          <p className="text-xs text-gray-600">Net Impact</p>
          <p className="text-sm font-bold text-emerald-600">
            -{(offset - total).toFixed(3)}g
          </p>
          <p className="text-xs text-gray-500">carbon negative</p>
        </div>
      </div>

      <p className="text-xs text-emerald-700 mt-3 leading-relaxed">
        ✓ We offset 2x your email's emissions through verified carbon credits. 
        Your impact is tracked and reported monthly.
      </p>
    </div>
  );
}
