const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const puppeteerUrl = 'http://13.218.100.97:3000';
  const results = [];

  // Test 1: Basic health check with 10 second timeout
  try {
    console.log('Testing connection to puppeteer server...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const start = Date.now();
    const response = await fetch(`${puppeteerUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const duration = Date.now() - start;
    const data = await response.json();
    
    results.push({
      test: 'health_check',
      success: true,
      status: response.status,
      duration_ms: duration,
      data: data
    });
  } catch (error) {
    results.push({
      test: 'health_check',
      success: false,
      error: error.message,
      error_name: error.name
    });
  }

  return new Response(
    JSON.stringify(results, null, 2),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
