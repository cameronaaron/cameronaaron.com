import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const outDir = resolve(root, 'out');

const requiredOutputFiles = [
  'index.html',
  'capstone.html',
  'credentials.html',
  'internet.html',
  'sw.js',
];

const budgets = {
  homeHtmlBytes: 470_000,
  homeHtmlGzipBytes: 62_000,
  singleHtmlBytes: 500_000,
  singleHtmlGzipBytes: 70_000,
  totalHtmlBytes: 1_100_000,
  totalHtmlGzipBytes: 220_000,
  singleJsBytes: 320_000,
  singleJsGzipBytes: 95_000,
  totalJsBytes: 1_050_000,
  totalJsGzipBytes: 320_000,
  singleCssBytes: 130_000,
  singleCssGzipBytes: 20_000,
  totalCssBytes: 150_000,
  totalCssGzipBytes: 30_000,
  singleImageBytes: 300_000,
  totalImageBytes: 800_000,
  serviceWorkerBytes: 12_000,
};

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.avif']);

function walkFiles(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function summarizeTextAssets(files) {
  let totalBytes = 0;
  let totalGzipBytes = 0;
  let maxBytes = 0;
  let maxGzipBytes = 0;
  let maxFile = '';
  let maxGzipFile = '';

  for (const file of files) {
    const buffer = readFileSync(file);
    const size = buffer.length;
    const gzipSize = gzipSync(buffer, { level: 9 }).length;

    totalBytes += size;
    totalGzipBytes += gzipSize;

    if (size > maxBytes) {
      maxBytes = size;
      maxFile = file;
    }

    if (gzipSize > maxGzipBytes) {
      maxGzipBytes = gzipSize;
      maxGzipFile = file;
    }
  }

  return {
    totalBytes,
    totalGzipBytes,
    maxBytes,
    maxGzipBytes,
    maxFile,
    maxGzipFile,
  };
}

function summarizeBinaryAssets(files) {
  let totalBytes = 0;
  let maxBytes = 0;
  let maxFile = '';

  for (const file of files) {
    const size = statSync(file).size;
    totalBytes += size;

    if (size > maxBytes) {
      maxBytes = size;
      maxFile = file;
    }
  }

  return {
    totalBytes,
    maxBytes,
    maxFile,
  };
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString()} bytes`;
}

function pushBudgetError(errors, label, actual, limit, filePath = '') {
  const suffix = filePath ? ` (${relative(root, filePath)})` : '';
  errors.push(`${label}${suffix}: ${formatBytes(actual)} exceeds ${formatBytes(limit)}`);
}

if (!existsSync(outDir)) {
  console.error('Performance budget checks failed:');
  console.error('- Build output directory "out" not found. Run "npm run build" first.');
  process.exit(1);
}

const errors = [];

for (const relativePath of requiredOutputFiles) {
  const absolutePath = resolve(outDir, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`Required output file is missing: out/${relativePath}`);
  }
}

const allOutFiles = walkFiles(outDir);

const htmlFiles = allOutFiles.filter((file) => file.endsWith('.html'));
const jsFiles = allOutFiles.filter((file) => file.endsWith('.js'));
const cssFiles = allOutFiles.filter((file) => file.endsWith('.css'));
const imageFiles = allOutFiles.filter((file) => imageExtensions.has(extname(file).toLowerCase()));

const htmlMetrics = summarizeTextAssets(htmlFiles);
const jsMetrics = summarizeTextAssets(jsFiles);
const cssMetrics = summarizeTextAssets(cssFiles);
const imageMetrics = summarizeBinaryAssets(imageFiles);

const homeHtmlPath = resolve(outDir, 'index.html');
if (existsSync(homeHtmlPath)) {
  const homeHtmlBuffer = readFileSync(homeHtmlPath);
  const homeHtmlBytes = homeHtmlBuffer.length;
  const homeHtmlGzipBytes = gzipSync(homeHtmlBuffer, { level: 9 }).length;

  if (homeHtmlBytes > budgets.homeHtmlBytes) {
    pushBudgetError(errors, 'Home HTML raw size', homeHtmlBytes, budgets.homeHtmlBytes, homeHtmlPath);
  }

  if (homeHtmlGzipBytes > budgets.homeHtmlGzipBytes) {
    pushBudgetError(errors, 'Home HTML gzip size', homeHtmlGzipBytes, budgets.homeHtmlGzipBytes, homeHtmlPath);
  }
}

if (htmlMetrics.maxBytes > budgets.singleHtmlBytes) {
  pushBudgetError(errors, 'Largest HTML raw size', htmlMetrics.maxBytes, budgets.singleHtmlBytes, htmlMetrics.maxFile);
}

if (htmlMetrics.maxGzipBytes > budgets.singleHtmlGzipBytes) {
  pushBudgetError(errors, 'Largest HTML gzip size', htmlMetrics.maxGzipBytes, budgets.singleHtmlGzipBytes, htmlMetrics.maxGzipFile);
}

if (htmlMetrics.totalBytes > budgets.totalHtmlBytes) {
  pushBudgetError(errors, 'Total HTML raw size', htmlMetrics.totalBytes, budgets.totalHtmlBytes);
}

if (htmlMetrics.totalGzipBytes > budgets.totalHtmlGzipBytes) {
  pushBudgetError(errors, 'Total HTML gzip size', htmlMetrics.totalGzipBytes, budgets.totalHtmlGzipBytes);
}

if (jsMetrics.maxBytes > budgets.singleJsBytes) {
  pushBudgetError(errors, 'Largest JS raw size', jsMetrics.maxBytes, budgets.singleJsBytes, jsMetrics.maxFile);
}

if (jsMetrics.maxGzipBytes > budgets.singleJsGzipBytes) {
  pushBudgetError(errors, 'Largest JS gzip size', jsMetrics.maxGzipBytes, budgets.singleJsGzipBytes, jsMetrics.maxGzipFile);
}

if (jsMetrics.totalBytes > budgets.totalJsBytes) {
  pushBudgetError(errors, 'Total JS raw size', jsMetrics.totalBytes, budgets.totalJsBytes);
}

if (jsMetrics.totalGzipBytes > budgets.totalJsGzipBytes) {
  pushBudgetError(errors, 'Total JS gzip size', jsMetrics.totalGzipBytes, budgets.totalJsGzipBytes);
}

if (cssMetrics.maxBytes > budgets.singleCssBytes) {
  pushBudgetError(errors, 'Largest CSS raw size', cssMetrics.maxBytes, budgets.singleCssBytes, cssMetrics.maxFile);
}

if (cssMetrics.maxGzipBytes > budgets.singleCssGzipBytes) {
  pushBudgetError(errors, 'Largest CSS gzip size', cssMetrics.maxGzipBytes, budgets.singleCssGzipBytes, cssMetrics.maxGzipFile);
}

if (cssMetrics.totalBytes > budgets.totalCssBytes) {
  pushBudgetError(errors, 'Total CSS raw size', cssMetrics.totalBytes, budgets.totalCssBytes);
}

if (cssMetrics.totalGzipBytes > budgets.totalCssGzipBytes) {
  pushBudgetError(errors, 'Total CSS gzip size', cssMetrics.totalGzipBytes, budgets.totalCssGzipBytes);
}

if (imageMetrics.maxBytes > budgets.singleImageBytes) {
  pushBudgetError(errors, 'Largest image size', imageMetrics.maxBytes, budgets.singleImageBytes, imageMetrics.maxFile);
}

if (imageMetrics.totalBytes > budgets.totalImageBytes) {
  pushBudgetError(errors, 'Total image size', imageMetrics.totalBytes, budgets.totalImageBytes);
}

const serviceWorkerPath = resolve(outDir, 'sw.js');
if (existsSync(serviceWorkerPath)) {
  const serviceWorkerBytes = statSync(serviceWorkerPath).size;
  if (serviceWorkerBytes > budgets.serviceWorkerBytes) {
    pushBudgetError(errors, 'Service worker size', serviceWorkerBytes, budgets.serviceWorkerBytes, serviceWorkerPath);
  }
}

if (errors.length > 0) {
  console.error('Performance budget checks failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Performance budget checks passed.');
console.log(`- HTML total: ${formatBytes(htmlMetrics.totalBytes)} (gzip ${formatBytes(htmlMetrics.totalGzipBytes)})`);
console.log(`- JS total: ${formatBytes(jsMetrics.totalBytes)} (gzip ${formatBytes(jsMetrics.totalGzipBytes)})`);
console.log(`- CSS total: ${formatBytes(cssMetrics.totalBytes)} (gzip ${formatBytes(cssMetrics.totalGzipBytes)})`);
console.log(`- Images total: ${formatBytes(imageMetrics.totalBytes)}`);
