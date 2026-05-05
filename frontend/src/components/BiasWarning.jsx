import React from 'react';

export default function BiasWarning({ score, flags, onOverride }) {
  const getSeverity = (score) => {
    if (score < 3) return { level: 'low', color: 'yellow', icon: '⚠️' };
    if (score < 7) return { level: 'medium', color: 'orange', icon: '⚠️' };
    return { level: 'high', color: 'red', icon: '🚫' };
  };

  const severity = getSeverity(score);
  const colorMap = {
    yellow: 'bg-yellow-50 border-yellow-300 text-yellow-900',
    orange: 'bg-orange-50 border-orange-300 text-orange-900',
    red: 'bg-red-50 border-red-300 text-red-900',
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 mb-4 ${colorMap[severity.color]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{severity.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">
            Potential bias detected (Score: {score}/10)
          </h4>
          
          {flags && flags.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1">Flagged phrases:</p>
              <ul className="text-xs space-y-1">
                {flags.slice(0, 3).map((flag, i) => (
                  <li key={i}>• {flag}</li>
                ))}
                {flags.length > 3 && <li>• ...and {flags.length - 3} more</li>}
              </ul>
            </div>
          )}

          <p className="text-xs mt-3 leading-relaxed">
            This email may contain language that could be perceived as biased or discriminatory. 
            Please review the flagged content before sending.
          </p>

          {onOverride && (
            <button
              onClick={onOverride}
              className={`mt-3 text-xs font-semibold px-3 py-1 rounded transition-smooth ${
                severity.color === 'red'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : severity.color === 'orange'
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              Send Anyway (Override)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
