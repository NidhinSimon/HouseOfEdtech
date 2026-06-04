document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://house-of-edtech-one.vercel.app';
  // const API_BASE =  'http://localhost:3000';
  const CONNECT_PAGE = `${API_BASE}/dashboard/connect-extension`;

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabViews = document.querySelectorAll('.tab-view');

  const loadingScraper = document.getElementById('loading-scraper');
  const noJobDetected = document.getElementById('no-job-detected');
  const scraperForm = document.getElementById('scraper-form');
  const manualFillBtn = document.getElementById('manual-fill-btn');
  const jdWordCount = document.getElementById('jd-word-count');
  const jobTitleInput = document.getElementById('job-title');
  const jobCompanyInput = document.getElementById('job-company');
  const jobLocationInput = document.getElementById('job-location');
  const jobWorkmodeInput = document.getElementById('job-workmode');
  const jobExperienceInput = document.getElementById('job-experience');
  const jobUrlInput = document.getElementById('job-url');
  const jobDescriptionTextarea = document.getElementById('job-description');
  const jobNotesInput = document.getElementById('job-notes');
  const saveStatus = document.getElementById('save-status');

  const profName = document.getElementById('prof-name');
  const profEmail = document.getElementById('prof-email');
  const profPhone = document.getElementById('prof-phone');
  const profSalary = document.getElementById('prof-salary');
  const profLinkedin = document.getElementById('prof-linkedin');
  const profGithub = document.getElementById('prof-github');
  const profRelocate = document.getElementById('prof-relocate');
  const profNotice = document.getElementById('prof-notice');
  const profSponsor = document.getElementById('prof-sponsor');
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const profileStatus = document.getElementById('profile-status');

  const connectionStatus = document.getElementById('connection-status');
  const connectionDot = document.querySelector('.status-indicator .dot');
  const authLabel = document.getElementById('auth-label');
  const authSublabel = document.getElementById('auth-sublabel');
  const authIcon = document.getElementById('auth-icon');
  const tokenPayloadInput = document.getElementById('token-payload-input');
  const importTokenBtn = document.getElementById('import-token-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const importStatus = document.getElementById('import-status');
  const connectPageLink = document.getElementById('connect-page-link');

  if (connectPageLink) {
    connectPageLink.href = CONNECT_PAGE;
  }

  checkServerConnection();
  loadAuthState();
  requestJobScraping();
  loadProfile();

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((item) => item.classList.remove('active'));
      tabViews.forEach((view) => view.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
    });
  });

  function checkServerConnection() {
    fetch(`${API_BASE}/api/applications`, { method: 'OPTIONS' })
      .then((response) => {
        if (response.ok || response.status === 204) {
          connectionStatus.textContent = 'Dashboard Connected';
          connectionDot.style.backgroundColor = '#10B981';
          connectionDot.classList.add('pulse');
          return;
        }

        throw new Error('Server unavailable');
      })
      .catch(() => {
        connectionStatus.textContent = 'App Offline';
        connectionDot.style.backgroundColor = '#EF4444';
        connectionDot.classList.remove('pulse');
      });
  }

  function loadAuthState() {
    chrome.storage.local.get(['extensionToken'], (data) => {
      // setAuthUI(Boolean(data.extensionToken));
    });
  }

  // function setAuthUI(connected) {
  //   if (connected) {
  //     authIcon.textContent = 'OK';
  //     authLabel.textContent = 'Account Connected';
  //     authSublabel.textContent = 'Quick Save is active and will save jobs to your account.';
  //     authLabel.style.color = '#34D399';
  //     return;
  //   }

  //   authIcon.textContent = 'LOCK';
  //   authLabel.textContent = 'Not Connected';
  //   authSublabel.textContent = 'Paste your dashboard extension token to enable Quick Save.';
  //   authLabel.style.color = '#fff';
  // }

  importTokenBtn.addEventListener('click', () => {
    const raw = (tokenPayloadInput.value || '').trim();
    if (!raw) {
      showImportStatus('error', 'Paste the extension token from the dashboard first.');
      return;
    }

    let extensionToken = raw;
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        extensionToken = parsed.extensionToken || parsed.token || '';
      } catch {
        showImportStatus('error', 'Invalid JSON. Paste the token directly from the dashboard.');
        return;
      }
    }

    extensionToken = extensionToken.trim();
    if (!extensionToken.startsWith('aw_ext_')) {
      showImportStatus('error', 'Invalid token. It should start with aw_ext_.');
      return;
    }

    chrome.runtime.sendMessage({
      type: 'SET_EXTENSION_TOKEN',
      extensionToken,
      apiBaseUrl: API_BASE,
    }, (response) => {
      if (response && response.success) {
        tokenPayloadInput.value = '';
        // setAuthUI(true);
        showImportStatus('success', 'Account connected. Quick Save is now active.');
      } else {
        showImportStatus('error', response?.error || 'Failed to store token. Try again.');
      }
    });
  });

  disconnectBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['extensionToken', 'apiBaseUrl', 'accessToken', 'refreshToken', 'supabaseUrl', 'supabaseAnonKey'], () => {
      // setAuthUI(false);
      showImportStatus('success', 'Disconnected. Your local extension token has been cleared.');
    });
  });

  function showImportStatus(type, message) {
    importStatus.classList.remove('hidden', 'success', 'error');
    importStatus.classList.add(type);
    importStatus.textContent = message;
    setTimeout(() => importStatus.classList.add('hidden'), 5000);
  }

  jobDescriptionTextarea.addEventListener('input', () => {
    const text = jobDescriptionTextarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    jdWordCount.textContent = `${words} words`;
  });

  function requestJobScraping() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        showManualEntry();
        return;
      }

      const activeTab = tabs[0];
      const backupTimeout = setTimeout(() => showManualEntry(), 1200);

      chrome.tabs.sendMessage(activeTab.id, { action: 'extractJobData' }, (response) => {
        clearTimeout(backupTimeout);

        if (chrome.runtime.lastError || !response || !response.success) {
          showManualEntry();
          return;
        }

        loadingScraper.classList.add('hidden');
        noJobDetected.classList.add('hidden');
        scraperForm.classList.remove('hidden');

        jobTitleInput.value = response.data.jobTitle || '';
        jobCompanyInput.value = response.data.company || '';
        jobLocationInput.value = response.data.location || '';
        jobUrlInput.value = response.data.jobUrl || activeTab.url;
        jobDescriptionTextarea.value = response.data.jobDescription || '';

        if (response.data.workMode) jobWorkmodeInput.value = response.data.workMode;
        if (response.data.experience) jobExperienceInput.value = response.data.experience;

        jobDescriptionTextarea.dispatchEvent(new Event('input'));
      });
    });
  }

  function showManualEntry() {
    loadingScraper.classList.add('hidden');
    noJobDetected.classList.remove('hidden');
    scraperForm.classList.add('hidden');
  }

  manualFillBtn.addEventListener('click', () => {
    noJobDetected.classList.add('hidden');
    scraperForm.classList.remove('hidden');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) jobUrlInput.value = tabs[0].url;
    });
  });

  scraperForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const payload = {
      company: jobCompanyInput.value.trim(),
      jobTitle: jobTitleInput.value.trim(),
      jobUrl: jobUrlInput.value.trim(),
      workMode: jobWorkmodeInput.value,
      experience: jobExperienceInput.value,
      jobDescription: jobDescriptionTextarea.value.trim(),
      notes: jobNotesInput.value.trim(),
      status: 'saved',
      origin: 'extension',
    };

    saveStatus.classList.remove('hidden', 'success', 'error');
    saveStatus.textContent = 'Authenticating...';

    chrome.storage.local.get(['extensionToken'], (authData) => {
      const { extensionToken } = authData;

      if (!extensionToken) {
        saveStatus.classList.add('error');
        saveStatus.textContent = 'Not connected. Open the Account tab to paste your dashboard token.';
        return;
      }

      saveStatus.textContent = 'Saving application to Applywise...';
      executeSave(extensionToken, payload);
    });
  });

  function executeSave(token, payload) {
    fetch(`${API_BASE}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();

        if (res.ok) {
          saveStatus.classList.add('success');
          saveStatus.textContent = 'Saved successfully to Applywise.';
          setTimeout(() => saveStatus.classList.add('hidden'), 3500);
          return;
        }

        if (res.status === 401) {
          saveStatus.classList.add('error');
          saveStatus.textContent = 'Token invalid or revoked. Paste a new dashboard token.';
          switchToAccountTab();
          return;
        }

        throw new Error(data.error || `Server returned ${res.status}`);
      })
      .catch((err) => {
        saveStatus.classList.add('error');
        saveStatus.textContent = err.message || 'Network error. Applywise server may be offline.';
      });
  }

  function switchToAccountTab() {
    tabButtons.forEach((button) => button.classList.remove('active'));
    tabViews.forEach((view) => view.classList.remove('active'));
    const accountBtn = document.querySelector('[data-tab="tab-account"]');
    const accountView = document.getElementById('tab-account');
    if (accountBtn) accountBtn.classList.add('active');
    if (accountView) accountView.classList.add('active');
  }

  function loadProfile() {
    const keys = ['name', 'email', 'phone', 'expectedSalary', 'linkedin', 'github', 'relocate', 'noticePeriod', 'sponsor'];

    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(keys, (res) => {
        if (res.name) profName.value = res.name;
        if (res.email) profEmail.value = res.email;
        if (res.phone) profPhone.value = res.phone;
        if (res.expectedSalary) profSalary.value = res.expectedSalary;
        if (res.linkedin) profLinkedin.value = res.linkedin;
        if (res.github) profGithub.value = res.github;
        if (res.relocate) profRelocate.value = res.relocate;
        if (res.noticePeriod) profNotice.value = res.noticePeriod;
        if (res.sponsor) profSponsor.value = res.sponsor;
      });
      return;
    }

    const localProfile = JSON.parse(localStorage.getItem('applywise_candidate_profile') || '{}');
    if (localProfile.name) profName.value = localProfile.name;
    if (localProfile.email) profEmail.value = localProfile.email;
  }

  saveProfileBtn.addEventListener('click', () => {
    const profile = {
      name: profName.value.trim(),
      email: profEmail.value.trim(),
      phone: profPhone.value.trim(),
      expectedSalary: profSalary.value.trim(),
      linkedin: profLinkedin.value.trim(),
      github: profGithub.value.trim(),
      relocate: profRelocate.value,
      noticePeriod: profNotice.value,
      sponsor: profSponsor.value,
    };

    profileStatus.classList.remove('hidden', 'success', 'error');
    profileStatus.textContent = 'Saving profile details...';

    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(profile, () => {
        profileStatus.classList.add('success');
        profileStatus.textContent = 'Profile configuration updated.';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: 'profileUpdated', profile });
        });

        setTimeout(() => profileStatus.classList.add('hidden'), 3000);
      });
      return;
    }

    localStorage.setItem('applywise_candidate_profile', JSON.stringify(profile));
    profileStatus.classList.add('success');
    profileStatus.textContent = 'Profile saved to browser localStorage.';
  });
});
