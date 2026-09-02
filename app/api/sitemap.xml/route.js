// app/api/sitemap.xml/route.js - Complete Sitemap With Blog Service
import { NextResponse } from 'next/server';
import { getAllCourses, getAllPackages } from '../../../lib/courseService';
import { resolvePublicBaseUrl } from '../../../lib/publicBaseUrl';
// Blog service import - try different possible paths
let getUnilabBlogPosts, getCurrentSite;
try {
  // Try the main path first
  const blogService = await import('../../services/unilabBlogService');
  getUnilabBlogPosts = blogService.getUnilabBlogPosts;
  getCurrentSite = blogService.getCurrentSite;
} catch (error) {
  console.warn('Blog service not found, blog routes will be skipped:', error.message);
  getUnilabBlogPosts = null;
  getCurrentSite = () => 'myuni_platform';
}

// Static routes configuration
const STATIC_ROUTES = {
  // Ana sayfalar
  homepage: {
    tr: '',
    en: '',
    priority: '1.0',
    changefreq: 'daily'
  },
  
  // Kurs sayfaları
  courses: {
    tr: 'kurs',
    en: 'course', 
    priority: '0.9',
    changefreq: 'weekly'
  },

  // Eğitim paketleri
  packages: {
    tr: 'paket',
    en: 'package',
    priority: '0.9',
    changefreq: 'weekly'
  },
  
  // Blog sayfaları
  blog: {
    tr: 'blog',
    en: 'blog',
    priority: '0.8', 
    changefreq: 'daily'
  },
  
  // Diğer sayfalar
  about: {
    tr: 'hakkimizda',
    en: 'about',
    priority: '0.7',
    changefreq: 'monthly'
  },
  
  projects: {
    tr: 'projelerimiz',
    en: 'projects',
    priority: '0.7',
    changefreq: 'monthly'
  },
  
  contact: {
    tr: 'iletisim', 
    en: 'contact',
    priority: '0.6',
    changefreq: 'monthly'
  },
  
  careers: {
    tr: 'kariyer',
    en: 'career', 
    priority: '0.6',
    changefreq: 'monthly'
  },
  
  egitmen: {
    tr: 'egitmen-ol',
    en: 'egitmen-ol',
    priority: '0.6',
    changefreq: 'monthly'
  },
  
  kulup: {
    tr: 'kulup',
    en: 'kulup',
    priority: '0.6',
    changefreq: 'monthly'
  },
  
  newsletter: {
    tr: 'bultenimiz',
    en: 'newsletter',
    priority: '0.5',
    changefreq: 'monthly'
  },
  
  privacy: {
    tr: 'gizlilik',
    en: 'privacy',
    priority: '0.4',
    changefreq: 'yearly'
  },
  
  terms: {
    tr: 'sartlar-ve-kosullar',
    en: 'terms',
    priority: '0.4', 
    changefreq: 'yearly'
  }
};

// Date formatter for sitemap
function formatSitemapDate(date) {
  return new Date(date).toISOString();
}

// Generate static routes
function generateStaticRoutes(baseUrl) {
  const routes = [];
  
  Object.entries(STATIC_ROUTES).forEach(([, config]) => {
    // Turkish route
    const trUrl = config.tr ? `${baseUrl}/tr/${config.tr}` : `${baseUrl}/tr`;
    routes.push({
      loc: trUrl,
      lastmod: formatSitemapDate(new Date()),
      changefreq: config.changefreq,
      priority: config.priority,
      alternates: {
        tr: trUrl,
        en: config.en ? `${baseUrl}/en/${config.en}` : `${baseUrl}/en`
      }
    });
    
    // English route  
    const enUrl = config.en ? `${baseUrl}/en/${config.en}` : `${baseUrl}/en`;
    routes.push({
      loc: enUrl,
      lastmod: formatSitemapDate(new Date()),
      changefreq: config.changefreq,
      priority: config.priority,
      alternates: {
        tr: trUrl,
        en: enUrl
      }
    });
  });
  
  return routes;
}

// Generate blog routes
async function generateBlogRoutes(baseUrl) {
  const routes = [];
  
  if (!getUnilabBlogPosts) {
    console.warn('Blog service not available, skipping blog routes');
    return routes;
  }
  
  try {
    const currentSite = getCurrentSite();
    
    // Get blog posts for both languages
    const [trPosts, enPosts] = await Promise.all([
      getUnilabBlogPosts('tr', currentSite),
      getUnilabBlogPosts('en', currentSite)
    ]);
    
    // Process Turkish blog posts
    if (trPosts && Array.isArray(trPosts)) {
      trPosts.forEach(post => {
        if (post && post.slug) {
          const trUrl = `${baseUrl}/tr/blog/${post.slug}`;
          routes.push({
            loc: trUrl,
            lastmod: formatSitemapDate(post.date || new Date()),
            changefreq: 'weekly',
            priority: '0.7',
            alternates: {
              tr: trUrl,
              en: null // Blog posts may not have direct language equivalents
            }
          });
        }
      });
    }
    
    // Process English blog posts
    if (enPosts && Array.isArray(enPosts)) {
      enPosts.forEach(post => {
        if (post && post.slug) {
          const enUrl = `${baseUrl}/en/blog/${post.slug}`;
          routes.push({
            loc: enUrl,
            lastmod: formatSitemapDate(post.date || new Date()),
            changefreq: 'weekly',
            priority: '0.7',
            alternates: {
              tr: null,
              en: enUrl
            }
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Error generating blog routes:', error);
  }
  
  return routes;
}
async function generateCourseRoutes(baseUrl) {
  const routes = [];
  
  try {
    // Get courses for both languages
    const [trCourses, enCourses] = await Promise.all([
      getAllCourses('tr'),
      getAllCourses('en')
    ]);
    
    // Create a map of course slugs for alternates
    const courseMap = new Map();
    
    // Process Turkish courses
    trCourses.forEach(course => {
      if (course.slug) {
        courseMap.set(course.slug, { tr: course.slug });
      }
    });
    
    // Process English courses and match with Turkish
    enCourses.forEach(course => {
      if (course.slug) {
        const existing = courseMap.get(course.slug);
        if (existing) {
          existing.en = course.slug;
        } else {
          courseMap.set(course.slug, { en: course.slug });
        }
      }
    });
    
    // Generate sitemap entries
    courseMap.forEach((slugs) => {
      const lastmod = formatSitemapDate(new Date());
      
      // Turkish course URL
      if (slugs.tr) {
        const trUrl = `${baseUrl}/tr/kurs/${slugs.tr}`;
        routes.push({
          loc: trUrl,
          lastmod,
          changefreq: 'weekly',
          priority: '0.8',
          alternates: {
            tr: trUrl,
            en: slugs.en ? `${baseUrl}/en/course/${slugs.en}` : null
          }
        });
      }
      
      // English course URL
      if (slugs.en) {
        const enUrl = `${baseUrl}/en/course/${slugs.en}`;
        routes.push({
          loc: enUrl,
          lastmod,
          changefreq: 'weekly', 
          priority: '0.8',
          alternates: {
            tr: slugs.tr ? `${baseUrl}/tr/kurs/${slugs.tr}` : null,
            en: enUrl
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error generating course routes:', error);
  }
  
  return routes;
}

async function generatePackageRoutes(baseUrl) {
  const routes = [];

  try {
    const [trPackages, enPackages] = await Promise.all([
      getAllPackages('tr'),
      getAllPackages('en'),
    ]);

    const packageMap = new Map();

    trPackages.forEach((pkg) => {
      if (pkg.slug) {
        packageMap.set(pkg.slug, {
          tr: pkg.slug,
          updated_at: pkg.updated_at || pkg.created_at,
        });
      }
    });

    enPackages.forEach((pkg) => {
      if (pkg.slug) {
        const existing = packageMap.get(pkg.slug);
        if (existing) {
          existing.en = pkg.slug;
          existing.updated_at = pkg.updated_at || pkg.created_at || existing.updated_at;
        } else {
          packageMap.set(pkg.slug, {
            en: pkg.slug,
            updated_at: pkg.updated_at || pkg.created_at,
          });
        }
      }
    });

    packageMap.forEach((slugs) => {
      const lastmod = formatSitemapDate(slugs.updated_at ? new Date(slugs.updated_at) : new Date());

      if (slugs.tr) {
        const trUrl = `${baseUrl}/tr/paket/${slugs.tr}`;
        routes.push({
          loc: trUrl,
          lastmod,
          changefreq: 'weekly',
          priority: '0.85',
          alternates: {
            tr: trUrl,
            en: slugs.en ? `${baseUrl}/en/package/${slugs.en}` : null,
          },
        });
      }

      if (slugs.en) {
        const enUrl = `${baseUrl}/en/package/${slugs.en}`;
        routes.push({
          loc: enUrl,
          lastmod,
          changefreq: 'weekly',
          priority: '0.85',
          alternates: {
            tr: slugs.tr ? `${baseUrl}/tr/paket/${slugs.tr}` : null,
            en: enUrl,
          },
        });
      }
    });
  } catch (error) {
    console.error('Error generating package routes:', error);
  }

  return routes;
}

// Generate XML sitemap
function generateSitemapXML(routes) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes.map(route => `  <url>
    <loc>${route.loc}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${route.alternates ? Object.entries(route.alternates)
      .filter(([, url]) => url && url !== route.loc)
      .map(([lang, url]) => `
    <xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`)
      .join('') : ''}
  </url>`).join('\n')}
</urlset>`;
  
  return xml;
}

// Main sitemap generation function
export async function GET() {
  try {
    // Get base URL (never localhost in production)
    const baseUrl = resolvePublicBaseUrl();
    
    console.log('🚀 Generating sitemap for:', baseUrl);
    
    // Generate route types (including blog + packages)
    const [staticRoutes, courseRoutes, packageRoutes, blogRoutes] = await Promise.all([
      generateStaticRoutes(baseUrl),
      generateCourseRoutes(baseUrl),
      generatePackageRoutes(baseUrl),
      generateBlogRoutes(baseUrl)
    ]);
    
    // Combine all routes
    const allRoutes = [
      ...staticRoutes,
      ...courseRoutes,
      ...packageRoutes,
      ...blogRoutes
    ];
    
    // Sort routes by priority (highest first)
    allRoutes.sort((a, b) => parseFloat(b.priority) - parseFloat(a.priority));
    
    console.log(`✅ Generated sitemap with ${allRoutes.length} URLs`);
    console.log(`📊 Static: ${staticRoutes.length}, Courses: ${courseRoutes.length}, Packages: ${packageRoutes.length}, Blog: ${blogRoutes.length}`);
    
    // Generate XML
    const xml = generateSitemapXML(allRoutes);
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    
    // Return minimal sitemap on error - never use localhost in production
    const baseUrl = resolvePublicBaseUrl();
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/tr</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/en</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/tr/kurs</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/course</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/tr/paket</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/package</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/tr/blog</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/blog</loc>
    <lastmod>${formatSitemapDate(new Date())}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}