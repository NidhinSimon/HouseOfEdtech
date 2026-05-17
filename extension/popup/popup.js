document.addEventListener('DOMContentLoaded', () => {
  // Tab Switcher Nodes
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabViews = document.querySelectorAll('.tab-view');

  // Scraper Nodes
  const loadingScraper = document.getElementById('loading-scraper');
  const noJobDetected = document.getElementById('no-job-detected');
  const scraperForm = document.getElementById('scraper-form');
  const manualFillBtn = document.getElementById('manual-fill-btn');
  const jdWordCount = document.getElementById('jd-word-count');

  // Input fields (Scraper)
  const jobTitleInput = document.getElementById('job-title');
  const jobCompanyInput = document.getElementById('job-company');
  const jobLocationInput = document.getElementById('job-location');
  const jobWorkmodeInput = document.getElementById('job-workmode');
  const jobExperienceInput = document.getElementById('job-experience');
  const jobUrlInput = document.getElementById('job-url');
  const jobDescriptionTextarea = document.getElementById('job-description');
  const jobNotesInput = document.getElementById('job-notes');
  const saveStatus = document.getElementById('save-status');

  // Input fields (Profile)
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

  // 1. Check local Next.js API server connection
  function checkServerConnection() {
    fetch('http://localhost:3000/api/applications')
      .then(response => {
        if (response.ok) {
          connectionStatus.textContent = 'Dashboard Connected';
          connectionDot.style.backgroundColor = '#10B981';
          connectionDot.classList.add('pulse');
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        connectionStatus.textContent = 'App Offline';
        connectionDot.style.backgroundColor = '#EF4444';
        connectionDot.classList.remove('pulse');
      });
  }
  checkServerConnection();

  // 2. Tab switcher interaction
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-tab');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // 3. Word counter for description textarea
  jobDescriptionTextarea.addEventListener('input', () => {
    const text = jobDescriptionTextarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    jdWordCount.textContent = `${words} words`;
  });

  // 4. Request Page scraping from content script
  function requestJobScraping() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return showManualEntry();

      const activeTab = tabs[0];
      
      // Inject standard fallbacks if content script isn't responsive
      const backupTimeout = setTimeout(() => {
        showManualEntry();
      }, 1000);

      chrome.tabs.sendMessage(activeTab.id, { action: 'extractJobData' }, (response) => {
        clearTimeout(backupTimeout);
        
        if (chrome.runtime.lastError || !response || !response.success) {
          showManualEntry();
          return;
        }

        // Successfully scraped job details
        loadingScraper.classList.add('hidden');
        noJobDetected.classList.add('hidden');
        scraperForm.classList.remove('hidden');

        jobTitleInput.value = response.data.jobTitle || '';
        jobCompanyInput.value = response.data.company || '';
        jobLocationInput.value = response.data.location || '';
        jobUrlInput.value = response.data.jobUrl || activeTab.url;
        jobDescriptionTextarea.value = response.data.jobDescription || '';
        
        if (response.data.workMode) {
          jobWorkmodeInput.value = response.data.workMode;
        }
        if (response.data.experience) {
          jobExperienceInput.value = response.data.experience;
        }

        // Trigger word counter check
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

  // Trigger scraper routine on open
  requestJobScraping();

  // 5. Submit Scraped Job to Local Server API
  scraperForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const payload = {
      company: jobCompanyInput.value.trim(),
      jobTitle: jobTitleInput.value.trim(),
      jobUrl: jobUrlInput.value.trim(),
      workMode: jobWorkmodeInput.value,
      experience: jobExperienceInput.value,
      jobDescription: jobDescriptionTextarea.value.trim(),
      notes: jobNotesInput.value.trim(),
      status: 'saved', // Extension entries default to 'saved' per specs
      origin: 'extension'
    };

    saveStatus.classList.remove('hidden', 'success', 'error');
    saveStatus.textContent = 'Saving application to Applywise...';

    fetch('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          saveStatus.classList.add('success');
          saveStatus.textContent = '✨ Saved successfully to Applywise!';
          setTimeout(() => {
            saveStatus.classList.add('hidden');
          }, 3000);
        } else {
          throw new Error(data.error || 'Failed to save job details');
        }
      })
      .catch((err) => {
        saveStatus.classList.add('error');
        saveStatus.textContent = err.message || 'Server Offline. Start Next.js dev server first.';
      });
  });

  // 6. Candidate Profile Autofill configuration (storage sync)
  function loadProfile() {
    const keys = [
      'name', 'email', 'phone', 'expectedSalary', 
      'linkedin', 'github', 'relocate', 'noticePeriod', 'sponsor'
    ];
    
    // Check if chrome.storage is supported
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
    } else {
      // Fallback for standard browser window debugging
      const localProfile = JSON.parse(localStorage.getItem('applywise_candidate_profile') || '{}');
      if (localProfile.name) profName.value = localProfile.name;
      if (localProfile.email) profEmail.value = localProfile.email;
    }
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
      sponsor: profSponsor.value
    };

    profileStatus.classList.remove('hidden', 'success', 'error');
    profileStatus.textContent = 'Saving profile details...';

    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(profile, () => {
        profileStatus.classList.add('success');
        profileStatus.textContent = '✨ Profile configuration updated!';
        
        // Notify active tab that the profile details changed
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'profileUpdated', profile });
          }
        });

        setTimeout(() => {
          profileStatus.classList.add('hidden');
        }, 3000);
      });
    } else {
      localStorage.setItem('applywise_candidate_profile', JSON.stringify(profile));
      profileStatus.classList.add('success');
      profileStatus.textContent = '✨ Profile saved to browser localstorage!';
    }
  });

  // Load profile settings on start
  loadProfile();
});
