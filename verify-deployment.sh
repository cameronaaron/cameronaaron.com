#!/bin/bash

# Cloudflare Pages Deployment Verification Script

echo "🚀 Cloudflare Pages Deployment - Pre-flight Check"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check 1: Node.js version
echo -n "✓ Checking Node.js version... "
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
else
    echo -e "${RED}✗ Node.js version too old. Need v18+${NC}"
    exit 1
fi

# Check 2: Dependencies installed
echo -n "✓ Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}! Installing dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Check 3: Build test
echo -n "✓ Testing production build... "
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    echo "Run 'npm run build' to see errors"
    exit 1
fi

# Check 4: Output directory exists
echo -n "✓ Checking build output... "
if [ -d "out" ]; then
    FILE_COUNT=$(find out -type f | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ ${FILE_COUNT} files generated${NC}"
else
    echo -e "${RED}✗ Output directory not found${NC}"
    exit 1
fi

# Check 5: Cloudflare config files
echo -n "✓ Checking Cloudflare config... "
MISSING=""
[ ! -f "public/_headers" ] && MISSING="$MISSING _headers"
[ ! -f "public/_redirects" ] && MISSING="$MISSING _redirects"

if [ -z "$MISSING" ]; then
    echo -e "${GREEN}✓ All config files present${NC}"
else
    echo -e "${RED}✗ Missing: $MISSING${NC}"
    exit 1
fi

# Check 6: GitHub repo
echo -n "✓ Checking Git repository... "
if git remote -v | grep -q "cameronaaron.com"; then
    echo -e "${GREEN}✓ Connected to GitHub${NC}"
else
    echo -e "${YELLOW}! Not connected to GitHub${NC}"
fi

# Check 7: Required packages
echo -n "✓ Checking Wrangler CLI... "
if npm list wrangler > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Wrangler not found${NC}"
    exit 1
fi

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✓ All pre-flight checks passed!${NC}"
echo ""
echo "📋 Next Steps:"
echo "  1. Create/verify Cloudflare Pages project:"
echo "     - Project name: cameronaaronsite"
echo "     - Build command: npm run build"
echo "     - Build output: out"
echo ""
echo "  2. Push to GitHub (Cloudflare integration deploys automatically):"
echo "     git add ."
echo "     git commit -m \"Configure Cloudflare Pages deploy\""
echo "     git push origin master"
echo ""
echo "  3. Watch deployment in Cloudflare Pages dashboard"
echo ""
echo "🚀 Ready for deployment!"
echo "=================================================="
