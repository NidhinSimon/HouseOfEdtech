// Applywise Form Autofill Heuristics Injection Script

(function() {
  let profileData = null;

  // 1. Fetch saved profile data from storage
  function fetchProfile(callback) {
    const keys = [
      'name', 'email', 'phone', 'expectedSalary', 
      'linkedin', 'github', 'relocate', 'noticePeriod', 'sponsor'
    ];
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(keys, (res) => {
        profileData = res;
        if (callback) callback(res);
      });
    }
  }

  // 2. Map stored fields to form elements
  function triggerAutofill() {
    if (!profileData) {
      fetchProfile(() => {
        if (profileData) fillFormElements();
      });
    } else {
      fillFormElements();
    }
  }

  function fillFormElements() {
    const inputs = document.querySelectorAll('input, select, textarea');
    let filledCount = 0;

    inputs.forEach(el => {
      const name = (el.name || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
      const labelText = getLabelText(el).toLowerCase();

      // Heuristic field check
      let valueToFill = null;

      // Email field
      if (el.type === 'email' || name.includes('email') || id.includes('email') || placeholder.includes('email')) {
        valueToFill = profileData.email;
      }
      // Phone / Tel
      else if (el.type === 'tel' || name.includes('phone') || id.includes('phone') || name.includes('mobile') || placeholder.includes('phone')) {
        valueToFill = profileData.phone;
      }
      // LinkedIn
      else if (name.includes('linkedin') || id.includes('linkedin') || placeholder.includes('linkedin')) {
        valueToFill = profileData.linkedin;
      }
      // GitHub / Portfolio
      else if (name.includes('github') || id.includes('github') || name.includes('portfolio') || placeholder.includes('github')) {
        valueToFill = profileData.github;
      }
      // Expected Salary / CTC
      else if (name.includes('salary') || id.includes('salary') || name.includes('ctc') || placeholder.includes('expected salary')) {
        valueToFill = profileData.expectedSalary;
      }
      // Full Name or split First/Last Names
      else if (name.includes('name') || id.includes('name') || placeholder.includes('name') || labelText.includes('name')) {
        if (name.includes('first') || id.includes('first') || placeholder.includes('first') || labelText.includes('first')) {
          valueToFill = profileData.name ? profileData.name.split(' ')[0] : '';
        } else if (name.includes('last') || id.includes('last') || placeholder.includes('last') || labelText.includes('last')) {
          const split = profileData.name ? profileData.name.split(' ') : [];
          valueToFill = split.length > 1 ? split.slice(1).join(' ') : '';
        } else {
          valueToFill = profileData.name;
        }
      }
      // Relocation queries
      else if (name.includes('relocat') || id.includes('relocat') || labelText.includes('relocat')) {
        if (el.tagName === 'SELECT') {
          selectMatchingOption(el, profileData.relocate);
          filledCount++;
          return;
        }
      }
      // Notice Period queries
      else if (name.includes('notice') || id.includes('notice') || labelText.includes('notice')) {
        if (el.tagName === 'SELECT') {
          selectMatchingOption(el, profileData.noticePeriod);
          filledCount++;
          return;
        }
      }
      // Visa / Sponsorship queries
      else if (name.includes('sponsor') || id.includes('sponsor') || name.includes('visa') || labelText.includes('visa') || labelText.includes('sponsor')) {
        if (el.tagName === 'SELECT') {
          selectMatchingOption(el, profileData.sponsor);
          filledCount++;
          return;
        }
      }

      // Populate text inputs
      if (valueToFill && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.type !== 'file') {
        el.value = valueToFill;
        
        // Dispatch synthetic browser events so React / Vue observes changes
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        filledCount++;
      }
    });

    // Provide visual confirmation toast
    showToast(filledCount > 0 ? `✨ Autofilled ${filledCount} fields successfully!` : 'No matchable fields detected.');
  }

  // Helper to find parent/associated label text
  function getLabelText(el) {
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) return label.innerText;
    }
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.innerText;
    
    // Check previous siblings
    const prev = el.previousElementSibling;
    if (prev && (prev.tagName === 'LABEL' || prev.className.includes('label'))) {
      return prev.innerText;
    }
    return '';
  }

  // Helper to match option tags inside select elements
  function selectMatchingOption(select, value) {
    if (!value) return;
    const options = select.options;
    const valLower = value.toLowerCase();
    for (let i = 0; i < options.length; i++) {
      const optText = options[i].text.toLowerCase();
      const optVal = options[i].value.toLowerCase();
      if (optText.includes(valLower) || optVal.includes(valLower) || valLower.includes(optText)) {
        select.selectedIndex = i;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  }

  // 3. Inject floating "Applywise Auto-fill" Badge in UI
  function injectFloatingBadge() {
    // Only inject if inputs or forms exist
    if (document.querySelectorAll('input').length < 3) return;
    if (document.getElementById('applywise-float-autofill')) return;

    const badge = document.createElement('div');
    badge.id = 'applywise-float-autofill';
    badge.innerHTML = `
      <div class="applywise-badge-inner">
        <span class="badge-logo">A</span>
        <span class="badge-text">Autofill Profile</span>
      </div>
    `;

    // Apply styles directly for extreme robustness
    Object.assign(badge.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '2147483647',
      backgroundColor: '#0F141E',
      border: '1px solid #F97316',
      borderRadius: '30px',
      padding: '8px 16px',
      color: '#FFFFFF',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25), 0 0 10px rgba(249, 115, 22, 0.15)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      alignHeight: 'center',
    });

    const inner = badge.querySelector('.applywise-badge-inner');
    Object.assign(inner.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });

    const logo = badge.querySelector('.badge-logo');
    Object.assign(logo.style, {
      background: 'linear-gradient(135deg, #F97316, #EA580C)',
      color: '#FFFFFF',
      width: '18px',
      height: '18px',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifycontent: 'center',
      fontSize: '11px',
      fontWeight: '800'
    });

    // Hover events
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'translateY(-2px) scale(1.03)';
      badge.style.boxShadow = '0 12px 30px rgba(249, 115, 22, 0.35), 0 0 15px rgba(249, 115, 22, 0.25)';
    });

    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'translateY(0) scale(1)';
      badge.style.boxShadow = '0 10px 25px rgba(249, 115, 22, 0.25), 0 0 10px rgba(249, 115, 22, 0.15)';
    });

    badge.addEventListener('click', () => {
      badge.style.transform = 'scale(0.97)';
      setTimeout(() => {
        badge.style.transform = 'translateY(-2px) scale(1.03)';
      }, 100);
      triggerAutofill();
    });

    document.body.appendChild(badge);
  }

  // Confirmation Toast
  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '80px',
      right: '24px',
      zIndex: '2147483647',
      backgroundColor: '#161D2B',
      border: '1px solid #202A3D',
      color: '#F97316',
      borderRadius: '8px',
      padding: '10px 18px',
      fontFamily: 'inherit',
      fontSize: '11px',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'opacity 0.3s ease',
      opacity: '0'
    });
    document.body.appendChild(toast);
    
    // Trigger transition
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Load storage keys on start & initialize badge placement
  fetchProfile();
  setTimeout(injectFloatingBadge, 1500);

  // Re-run check on profile changes
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'profileUpdated') {
      profileData = request.profile;
    }
  });

})();
