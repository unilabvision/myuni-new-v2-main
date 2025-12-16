import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'content.json');

interface HeroContent {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  description?: string;
  features?: string[];
  primaryButton?: string;
  secondaryButton?: string;
}

interface StatItem {
  icon?: string;
  value?: string;
  label?: string;
  description?: string;
}

interface StatsContent {
  title?: string;
  subtitle?: string;
  description?: string;
  stats?: StatItem[];
  ctaButton?: string;
}

interface FeaturesContent {
  // Define your features content structure here
  // Example:
  title?: string;
  items?: Array<{
    title?: string;
    description?: string;
    icon?: string;
  }>;
}

interface ContentSchema {
  hero?: HeroContent;
  stats?: StatsContent;
  features?: FeaturesContent;
}

function validateContent(data: unknown): data is ContentSchema {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  // Basic type checking for each section
  const content = data as Partial<ContentSchema>;
  
  if (content.hero && typeof content.hero !== 'object') return false;
  if (content.stats && typeof content.stats !== 'object') return false;
  if (content.features && typeof content.features !== 'object') return false;

  return true;
}

type ErrorWithCode = Error & { code?: string };

export async function GET() {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: unknown = JSON.parse(fileContent);
    
    if (!validateContent(data)) {
      throw new Error('Invalid content structure');
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading content:', error);
    
    // Return default empty content if file doesn't exist
    const isFileNotFound = (error as ErrorWithCode).code === 'ENOENT';
    if (isFileNotFound) {
      return NextResponse.json({
        hero: {},
        stats: {},
        features: {}
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to load content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    const currentContent: ContentSchema = await fs.readFile(filePath, 'utf-8')
      .then(content => {
        const parsed = JSON.parse(content);
        return validateContent(parsed) ? parsed : {};
      })
      .catch(() => ({}));
    
    const partialUpdate: unknown = await request.json();
    
    if (!validateContent(partialUpdate)) {
      throw new Error('Invalid content structure');
    }
    
    const tempPath = `${filePath}.tmp`;
    const updatedContent: ContentSchema = { ...currentContent, ...partialUpdate };
    
    await fs.writeFile(tempPath, JSON.stringify(updatedContent, null, 2));
    await fs.rename(tempPath, filePath);
    
    return NextResponse.json({ 
      message: 'Content updated successfully',
      updatedFields: Object.keys(partialUpdate as ContentSchema)
    });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update content',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}