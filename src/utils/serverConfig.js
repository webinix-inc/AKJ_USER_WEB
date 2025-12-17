// Utility to check server configuration for PDF.js compatibility

export const checkServerConfig = async () => {
  const checks = {
    pdfjs: false,
    mimeTypes: false,
    cors: false,
    worker: false
  };

  try {
    // Check if PDF.js main file is accessible
    const pdfResponse = await fetch('/pdfjs/build/pdf.mjs');
    checks.pdfjs = pdfResponse.ok;
    
    // Check MIME type
    const contentType = pdfResponse.headers.get('content-type');
    checks.mimeTypes = contentType && (
      contentType.includes('application/javascript') || 
      contentType.includes('text/javascript')
    );

    console.log('PDF.js main file:', checks.pdfjs ? '✅' : '❌');
    console.log('MIME type correct:', checks.mimeTypes ? '✅' : '❌', contentType);

  } catch (error) {
    console.error('PDF.js main file check failed:', error);
  }

  try {
    // Check if worker file is accessible
    const workerResponse = await fetch('/pdfjs/build/pdf.worker.mjs');
    checks.worker = workerResponse.ok;
    
    console.log('PDF.js worker file:', checks.worker ? '✅' : '❌');

  } catch (error) {
    console.error('PDF.js worker file check failed:', error);
  }

  try {
    // Check CORS headers
    const testResponse = await fetch('/pdfjs/web/viewer.html');
    const corsHeader = testResponse.headers.get('access-control-allow-origin');
    checks.cors = corsHeader !== null;
    
    console.log('CORS headers:', checks.cors ? '✅' : '❌');

  } catch (error) {
    console.error('CORS check failed:', error);
  }

  return checks;
};

export const getRecommendations = (checks) => {
  const recommendations = [];

  if (!checks.pdfjs) {
    recommendations.push({
      issue: 'PDF.js files not accessible',
      solution: 'Ensure PDF.js files are copied to the build directory and served correctly'
    });
  }

  if (!checks.mimeTypes) {
    recommendations.push({
      issue: 'Incorrect MIME types for .mjs files',
      solution: 'Configure server to serve .mjs files with application/javascript MIME type'
    });
  }

  if (!checks.worker) {
    recommendations.push({
      issue: 'PDF.js worker file not accessible',
      solution: 'Ensure pdf.worker.mjs is accessible and served with correct MIME type'
    });
  }

  if (!checks.cors) {
    recommendations.push({
      issue: 'CORS headers missing',
      solution: 'Configure server to include CORS headers for PDF files and assets'
    });
  }

  return recommendations;
};

// Function to log server configuration status
export const logServerStatus = async () => {
  console.log('🔍 Checking server configuration for PDF.js...');
  
  const checks = await checkServerConfig();
  const recommendations = getRecommendations(checks);
  
  if (recommendations.length === 0) {
    console.log('✅ Server configuration looks good for PDF.js!');
  } else {
    console.log('⚠️ Server configuration issues detected:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}`);
    });
  }
  
  return { checks, recommendations };
};
