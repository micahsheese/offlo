import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState(null);
  const [allDrafts, setAllDrafts] = useState([]);
  const [carbonStats, setCarbonStats] = useState(null);

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    context: '',
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    authService.getUser().then(user => {
      if (user) {
        setUser(user);
        fetchDrafts();
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
  }, [navigate]);

  const fetchDrafts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/drafts`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAllDrafts(data.drafts || []);
        calculateCarbonStats(data.drafts || []);
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    }
  };

  const calculateCarbonStats = (draftsList) => {
    const sentDrafts = draftsList.filter(d => d.status === 'sent' && d.carbonEmissions);
    const totalEmissions = sentDrafts.reduce((sum, d) => sum + (d.carbonEmissions.total || 0), 0);
    const totalOffset = sentDrafts.reduce((sum, d) => sum + (d.carbonEmissions.offset || 0), 0);
    
    setCarbonStats({
      emailsSent: sentDrafts.length,
      totalEmissions: parseFloat(totalEmissions.toFixed(4)),
      totalOffset: parseFloat(totalOffset.toFixed(4)),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDraftCreate = async (e) => {
    e.preventDefault();
    setDrafting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('to', formData.to);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('context', formData.context);
      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch(`${API_BASE}/api/drafts`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (!response.ok) {
        alert('Error creating draft');
        setDrafting(false);
        return;
      }

      const draftData = await response.json();
      setDraft(draftData);
      setShowForm(false);
      setFormData({ to: '', subject: '', context: '' });
      setAttachments([]);
      setDrafting(false);
    } catch (err) {
      alert('Failed: ' + err.message);
      setDrafting(false);
    }
  };

  const handleSendDraft = async (override = false) => {
    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/drafts/${draft.id}/approve?override=${override}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.status === 400) {
        const data = await response.json();
        if (data.error === 'High bias detected') {
          // Show bias warning but allow override
          setDraft({ ...draft, biasScore: data.biasScore, biasFlags: data.biasFlags });
          setSending(false);
          return;
        }
      }

      if (!response.ok) {
        alert('Error sending email');
        setSending(false);
        return;
      }

      const result = await response.json();
      const sentDraft = { ...draft, status: 'sent', sentAt: new Date().toISOString() };
      setDraft(sentDraft);
      // Refresh drafts and carbon stats
      fetchDrafts();
      setSending(false);
    } catch (err) {
      alert('Error: ' + err.message);
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-900">🌿 Offlo</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Draft New Email</h2>
            <form onSubmit={handleDraftCreate}>
              <div className="space-y-4 mb-6">
                <input
                  type="email"
                  required
                  placeholder="To: recipient@example.com"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  required
                  placeholder="What should this email say?"
                  rows="4"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <p className="text-sm text-gray-600">📎 Click to attach files (or drag & drop)</p>
                    <p className="text-xs text-gray-500 mt-1">Max 10MB per file, up to 5 files</p>
                  </label>
                </div>
                
                {attachments.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Attachments ({attachments.length})</p>
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                        <p className="text-sm text-gray-700">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={drafting}
                  className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {drafting ? 'Generating...' : 'Generate Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {draft && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-emerald-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Email Draft</h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600"><strong>To:</strong></p>
                <p className="text-lg text-gray-900">{draft.to}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600"><strong>Subject:</strong></p>
                <p className="text-lg text-gray-900">{draft.subject}</p>
              </div>
              {draft.badge && (
                <div className="p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
                  <p className="text-xs font-semibold text-blue-900">🤖 AI Transparency Badge</p>
                  <p className="text-xs text-blue-800 mt-1"><strong>Model:</strong> {draft.badge.model}</p>
                  <p className="text-xs text-blue-800"><strong>Generated:</strong> {new Date(draft.badge.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-blue-700 italic mt-2">"{draft.badge.disclosure}"</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600"><strong>Draft:</strong></p>
                <div className="bg-gray-50 p-4 rounded text-gray-900 whitespace-pre-wrap mt-2">
                  {draft.draftText}
                </div>
              </div>
              
              {draft.attachments && draft.attachments.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-sm font-semibold text-purple-900 mb-2">📎 Attachments ({draft.attachments.length})</p>
                  <ul className="text-sm text-purple-800 space-y-1">
                    {draft.attachments.map((att, idx) => (
                      <li key={idx}>
                        <span className="font-mono text-xs">{att.filename}</span> ({(att.size / 1024).toFixed(1)}KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {draft.carbonEmissions && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">🌍 Carbon Impact</p>
                  <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
                    <div>
                      <p className="text-xs text-blue-700">Total Emissions</p>
                      <p className="font-mono text-base">{draft.carbonEmissions.total}g CO₂e</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">We Offset</p>
                      <p className="font-mono text-base">{draft.carbonEmissions.offset}g CO₂e</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">Breakdown: {draft.carbonEmissions.inference}g inference + {draft.carbonEmissions.transmission}g transmission + {draft.carbonEmissions.device}g device</p>
                </div>
              )}
            </div>

            {draft.status === 'pending_approval' && (
              <>
                {draft.biasScore !== null && draft.biasScore > 5 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded mb-4">
                    <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Bias Warning - Score: {draft.biasScore}/10</p>
                    <p className="text-sm text-red-800 mb-3">This email contains language that may be biased or offensive. Review the flags below.</p>
                    <ul className="text-sm text-red-800 space-y-1 mb-4">
                      {draft.biasFlags.map((flag, idx) => (
                        <li key={idx}>• {flag}</li>
                      ))}
                    </ul>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSendDraft(true)}
                        disabled={sending}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50"
                      >
                        {sending ? 'Sending...' : 'Send Anyway'}
                      </button>
                      <button
                        onClick={() => setDraft(null)}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
                      >
                        Edit & Regenerate
                      </button>
                    </div>
                  </div>
                )}
                
                {draft.biasScore === null && (
                  <div className="flex gap-4">
                    <button
                      onClick={handleSendDraft}
                      disabled={sending}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : '✓ Approve & Send'}
                    </button>
                    <button
                      onClick={() => setDraft(null)}
                      className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
                    >
                      Edit & Regenerate
                    </button>
                  </div>
                )}
              </>
            )}

            {draft.status === 'sent' && (
              <>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 mb-4">
                  ✓ Email sent successfully at {new Date(draft.sentAt).toLocaleTimeString()}
                </div>
                {draft.carbonEmissions && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-900 mb-2">🌍 Carbon Impact Summary</p>
                    <p className="text-sm text-blue-800 mb-2">You emitted <strong>{draft.carbonEmissions.total}g CO₂e</strong> sending this email.</p>
                    <p className="text-sm text-blue-800">We offset <strong>{draft.carbonEmissions.offset}g CO₂e</strong> on your behalf (2x offset).</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!showForm && !draft && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user?.email?.split('@')[0]}</h2>
              <p className="text-gray-600 mb-6">
                Create AI-drafted emails with full transparency and human control.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Draft New Email
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
              <ol className="space-y-3 text-gray-600 text-sm">
                <li><strong>1. Describe</strong> — Tell AI what the email should say</li>
                <li><strong>2. Review</strong> — AI generates a draft with transparency marking</li>
                <li><strong>3. Approve</strong> — You approve before it sends</li>
                <li><strong>4. Track</strong> — Carbon impact measured & offset</li>
              </ol>
            </div>

            {carbonStats && (
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg shadow p-8 border border-emerald-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🌍 Carbon Impact</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Emails Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{carbonStats.emailsSent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Your Emissions</p>
                    <p className="font-mono text-lg text-gray-900">{carbonStats.totalEmissions}g CO₂e</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">We Offset (2x)</p>
                    <p className="font-mono text-lg font-bold text-emerald-600">{carbonStats.totalOffset}g CO₂e</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
