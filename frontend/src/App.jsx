import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emerald-900">🌿 Offlo</h1>
        <button
          onClick={() => navigate('/login')}
          className="text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          Sign In
        </button>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-emerald-900 mb-6">
          AI Email That Won't Embarrass You
        </h2>
        <p className="text-xl text-emerald-700 mb-8 max-w-2xl mx-auto">
          Draft emails with confidence. Every AI draft is transparent, human-approved, and carbon-tracked. 
          <br />
          <span className="font-semibold">You stay in control.</span>
        </p>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-md mx-auto text-center">
          <div>
            <p className="text-3xl font-bold text-emerald-600">100%</p>
            <p className="text-sm text-emerald-700">Human Approval</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-600">2x</p>
            <p className="text-sm text-emerald-700">Carbon Offset</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-600">10%</p>
            <p className="text-sm text-emerald-700">Profits → Climate</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/login')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition transform hover:scale-105 mb-4"
        >
          Start Free Trial
        </button>
        <p className="text-emerald-700 text-sm">No card required. 14 days free.</p>
      </div>

      {/* Features */}
      <div className="bg-white bg-opacity-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-emerald-900 text-center mb-12">Why Offlo?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Transparent by Default</h4>
              <p className="text-gray-600">
                Every AI-drafted email is marked as such. No sneaky AI. Your recipients know exactly what they're reading.
              </p>
              <p className="text-emerald-600 text-sm font-semibold mt-4">Ethical AI start to finish</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">👤</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">You're Always in Control</h4>
              <p className="text-gray-600">
                Mandatory human review before any email sends. You approve the final draft. No surprises.
              </p>
              <p className="text-emerald-600 text-sm font-semibold mt-4">Human + AI partnership</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">🌍</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Carbon Aware & Offset</h4>
              <p className="text-gray-600">
                Every email's carbon footprint is measured. We offset 2x your emissions. Guilt-free productivity.
              </p>
              <p className="text-emerald-600 text-sm font-semibold mt-4">Net-negative impact</p>
            </div>
          </div>
        </div>
      </div>

      {/* Carbon Impact Transparency */}
      <div className="bg-emerald-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-emerald-900 text-center mb-12">How We Offset 2x Your Emissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Measure */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-bold text-emerald-900 mb-3">📊 We Measure</h4>
              <p className="text-gray-600 text-sm mb-3">
                Each email's carbon cost is calculated:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• API calls: ~0.02g CO₂e per draft</li>
                <li>• Email transmission: ~0.3g CO₂e per send</li>
                <li>• Storage: ~0.001g CO₂e per month</li>
              </ul>
              <p className="text-emerald-700 font-semibold text-xs mt-4">Total: ~0.32g CO₂e/email</p>
            </div>

            {/* Offset */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-bold text-emerald-900 mb-3">🌍 We Offset 2x</h4>
              <p className="text-gray-600 text-sm mb-3">
                For every email sent:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• You emit: 0.32g CO₂e</li>
                <li>• We offset: 0.64g CO₂e</li>
                <li>• Via: Verified carbon credits</li>
              </ul>
              <p className="text-emerald-700 font-semibold text-xs mt-4">Net: -0.32g CO₂e (carbon negative)</p>
            </div>

            {/* Where It Goes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-bold text-emerald-900 mb-3">💚 10% of Profits</h4>
              <p className="text-gray-600 text-sm mb-3">
                Your monthly bill:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 50% → development</li>
                <li>• 40% → operations</li>
                <li>• 10% → nonprofits</li>
              </ul>
              <p className="text-emerald-700 font-semibold text-xs mt-4">Climate & tech equity causes</p>
            </div>
          </div>

          {/* Transparency Note */}
          <div className="bg-white rounded-lg border border-emerald-200 p-6 text-center mb-8">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Full Transparency:</strong> All carbon offsets are through verified, third-party certified programs. 
            </p>
            <p className="text-xs text-emerald-700">
              Every purchase includes an impact receipt showing exactly how many grams you offset and where your 10% went.
            </p>
          </div>

          {/* Carbon Credits Explained */}
          <div className="bg-white rounded-lg p-6 border-l-4 border-emerald-600">
            <h4 className="font-bold text-emerald-900 mb-3">What Are Carbon Credits?</h4>
            <p className="text-gray-700 text-sm mb-4">
              A carbon credit represents 1 ton of CO₂ removed or prevented from the atmosphere. Here's how it works:
            </p>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-900">1. Projects reduce emissions</p>
                <p className="text-xs mt-1">Wind farms, forest protection, methane capture — projects that prevent or remove CO₂.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">2. Credits are issued & verified</p>
                <p className="text-xs mt-1">Third-party auditors (Gold Standard, VCS) verify the reduction actually happened.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">3. Companies buy offsets</p>
                <p className="text-xs mt-1">We purchase credits equal to 2x your emissions, retiring them so no one else can use them.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">4. You see the impact</p>
                <p className="text-xs mt-1">Your receipt shows exactly which projects you funded (e.g., "2.5 credits to Amazon forest protection").</p>
              </div>
            </div>
            <p className="text-xs text-emerald-700 mt-4 italic">
              💡 We use only verified carbon credits from reputable programs. No greenwashing. Your impact is real.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="bg-emerald-50 rounded-lg p-8 border border-emerald-200">
          <h3 className="text-2xl font-bold text-emerald-900 mb-4">Built for Teams That Care</h3>
          <p className="text-emerald-700 mb-6">
            Offlo is for people who believe AI should be transparent, not deceptive. For teams that want to move faster without cutting corners on ethics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-700">
            <div className="flex items-start gap-3">
              <span className="text-lg">✓</span>
              <span>Gmail & Outlook (secure OAuth)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">✓</span>
              <span>Carbon tracking & impact receipts</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">✓</span>
              <span>Full audit trail of all changes</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">✓</span>
              <span>Nonprofit transparency dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Teaser */}
      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-emerald-900 mb-8">Simple Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-900">$49</p>
              <p className="text-emerald-700 font-semibold">Starter</p>
              <p className="text-sm text-gray-600 mt-2">Up to 100 emails/month</p>
            </div>
            <div className="bg-emerald-600 text-white rounded-lg p-6 border-2 border-emerald-600 transform scale-105">
              <p className="text-2xl font-bold">$129</p>
              <p className="font-semibold">Pro</p>
              <p className="text-sm text-emerald-100 mt-2">Up to 500 emails/month</p>
              <p className="text-xs mt-2 text-emerald-200">★ Most Popular</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-900">$249</p>
              <p className="text-emerald-700 font-semibold">Enterprise</p>
              <p className="text-sm text-gray-600 mt-2">Unlimited + Team seats</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">Plus: 10% of profits go directly to climate action & tech equity nonprofits.</p>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Draft Smarter?</h3>
          <p className="text-lg text-emerald-100 mb-8">
            Join the teams moving faster without cutting corners on ethics.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-4 px-8 rounded-lg text-lg transition transform hover:scale-105"
          >
            Start Your Free Trial
          </button>
          <p className="text-emerald-200 text-sm mt-4">14 days free. No card required.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-emerald-900 text-emerald-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm">
          <p>Offlo — Ethical AI for email. Transparent. Human-approved. Carbon-aware.</p>
          <p className="mt-2">Made by Micah & Marshall. 🌿</p>
        </div>
      </div>
    </div>
  );
}
