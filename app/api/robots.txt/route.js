// app/api/robots.txt/route.js - Dynamic Robots.txt
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    
    // Check if this is production environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    let robotsContent;
    
    if (isProduction) {
      // Production robots.txt - Allow all crawlers
      robotsContent = `# MyUNI Eğitim Platformu - Robots.txt
# Generated automatically

User-agent: *
Allow: /

# Sitemap locations
Sitemap: ${baseUrl}/api/sitemap.xml

# Specific crawl delays for major search engines
User-agent: Googlebot
Crawl-delay: 1

User-agent: Bingbot
Crawl-delay: 2

User-agent: Slurp
Crawl-delay: 2

# Block access to sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/private/
Disallow: /_services/
Disallow: /checkout/
Disallow: /payment-success/
Disallow: /sso-callback/

# Block access to development and testing paths
Disallow: /test/
Disallow: /dev/
Disallow: /_next/
Disallow: /static/

# Block access to authentication pages (no SEO value)
Disallow: /*/login
Disallow: /*/sign-up
Disallow: /*/forgot-password
Disallow: /*/verify-email
Disallow: /*/complete-profile

# Block duplicate content patterns
Disallow: /*?*
Disallow: /*&*
Disallow: /*/*?*

# Allow specific important query parameters
Allow: /*/blog?search=*
Allow: /*/kurs?filter=*
Allow: /*/course?filter=*

# Clean URLs preferred
Disallow: /*.json
Disallow: /*.xml$
Disallow: /*.txt$

# Block common spam/scraper paths
Disallow: /wp-admin/
Disallow: /wp-content/
Disallow: /wp-includes/
Disallow: /admin/
Disallow: /administrator/
Disallow: /xmlrpc.php
Disallow: /wp-login.php

# Allow important static assets
Allow: /favicon.ico
Allow: /robots.txt
Allow: /sitemap.xml
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.svg
Allow: /*.webp

# Host directive for preferred domain
Host: ${baseUrl}`;

    } else {
      // Development/staging robots.txt - Block all crawlers
      robotsContent = `# MyUNI Eğitim Platformu - Development Environment
# Generated automatically

User-agent: *
Disallow: /

# This is a development/staging environment
# Please visit our production site: https://myunilab.net

Sitemap: ${baseUrl}/api/sitemap.xml`;
    }

    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    });
    
  } catch (error) {
    console.error('❌ Error generating robots.txt:', error);
    
    // Fallback robots.txt
    const fallbackContent = `User-agent: *
Allow: /

Sitemap: https://myunilab.net/api/sitemap.xml`;
    
    return new NextResponse(fallbackContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}