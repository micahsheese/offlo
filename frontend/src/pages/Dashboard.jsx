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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [biasOverride, setBiasOverride] = useState(false);

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    context: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [formErrors, setFormErrors] = useState({});

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

  const validateForm = () => {
    const errors = {};
    if (!formData.to) errors.to = 'Email address required';
    if (!formData.subject) errors.subject = 'Subject required';
    if (!formData.context) errors.context = 'Context required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.to && !emailRegex.test(formData.to)) {
      errors.to = 'Invalid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDraftCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setDrafting(true);
    setError(null);

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

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create draft');
        setDrafting(false);
        return;
      }

      setDraft(data);
      setShowForm(false);
      setFormData({ to: '', subject: '', context: '' });
      setAttachments([]);
      setSuccess('Draft created! Review and approve to send.');
      setDrafting(false);
    } catch (err) {
      setError('Failed to create draft: ' + err.message);
      setDrafting(false);
    }
  };

  const handleSendDraft = async (override = false) => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/drafts/${draft.id}/approve?override=${override}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.status === 400) {
        if (data.error === 'High bias detected') {
          setDraft({ ...draft, biasScore: data.biasScore, biasFlags: data.biasFlags });
          setBiasOverride(false);
          setSending(false);
          return;
        }
      }

      if (!response.ok) {
        setError(data.error || 'Failed to send email');
        setSending(false);
        return;
      }

      const sentDraft = { ...draft, status: 'sent', sentAt: new Date().toISOString() };
      setDraft(sentDraft);
      setSuccess('✓ Email sent successfully!');
      fetchDrafts();
      setTimeout(() => setDraft(null), 3000);
      setSending(false);
    } catch (err) {
      setError('Error sending email: ' + err.message);
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    
    if (newFiles.length < files.length) {
      setError('Some files exceed 10MB limit and were skipped');
    }
    
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mb-6"></div>
          <p className="text-emerald-900 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pendingDraft = draft;
  const hasBiasWarning = draft && draft.biasScore && draft.biasScore > 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white bg-opacity-80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌿</span>
            <h1 className="text-2xl font-bold text-emerald-900">Offlo</h1>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-900">{user?.email}</p>
              <p className="text-xs text-emerald-600">Account active</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 rounded-lg transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        {/* Alerts */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 animate-fadeIn">
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-red-800 text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700 font-bold">✕</button>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-lg p-6 animate-fadeIn">
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">✓</span>
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Success</p>
                <p className="text-emerald-800 text-sm mt-1">{success}</p>
              </div>
              <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-700 font-bold">✕</button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {carbonStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-emerald-100">
              <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wide mb-3">Emails Sent</p>
              <p className="text-5xl font-bold text-emerald-900">{carbonStats.emailsSent}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8 border border-emerald-100">
              <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wide mb-3">CO₂ Emissions</p>
              <p className="text-5xl font-bold text-emerald-900">{carbonStats.totalEmissions.toFixed(2)}<span className="text-2xl ml-2">g</span></p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8 border border-emerald-100">
              <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wide mb-3">Offset (2x)</p>
              <p className="text-5xl font-bold text-emerald-900">{carbonStats.totalOffset.toFixed(2)}<span className="text-2xl ml-2">g</span></p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Draft Creation & Review */}
          <div className="lg:col-span-2">
            {!pendingDraft ? (
              <>
                {!showForm ? (
                  /* Empty State */
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-emerald-100">
                    <div className="text-6xl mb-6">✏️</div>
                    <h2 className="text-2xl font-bold text-emerald-900 mb-3">Ready to draft?</h2>
                    <p className="text-emerald-700 mb-8 text-lg">Create a new email draft. We'll generate the text, check for bias, and track the carbon impact.</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition transform hover:scale-105"
                    >
                      Create New Draft
                    </button>
                  </div>
                ) : (
                  /* Draft Form */
                  <div className="bg-white rounded-xl shadow-lg p-8 border border-emerald-100">
                    <h2 className="text-2xl font-bold text-emerald-900 mb-8">New Email Draft</h2>
                    <form onSubmit={handleDraftCreate} className="space-y-6">
                      {/* To Field */}
                      <div>
                        <label className="block text-sm font-semibold text-emerald-900 mb-2">To</label>
                        <input
                          type="email"
                          placeholder="recipient@example.com"
                          value={formData.to}
                          onChange={(e) => {
                            setFormData({ ...formData, to: e.target.value });
                            if (formErrors.to) setFormErrors({ ...formErrors, to: '' });
                          }}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${
                            formErrors.to ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.to && <p className="text-red-600 text-sm mt-2">{formErrors.to}</p>}
                      </div>

                      {/* Subject Field */}
                      <div>
                        <label className="block text-sm font-semibold text-emerald-900 mb-2">Subject</label>
                        <input
                          type="text"
                          placeholder="Email subject line"
                          value={formData.subject}
                          onChange={(e) => {
                            setFormData({ ...formData, subject: e.target.value });
                            if (formErrors.subject) setFormErrors({ ...formErrors, subject: '' });
                          }}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${
                            formErrors.subject ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.subject && <p className="text-red-600 text-sm mt-2">{formErrors.subject}</p>}
                      </div>

                      {/* Context Textarea */}
                      <div>
                        <label className="block text-sm font-semibold text-emerald-900 mb-2">Context</label>
                        <p className="text-sm text-emerald-700 mb-3">What should this email say? Be specific about tone and key points.</p>
                        <textarea
                          placeholder="Example: 'Friendly follow-up about the project deadline, acknowledge their concerns about timeline...'"
                          value={formData.context}
                          onChange={(e) => {
                            setFormData({ ...formData, context: e.target.value });
                            if (formErrors.context) setFormErrors({ ...formErrors, context: '' });
                          }}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none ${
                            formErrors.context ? 'border-red-300' : 'border-gray-300'
                          }`}
                          rows="6"
                        />
                        {formErrors.context && <p className="text-red-600 text-sm mt-2">{formErrors.context}</p>}
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-emerald-900 mb-3">Attachments <span className="text-emerald-600 font-normal">(optional)</span></label>
                        <label className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-emerald-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition duration-200 bg-emerald-50 bg-opacity-40">
                          <div className="text-center">
                            <p className="text-emerald-900 font-semibold">Click to upload or drag files here</p>
                            <p className="text-sm text-emerald-700 mt-1">Max 10MB per file, 5 files total</p>
                          </div>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>

                        {attachments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {attachments.map((file, i) => (
                              <div key={i} className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                <span className="text-sm text-emerald-900 font-medium">📎 {file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(i)}
                                  className="text-red-600 hover:text-red-700 font-bold text-lg"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-4 pt-6">
                        <button
                          type="submit"
                          disabled={drafting}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
                        >
                          {drafting ? '⏳ Generating...' : '✨ Generate Draft'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setFormData({ to: '', subject: '', context: '' });
                            setAttachments([]);
                            setFormErrors({});
                          }}
                          className="px-6 py-3 text-emerald-700 font-semibold hover:bg-emerald-100 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            ) : (
              /* Draft Review & Approval */
              <div className="bg-white rounded-xl shadow-lg p-8 border border-emerald-100">
                <h2 className="text-2xl font-bold text-emerald-900 mb-8">Review & Approve</h2>

                {/* Transparency Badge */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-lg p-6 mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xl font-bold">🤖</div>
                    <div className="flex-1">
                      <p className="font-bold text-emerald-900 mb-1">AI-Generated Draft</p>
                      <p className="text-sm text-emerald-800 mb-2">This email was drafted by <span className="font-mono bg-white px-2 py-1 rounded">{pendingDraft.badge?.model || 'GPT-4'}</span></p>
                      <p className="text-xs text-emerald-700 font-semibold">✓ Please review carefully before sending. You remain responsible for all content.</p>
                    </div>
                  </div>
                </div>

                {/* Bias Warning */}
                {hasBiasWarning && (
                  <div className={`border-l-4 rounded-lg p-6 mb-6 ${
                    pendingDraft.biasScore > 7 ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <div className="flex gap-4">
                      <span className="text-2xl flex-shrink-0">{pendingDraft.biasScore > 7 ? '🚫' : '⚠️'}</span>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${pendingDraft.biasScore > 7 ? 'text-red-900' : 'text-yellow-900'}`}>
                          Potential bias detected (Score: {pendingDraft.biasScore}/10)
                        </p>
                        {pendingDraft.biasFlags && pendingDraft.biasFlags.length > 0 && (
                          <div className="mt-3">
                            <p className={`text-xs font-semibold mb-2 ${pendingDraft.biasScore > 7 ? 'text-red-900' : 'text-yellow-900'}`}>Flagged phrases:</p>
                            <ul className="text-xs space-y-1">
                              {pendingDraft.biasFlags.slice(0, 3).map((flag, i) => (
                                <li key={i} className={pendingDraft.biasScore > 7 ? 'text-red-800' : 'text-yellow-800'}>• {flag}</li>
                              ))}
                              {pendingDraft.biasFlags.length > 3 && (
                                <li className={pendingDraft.biasScore > 7 ? 'text-red-800' : 'text-yellow-800'}>• ...and {pendingDraft.biasFlags.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {!biasOverride && (
                          <button
                            onClick={() => {
                              setBiasOverride(true);
                              handleSendDraft(true);
                            }}
                            className={`mt-4 px-4 py-2 rounded font-semibold text-sm text-white ${
                              pendingDraft.biasScore > 7
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                          >
                            Send Anyway (Override)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Carbon Impact */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-lg p-6 mb-6">
                  <p className="font-bold text-emerald-900 mb-4">🌍 Carbon Impact</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded p-4">
                      <p className="text-xs text-gray-600">Emissions</p>
                      <p className="text-lg font-bold text-emerald-900 mt-1">{pendingDraft.carbonEmissions?.total?.toFixed(3)}g CO₂e</p>
                    </div>
                    <div className="bg-white rounded p-4">
                      <p className="text-xs text-gray-600">Offset</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">{pendingDraft.carbonEmissions?.offset?.toFixed(3)}g</p>
                    </div>
                    <div className="bg-white rounded p-4">
                      <p className="text-xs text-gray-600">Net Impact</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">
                        -{(pendingDraft.carbonEmissions?.offset - pendingDraft.carbonEmissions?.total)?.toFixed(3)}g
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-800 mt-4">✓ We offset 2x your email's emissions through verified carbon credits.</p>
                </div>

                {/* Email Preview */}
                <div className="bg-gray-50 rounded-lg p-8 mb-8 border border-gray-200">
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">To</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{pendingDraft.to}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Subject</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{pendingDraft.subject}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-300 pt-6">
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {pendingDraft.draftText}
                    </div>
                  </div>

                  {pendingDraft.attachments && pendingDraft.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-300">
                      <p className="text-xs text-gray-600 font-semibold mb-2">ATTACHMENTS</p>
                      <div className="space-y-1">
                        {pendingDraft.attachments.map((att, i) => (
                          <p key={i} className="text-sm text-gray-700">
                            📎 {att.filename} ({(att.size / 1024).toFixed(1)} KB)
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {hasBiasWarning && biasOverride ? (
                    <button
                      onClick={() => handleSendDraft(true)}
                      disabled={sending}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition"
                    >
                      {sending ? '⏳ Sending...' : '📤 Send (Override Active)'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendDraft(false)}
                      disabled={sending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
                    >
                      {sending ? '⏳ Sending...' : '✓ Send Email'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setDraft(null);
                      setBiasOverride(false);
                    }}
                    className="px-6 py-3 text-emerald-700 font-semibold hover:bg-emerald-100 rounded-lg transition"
                  >
                    Back
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                  You are responsible for all content sent. Please review carefully.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Draft History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-emerald-100">
              <h3 className="text-xl font-bold text-emerald-900 mb-6">📋 Recent Drafts</h3>

              {allDrafts.length === 0 ? (
                <p className="text-emerald-700 text-center py-12 text-sm">
                  No drafts yet. Create your first one to get started!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allDrafts.slice(0, 10).map(d => (
                    <div
                      key={d.id}
                      className={`p-4 rounded-lg border transition ${
                        d.status === 'sent'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 truncate text-sm">{d.subject}</p>
                      <p className="text-xs text-gray-600 truncate mt-1">To: {d.to}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs font-bold ${
                          d.status === 'sent'
                            ? 'text-emerald-700'
                            : 'text-yellow-700'
                        }`}>
                          {d.status === 'sent' ? '✓ Sent' : '⏳ Draft'}
                        </span>
                        {d.carbonEmissions && (
                          <span className="text-xs text-gray-600">{d.carbonEmissions.total?.toFixed(2)}g</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
