// Applywise Chrome Scraper Content Script

function getScrapedJobData() {
  const url = window.location.href;
  let jobTitle = '';
  let company = '';
  let location = '';
  let jobDescription = '';
  let workMode = 'Hybrid';
  let experience = 'Mid-Level';

  // 1. LinkedIn Job Board Scraper
  if (url.includes('linkedin.com')) {
    // Job Title Selector
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24');
    if (titleEl) jobTitle = titleEl.textContent.trim();

    // Company Selector
    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name a');
    if (companyEl) {
      company = companyEl.textContent.trim().replace(/\s*\n\s*/g, ' ').split('•')[0].trim();
    }

    // Location Selector
    const locEl = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet');
    if (locEl) location = locEl.textContent.trim();

    // Job Description Selector
    const descEl = document.querySelector('#job-details, .jobs-description__content, .jobs-box__html-content, .show-more-less-html__markup, .description__text');
    if (descEl) jobDescription = descEl.innerText.trim();

    // Heuristic Work Mode
    const fullText = document.body.innerText.toLowerCase();
    if (fullText.includes('remote') || location.toLowerCase().includes('remote')) {
      workMode = 'Remote';
    } else if (fullText.includes('on-site') || fullText.includes('onsite') || fullText.includes('office')) {
      workMode = 'On-site';
    } else if (fullText.includes('hybrid')) {
      workMode = 'Hybrid';
    }

    // Heuristic Experience
    if (fullText.includes('intern') || fullText.includes('co-op')) {
      experience = 'Junior';
    } else if (fullText.includes('senior') || fullText.includes('sr.')) {
      experience = 'Senior';
    } else if (fullText.includes('lead') || fullText.includes('architect') || fullText.includes('principal')) {
      experience = 'Lead';
    } else {
      experience = 'Mid-Level';
    }
  }
  // 2. Indeed Job Board Scraper
  else if (url.includes('indeed.com')) {
    // Title — detail page h1 or search-page panel h1
    const titleEl = document.querySelector(
      'h1.jobsearch-JobInfoHeader-title, [class*="JobInfoHeader-title"], h1[data-testid*="title"], h1'
    );
    if (titleEl) jobTitle = titleEl.innerText.trim();

    // Company — data-company-name is the most reliable attribute
    const companyEl = document.querySelector(
      '[data-company-name="true"], a[class*="CompanyPageLink"], [class*="InlineCompanyRating"] a'
    );
    if (companyEl) company = companyEl.innerText.trim();

    // Location — prefer testid, fall back to subtitle region
    const locEl = document.querySelector(
      '[data-testid="job-location"], #jobLocationSection, [class*="JobInfoHeader-subtitle"] div'
    );
    if (locEl) location = locEl.innerText.trim();

    // Description
    const descEl = document.querySelector('#jobDescriptionText, [class*="jobDescriptionText"]');
    if (descEl) jobDescription = descEl.innerText.trim();

    if (jobDescription.toLowerCase().includes('remote') || location.toLowerCase().includes('remote')) {
      workMode = 'Remote';
    } else if (jobDescription.toLowerCase().includes('on-site') || jobDescription.toLowerCase().includes('office')) {
      workMode = 'On-site';
    }
  }
  // 3. Naukri Scraper
  else if (url.includes('naukri.com')) {
    const titleEl = document.querySelector('.jd-header-title, [title="Job Title"]');
    if (titleEl) jobTitle = titleEl.textContent.trim();

    const companyEl = document.querySelector('.jd-header-comp-name, [class*="jd-header-comp-name"]');
    if (companyEl) company = companyEl.textContent.trim();

    const locEl = document.querySelector('.location, [class*="location"]');
    if (locEl) location = locEl.textContent.trim();

    const descEl = document.querySelector('.job-desc, [class*="job-desc"]');
    if (descEl) jobDescription = descEl.innerText.trim();
  }
  // 4. Generic Board Selector Fallback
  else {
    const titleEl = document.querySelector('h1, [class*="job-title"], [class*="title"]');
    if (titleEl) jobTitle = titleEl.textContent.trim();

    const companyEl = document.querySelector('[class*="company"], [class*="employer"]');
    if (companyEl) company = companyEl.textContent.trim();

    const descEl = document.querySelector('[class*="description"], [class*="details"], article');
    if (descEl) jobDescription = descEl.innerText.trim();
  }

  // Final cleanup and formatting
  return {
    jobTitle: jobTitle.replace(/\s+/g, ' ').trim(),
    company: company.replace(/\s+/g, ' ').trim(),
    location: location.replace(/\s+/g, ' ').trim(),
    jobUrl: url,
    jobDescription: jobDescription,
    workMode,
    experience
  };
}

// Set up Chrome runtime message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    try {
      const data = getScrapedJobData();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // Allow async response
});
