import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import {
  Button,
  Card,
  Input,
  TransparencyBadge,
  BiasWarning,
  CarbonImpact,
  Alert,
} from '../components';

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
      setError('Failed to load drafts');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <h1 className="text-2xl font-bold text-gray-900">Offlo</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Account active</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-smooth"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            title="Error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
        {success && (
          <Alert
            type="success"
            title="Success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        {/* Stats Row */}
        {carbonStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card variant="highlight">
              <div className="text-center">
                <p className="text-4xl font-bold text-emerald-600">
                  {carbonStats.emailsSent}
                </p>
                <p className="text-sm text-emerald-700 mt-1">Emails Sent</p>
              </div>
            </Card>
            <Card variant="highlight">
              <div className="text-center">
                <p className="text-4xl font-bold text-emerald-600">
                  {carbonStats.totalEmissions.toFixed(2)}g
                </p>
                <p className="text-sm text-emerald-700 mt-1">CO₂e Emissions</p>
              </div>
            </Card>
            <Card variant="highlight">
              <div className="text-center">
                <p className="text-4xl font-bold text-emerald-600">
                  {carbonStats.totalOffset.toFixed(2)}g
                </p>
                <p className="text-sm text-emerald-700 mt-1">Offset (2x)</p>
              </div>
            </Card>
          </div>
        )}

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Draft Creation */}
          <div className="lg:col-span-2">
            {!pendingDraft ? (
              <>
                {!showForm ? (
                  <Card variant="elevated">
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-6">Ready to draft an email?</p>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => setShowForm(true)}
                      >
                        ✏️ Create New Draft
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card variant="default">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Draft New Email
                    </h2>
                    <form onSubmit={handleDraftCreate} className="space-y-4">
                      <Input
                        type="email"
                        label="To"
                        placeholder="recipient@example.com"
                        value={formData.to}
                        onChange={(e) => {
                          setFormData({ ...formData, to: e.target.value });
                          if (formErrors.to) setFormErrors({ ...formErrors, to: '' });
                        }}
                        error={formErrors.to}
                        helperText="Email address of the recipient"
                      />

                      <Input
                        type="text"
                        label="Subject"
                        placeholder="Email subject line"
                        value={formData.subject}
                        onChange={(e) => {
                          setFormData({ ...formData, subject: e.target.value });
                          if (formErrors.subject) setFormErrors({ ...formErrors, subject: '' });
                        }}
                        error={formErrors.subject}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Context
                        </label>
                        <textarea
                          placeholder="What should this email say? Be specific about tone and key points."
                          value={formData.context}
                          onChange={(e) => {
                            setFormData({ ...formData, context: e.target.value });
                            if (formErrors.context) setFormErrors({ ...formErrors, context: '' });
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                          rows="5"
                        />
                        {formErrors.context && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.context}</p>
                        )}
                      </div>

                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attachments (Optional)
                        </label>
                        <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-smooth">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Click to upload or drag files</p>
                            <p className="text-xs text-gray-500">Max 10MB per file, 5 files total</p>
                          </div>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>

                        {attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {attachments.map((file, i) => (
                              <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                                <span className="text-sm text-gray-700">📎 {file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(i)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          isLoading={drafting}
                          className="flex-1"
                        >
                          {drafting ? 'Generating...' : 'Generate Draft'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="lg"
                          onClick={() => {
                            setShowForm(false);
                            setFormData({ to: '', subject: '', context: '' });
                            setAttachments([]);
                            setFormErrors({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
              </>
            ) : (
              /* Draft Display & Approval */
              <Card variant="elevated">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Review & Approve
                </h2>

                <TransparencyBadge
                  model={pendingDraft.badge?.model || 'GPT-4 Turbo'}
                  timestamp={pendingDraft.badge?.timestamp || new Date().toISOString()}
                />

                {hasBiasWarning && (
                  <BiasWarning
                    score={pendingDraft.biasScore}
                    flags={pendingDraft.biasFlags}
                    onOverride={() => {
                      setBiasOverride(true);
                      handleSendDraft(true);
                    }}
                  />
                )}

                <CarbonImpact carbonEmissions={pendingDraft.carbonEmissions} />

                {/* Email Preview */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">To</p>
                      <p className="font-medium text-gray-900">{pendingDraft.to}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Subject</p>
                      <p className="font-medium text-gray-900">{pendingDraft.subject}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {pendingDraft.draftText}
                    </div>
                  </div>

                  {pendingDraft.attachments && pendingDraft.attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Attachments:</p>
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
                <div className="flex gap-3">
                  {hasBiasWarning && biasOverride ? (
                    <Button
                      variant="danger"
                      size="lg"
                      isLoading={sending}
                      onClick={() => handleSendDraft(true)}
                      className="flex-1"
                    >
                      {sending ? 'Sending...' : 'Send (Override Active)'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={sending}
                      onClick={() => handleSendDraft(false)}
                      className="flex-1"
                    >
                      {sending ? 'Sending...' : '✓ Send Email'}
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      setDraft(null);
                      setBiasOverride(false);
                    }}
                  >
                    Back
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  You are responsible for all content sent. Please review carefully.
                </p>
              </Card>
            )}
          </div>

          {/* Right Column - Draft History */}
          <div className="lg:col-span-1">
            <Card variant="default">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📋 Recent Drafts
              </h3>

              {allDrafts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No drafts yet. Create your first one!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allDrafts.slice(0, 10).map(d => (
                    <div
                      key={d.id}
                      className={`p-3 rounded-lg border text-sm ${
                        d.status === 'sent'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <p className="font-medium text-gray-900 truncate">
                        {d.subject}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        To: {d.to}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-semibold ${
                          d.status === 'sent'
                            ? 'text-emerald-700'
                            : 'text-yellow-700'
                        }`}>
                          {d.status === 'sent' ? '✓ Sent' : '⏳ Draft'}
                        </span>
                        {d.carbonEmissions && (
                          <span className="text-xs text-gray-600">
                            {d.carbonEmissions.total.toFixed(2)}g CO₂
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
