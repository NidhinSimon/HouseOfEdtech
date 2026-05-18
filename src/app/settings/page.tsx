'use client';

import { Topbar } from '@/components/Topbar';
import { useState, useEffect, useRef } from 'react';
import { 
  User, FileText, Upload, Save, CheckCircle2, 
  Sparkles, X, Key, ShieldCheck, Mail
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast, { Toaster } from 'react-hot-toast';
import { useFileUpload } from '@/hooks/useFileUpload';

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // User Profile States
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Resume States
  const { file, fileText, dragging, error: fileError, dragProps, processFile, reset, setFile, setFileText } = useFileUpload();
  const [defaultResumeName, setDefaultResumeName] = useState('');
  const [defaultResumeText, setDefaultResumeText] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Profile and Default Resume on Mount
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to view settings');
          return;
        }

        setUserId(user.id);
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
        setAvatarUrl(user.user_metadata?.avatar_url || '');

        // 1. Attempt to fetch from Supabase public.profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('resume_text, resume_filename, full_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          
          if (profile.resume_text) {
            setDefaultResumeText(profile.resume_text);
            setDefaultResumeName(profile.resume_filename || 'Default_Resume.pdf');
            // Populate file upload hook state for consistency
            setFileText(profile.resume_text);
            setFile({ name: profile.resume_filename || 'Default_Resume.pdf', size: profile.resume_text.length } as File);
          }
        }

        // 2. LocalStorage Fallback (Sync Cache check)
        const localResumeText = localStorage.getItem(`applywise_default_resume_text_${user.id}`);
        const localResumeName = localStorage.getItem(`applywise_default_resume_name_${user.id}`);
        
        if (localResumeText && !defaultResumeText) {
          setDefaultResumeText(localResumeText);
          setDefaultResumeName(localResumeName || 'Default_Resume.pdf');
          setFileText(localResumeText);
          setFile({ name: localResumeName || 'Default_Resume.pdf', size: localResumeText.length } as File);
        }
      } catch (err) {
        console.error('Error fetching settings details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, setFile, setFileText, defaultResumeText]);

  // Handle Save Profile & Default Resume
  const handleSaveSettings = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      const activeResumeText = fileText || defaultResumeText;
      const activeResumeName = file ? file.name : defaultResumeName;

      // 1. Save to Client LocalStorage
      localStorage.setItem(`applywise_default_resume_text_${userId}`, activeResumeText);
      localStorage.setItem(`applywise_default_resume_name_${userId}`, activeResumeName);

      // 2. Save to Supabase Profiles (Attempt with graceful schema failure catch)
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          updated_at: new Date().toISOString(),
          resume_text: activeResumeText,
          resume_filename: activeResumeName,
        });

      if (error) {
        console.warn('Supabase profile save error, using robust LocalStorage fallback:', error);
        toast.success('Profile settings updated successfully (local sync active)!');
      } else {
        toast.success('Profile settings and default resume saved successfully!');
      }

      setDefaultResumeText(activeResumeText);
      setDefaultResumeName(activeResumeName);
      setIsEditingText(false);
    } catch (err) {
      toast.error('An unexpected error occurred while saving profile settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Process manual upload from choose button
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // Remove uploaded resume
  const handleRemoveResume = () => {
    reset();
    setDefaultResumeText('');
    setDefaultResumeName('');
    if (userId) {
      localStorage.removeItem(`applywise_default_resume_text_${userId}`);
      localStorage.removeItem(`applywise_default_resume_name_${userId}`);
    }
  };

  return (
    <>
      <Topbar />
      <Toaster position="top-right" reverseOrder={false} />

      <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={14} color="#F97316" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.1em', textTransform: 'uppercase' }}>User Space</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Settings & Profile</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configure your professional profile and default resume to analyze job openings instantly.
          </p>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '80px 32px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(249,115,22,0.2)', borderTop: '3px solid #F97316', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Retrieving profile data...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Left Column: Account Details & Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Account Card */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <User size={15} color="#F97316" /> Account Profile
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={avatarUrl} 
                      alt="Google Profile" 
                      style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--border-color)' }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 700 }}>
                      {fullName.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{fullName || 'Applywise User'}</div>
                    <span style={{ fontSize: '11px', color: '#34D399', background: 'rgba(52,211,153,0.08)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                      Google Authenticated
                    </span>
                  </div>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Full Name"
                      style={{ width: '100%', background: 'var(--bg-card-elevated)', border: '1px solid var(--border-color)', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Address
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '9px', padding: '10px 12px' }}>
                      <Mail size={14} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                      <input 
                        type="email" 
                        value={email}
                        disabled
                        style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--text-secondary)', width: '100%', cursor: 'not-allowed', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Feature Tips */}
              <div className="card" style={{ padding: '20px', background: 'rgba(249,115,22,0.03)', border: '1px solid rgba(249,115,22,0.1)' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#F97316', margin: '0 0 10px 0' }}>
                  <Sparkles size={13} /> Zero-Friction Analysis
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  By saving a **Default Resume**, Applywise will pre-populate your resume automatically whenever you optimize a new role or open the Resume Analyzer. You can always override it temporarily if a specific job requires a tailored approach.
                </p>
              </div>

            </div>

            {/* Right Column: Default Resume Upload & Manage */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <FileText size={15} color="#F97316" /> Default Resume
              </h3>

              {/* Upload & Setup Zone */}
              {!(file || defaultResumeText) ? (
                <div
                  {...dragProps}
                  style={{ border: `2px dashed ${dragging ? '#F97316' : 'var(--border-color)'}`, borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(249,115,22,0.04)' : 'var(--bg-card-elevated)', transition: 'all 0.2s ease', marginBottom: '20px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept=".pdf,.txt,.doc,.docx" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#F97316' }}>
                    <Upload size={18} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>Upload your primary resume</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supports PDF, TXT, DOCX files</div>
                  <button style={{ marginTop: '14px', padding: '7px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                    Select File
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  
                  {/* File Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
                      <FileText size={15} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {file ? file.name : defaultResumeName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#34D399', marginTop: '2px' }}>
                        {fileText || defaultResumeText ? `${(fileText || defaultResumeText).length.toLocaleString()} characters extracted` : 'Text parsed successfully'}
                      </div>
                    </div>
                    <button 
                      onClick={handleRemoveResume} 
                      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                      title="Delete Default Resume"
                    >
                      <X size={14} className="hover-orange" />
                    </button>
                  </div>

                  {/* Resume Content Preview */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Extracted Text Preview
                      </span>
                      <button 
                        onClick={() => setIsEditingText(!isEditingText)}
                        style={{ fontSize: '11px', fontWeight: 600, color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {isEditingText ? 'Done Reviewing' : 'Edit Text'}
                      </button>
                    </div>

                    <textarea
                      value={fileText || defaultResumeText}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (file) setFileText(val);
                        setDefaultResumeText(val);
                      }}
                      disabled={!isEditingText}
                      rows={10}
                      style={{ width: '100%', background: 'var(--bg-card-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', cursor: isEditingText ? 'text' : 'default' }}
                    />
                  </div>
                </div>
              )}

              {fileError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '12px', color: '#F87171', marginBottom: '20px' }}>
                  {fileError}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                style={{ width: '100%', padding: '12px', background: saving ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {saving ? (
                  <>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Saving Changes...
                  </>
                ) : (
                  <><Save size={14} /> Save Profile & Resume</>
                )}
              </button>

            </div>

          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hover-orange:hover { color: #F97316 !important; }
      `}</style>
    </>
  );
}
