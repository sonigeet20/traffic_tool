// Test script to verify Google search and domain clicking logic
// This simulates what the puppeteer server does

const testUrl = 'https://groeixyz.com';
const testKeyword = 'groeixyz';
const testDomain = new URL(testUrl).hostname.replace('www.', '');

console.log('=== Google Search Test Simulation ===');
console.log(`Target URL: ${testUrl}`);
console.log(`Search Keyword: ${testKeyword}`);
console.log(`Extracted Domain: ${testDomain}`);
console.log('');

// Simulate what the search would find
const mockSearchResults = [
  'https://www.google.com/search?q=groeixyz',
  'https://accounts.google.com/signin',
  'https://groeixyz.com/',
  'https://www.groeixyz.com/about',
  'https://www.linkedin.com/company/groeixyz',
  'https://twitter.com/groeixyz'
];

console.log('Mock Search Results:');
mockSearchResults.forEach((url, idx) => {
  console.log(`  ${idx + 1}. ${url}`);
});
console.log('');

// Filter logic (same as puppeteer server)
console.log('Filtering logic:');
const filtered = mockSearchResults.filter(href => {
  const isGoogleLink = href.includes('google.com') || href.includes('accounts.google');
  const isFragment = href.startsWith('#') || href.startsWith('javascript:');

  if (isGoogleLink) {
    console.log(`  ✗ Filtered out (Google link): ${href}`);
    return false;
  }
  if (isFragment) {
    console.log(`  ✗ Filtered out (fragment/js): ${href}`);
    return false;
  }
  console.log(`  ✓ Kept: ${href}`);
  return true;
});

console.log('');
console.log('Search for exact domain match:');
let foundUrl = null;
for (const href of filtered) {
  try {
    const linkDomain = new URL(href).hostname.replace('www.', '');
    console.log(`  Comparing: "${linkDomain}" === "${testDomain}"`);
    if (linkDomain === testDomain) {
      console.log(`  ✓ EXACT MATCH FOUND: ${href}`);
      foundUrl = href;
      break;
    }
  } catch (e) {
    console.log(`  ✗ Invalid URL: ${href}`);
  }
}

if (!foundUrl) {
  console.log('');
  console.log('Fallback to partial match:');
  for (const href of filtered) {
    if (href.includes(testDomain)) {
      console.log(`  ✓ PARTIAL MATCH FOUND: ${href}`);
      foundUrl = href;
      break;
    }
  }
}

console.log('');
console.log('=== RESULT ===');
if (foundUrl) {
  console.log(`✓ Would click: ${foundUrl}`);
  console.log(`✓ This URL would be stored in google_search_clicked_url`);
} else {
  console.log(`✗ Domain not found in results`);
  console.log(`✗ Would store: NOT_FOUND_IN_RESULTS`);
  console.log(`✗ Would navigate directly to: ${testUrl}`);
}
