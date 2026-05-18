// Applywise Quick Save Card Selector and Mutation Observer Injection

(function() {
  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function normalizeCompareText(value) {
    return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function looksLikeSameJob(expectedTitle, expectedCompany, panelTitle, panelCompany) {
    const normalizedExpectedTitle = normalizeCompareText(expectedTitle);
    const normalizedPanelTitle = normalizeCompareText(panelTitle);

    if (!normalizedExpectedTitle || !normalizedPanelTitle) {
      return false;
    }

    const titleMatches =
      normalizedExpectedTitle === normalizedPanelTitle ||
      normalizedExpectedTitle.includes(normalizedPanelTitle) ||
      normalizedPanelTitle.includes(normalizedExpectedTitle);

    const normalizedExpectedCompany = normalizeCompareText(expectedCompany);
    const normalizedPanelCompany = normalizeCompareText(panelCompany);
    const companyMatches = !normalizedExpectedCompany || !normalizedPanelCompany
      ? true
      : normalizedExpectedCompany === normalizedPanelCompany ||
        normalizedExpectedCompany.includes(normalizedPanelCompany) ||
        normalizedPanelCompany.includes(normalizedExpectedCompany);

    return titleMatches && companyMatches;
  }

  function extractLinkedInDescription(card, jobTitle, company) {
    const panelTitleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24');
    const panelCompanyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name a');
    const panelDescEl = document.querySelector('#job-details, .jobs-description__content, .jobs-box__html-content, .show-more-less-html__markup, .description__text');

    if (
      panelTitleEl &&
      panelDescEl &&
      looksLikeSameJob(jobTitle, company, panelTitleEl.textContent, panelCompanyEl ? panelCompanyEl.textContent : '')
    ) {
      return cleanText(panelDescEl.innerText || panelDescEl.textContent);
    }

    const snippetNodes = card.querySelectorAll(
      '.job-card-list__insight, .job-card-container__footer-item, [class*="description-snippet"], [class*="insight"]'
    );

    return cleanText(
      Array.from(snippetNodes)
        .map((node) => cleanText(node.textContent))
        .filter(Boolean)
        .join(' ')
    );
  }

  function extractIndeedDescription(card, panel, jobTitle, company) {
    const panelTitleEl = panel
      ? panel.querySelector('h1.jobsearch-JobInfoHeader-title, [class*="JobInfoHeader-title"], h1')
      : null;
    const panelCompanyEl = panel
      ? panel.querySelector('[data-company-name="true"], a[class*="CompanyPageLink"], [class*="InlineCompanyRating"] a, [class*="InlineCompanyRating"] span')
      : null;
    const panelDescEl = panel
      ? panel.querySelector('#jobDescriptionText, [class*="jobDescriptionText"], [data-testid="jobsearch-JobComponent-description"]')
      : null;

    if (
      panelTitleEl &&
      panelDescEl &&
      looksLikeSameJob(jobTitle, company, panelTitleEl.textContent, panelCompanyEl ? panelCompanyEl.textContent : '')
    ) {
      return cleanText(panelDescEl.innerText || panelDescEl.textContent);
    }

    const cardSnippet = card.querySelector('.job-snippet, [data-testid="text-snippet"], [class*="job-snippet"]');
    return cleanText(cardSnippet ? (cardSnippet.innerText || cardSnippet.textContent) : '');
  }
  
  // Inject save buttons beside job cards
  function injectQuickSaveButtons() {
    const url = window.location.href;
    
    if (url.includes('linkedin.com')) {
      // LinkedIn job listing items
      const cards = document.querySelectorAll('.jobs-search-results__list-item:not([data-applywise-injected]), .jobs-search-two-pane__job-card-container:not([data-applywise-injected])');
      cards.forEach(card => {
        card.setAttribute('data-applywise-injected', 'true');
        
        // Find suitable placement inside card (e.g., header actions or bottom actions)
        const placement = card.querySelector('.job-card-container__action-bar, .jobs-search-results__list-item-status, .job-card-list__footer-wrapper');
        if (placement) {
          const button = createSaveButton(card, 'linkedin');
          placement.appendChild(button);
        } else {
          // Fallback placement (at the bottom of the card block)
          const button = createSaveButton(card, 'linkedin');
          button.style.margin = '8px 16px';
          card.appendChild(button);
        }
      });
    } else if (url.includes('indeed.com')) {
      // Only target the outer beacon wrapper — td.resultContent is nested inside it
      const cards = document.querySelectorAll('.job_seen_beacon:not([data-applywise-injected])');
      cards.forEach(card => {
        card.setAttribute('data-applywise-injected', 'true');
        const button = createSaveButton(card, 'indeed');
        button.style.margin = '4px 0 10px 0';
        // Append to the td.resultContent inside the card for correct visual placement
        const inner = card.querySelector('td.resultContent') || card;
        inner.appendChild(button);
      });
    }
  }

  // Create customized inline button element
  function createSaveButton(card, site) {
    const button = document.createElement('button');
    button.className = 'applywise-quicksave-btn';
    button.innerHTML = '<span>✨ Quick Save</span>';
    
    // Apply clean embedded CSS rules directly
    Object.assign(button.style, {
      background: 'rgba(249, 115, 22, 0.1)',
      border: '1px solid rgba(249, 115, 22, 0.25)',
      color: '#F97316',
      borderRadius: '6px',
      padding: '4px 10px',
      fontSize: '11px',
      fontWeight: '700',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: '99',
    });

    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(135deg, #F97316, #EA580C)';
      button.style.color = '#FFFFFF';
      button.style.transform = 'scale(1.02)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(249, 115, 22, 0.1)';
      button.style.color = '#F97316';
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      triggerCardSave(card, button, site);
    });

    return button;
  }

  // Scrape specific details from a single card container
  function triggerCardSave(card, button, site) {
    let jobTitle = 'Software Engineer';
    let company = 'Tech Company';
    let jobUrl = window.location.href;
    let jobLocation = '';
    let jobDescription = '';

    if (site === 'linkedin') {
      const titleEl = card.querySelector('.job-card-list__title, [class*="job-card-list__title"]');
      if (titleEl) {
        jobTitle = titleEl.textContent.trim();
        // Extract link if exists
        const link = titleEl.closest('a') || card.querySelector('a.job-card-container__link');
        if (link) jobUrl = link.href.split('?')[0]; // clean tracking queries
      }

      const compEl = card.querySelector('.job-card-container__primary-description, [class*="company-name"]');
      if (compEl) company = compEl.textContent.trim().split('•')[0].trim();

      const locEl = card.querySelector('.job-card-container__metadata-item, [class*="metadata-item"]');
      if (locEl) jobLocation = locEl.textContent.trim();

      jobDescription = extractLinkedInDescription(card, jobTitle, company);
    } 
    else if (site === 'indeed') {
      // ── 1. Try the right-side detail panel first (most reliable) ────────────
      // This panel is visible when a card is clicked/hovered on the search page
      const panel =
        document.querySelector('#mosaic-jobDetailsPane') ||
        document.querySelector('[class*="jobDetailsPane"]') ||
        document.querySelector('.jobsearch-ViewJobLayout--embedded') ||
        document.querySelector('[data-testid="jobsearch-ViewJobLayout"]');

      if (panel) {
        const panelTitle = panel.querySelector('h1.jobsearch-JobInfoHeader-title, [class*="JobInfoHeader-title"], h1');
        if (panelTitle) jobTitle = panelTitle.innerText.trim();

        const panelComp = panel.querySelector('[data-company-name="true"], a[class*="CompanyPageLink"], [class*="InlineCompanyRating"] a, [class*="InlineCompanyRating"] span');
        if (panelComp) company = panelComp.innerText.trim();

        const panelLoc = panel.querySelector('[data-testid="job-location"], #jobLocationSection, [class*="JobInfoHeader-subtitle"] div, [class*="jobLocation"]');
        if (panelLoc) jobLocation = panelLoc.innerText.trim();

        const titleLink = card.querySelector('h2.jobTitle a, [class*="jobTitle"] a');
        if (titleLink) jobUrl = titleLink.href;
      }

      // ── 2. Fall back to card-level selectors if panel data is missing ────────
      if (!jobTitle || jobTitle === 'Software Engineer') {
        const titleEl = card.querySelector('h2.jobTitle a, [class*="jobTitle"] a');
        if (titleEl) {
          jobTitle = titleEl.innerText.trim();
          jobUrl = titleEl.href;
        }
      }
      if (!company || company === 'Tech Company') {
        const compEl = card.querySelector('[data-testid="company-name"]');
        if (compEl) company = compEl.innerText.trim();
      }
      if (!jobLocation) {
        const locEl = card.querySelector('[data-testid="text-location"]');
        if (locEl) jobLocation = locEl.innerText.trim();
      }

      jobDescription = extractIndeedDescription(card, panel, jobTitle, company);
    }

    // Set button loading state
    button.innerHTML = '<span>Saving...</span>';
    button.disabled = true;

    // Send save POST request to Applywise Next.js local server database
    const safeLocation = (jobLocation || '').trim();
    const safeDescription = cleanText(jobDescription);
    const safeDescriptionLower = safeDescription.toLowerCase();
    const payload = {
      company:  (company  || 'Unknown').trim(),
      jobTitle: (jobTitle || 'Untitled').trim(),
      jobUrl,
      location: safeLocation,
      status: 'saved',
      workMode: safeLocation.toLowerCase().includes('remote') || safeDescriptionLower.includes('remote')
        ? 'Remote'
        : safeDescriptionLower.includes('on-site') || safeDescriptionLower.includes('onsite') || safeDescriptionLower.includes('office')
          ? 'On-site'
          : 'Hybrid',
      jobDescription: safeDescription,
      origin: 'extension'
    };

    fetch('https://house-of-edtech-one.vercel.app/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          button.innerHTML = '<span>✔ Saved</span>';
          Object.assign(button.style, {
            background: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            color: '#10B981',
          });
          // Remove hover states dynamically by cloning
          const cleanBtn = button.cloneNode(true);
          cleanBtn.disabled = true;
          button.parentNode.replaceChild(cleanBtn, button);
        } else {
          throw new Error(data.error || 'Failed to save');
        }
      })
      .catch((err) => {
        console.error('Applywise Quick Save failed:', err);
        button.innerHTML = '<span>Offline</span>';
        button.disabled = false;
        Object.assign(button.style, {
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.25)',
          color: '#EF4444',
        });
        setTimeout(() => {
          button.innerHTML = '<span>✨ Quick Save</span>';
          button.disabled = false;
          button.style.background = 'rgba(249, 115, 22, 0.1)';
          button.style.borderColor = 'rgba(249, 115, 22, 0.25)';
          button.style.color = '#F97316';
        }, 3000);
      });
  }

  // 1. Run dynamic card injection checker
  injectQuickSaveButtons();

  // 2. Set up dynamic MutationObserver to watch job board list scrolling/search updates
  const observer = new MutationObserver(() => {
    injectQuickSaveButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
