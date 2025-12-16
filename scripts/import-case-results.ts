import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Basit CSV parser - csv-parse yerine kendi parser'ımızı kullanıyoruz
// Çok satırlı değerleri (tırnak içinde) destekler
function parseCSV(content: string): Record<string, string>[] {
  if (!content || content.trim() === '') return [];
  
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  // İçerik içindeki çok satırlı değerleri birleştir
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escape edilmiş tırnak
        currentLine += '"';
        i++; // Bir sonraki karakteri atla
      } else {
        // Tırnak başlangıcı/bitişi
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      // Satır sonu (tırnak içinde değilse)
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  // Son satırı ekle
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  // Boş satırları filtrele
  const validLines = lines.filter(line => line.trim() !== '');
  if (validLines.length === 0) return [];
  
  // İlk satır header'ları
  const headers = parseCSVLine(validLines[0]);
  const records: Record<string, string>[] = [];
  
  // Diğer satırlar veriler
  for (let i = 1; i < validLines.length; i++) {
    const values = parseCSVLine(validLines[i]);
    if (values.length === 0) continue;
    
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }
  
  return records;
}

// CSV satırını parse et (tırnak içindeki değerleri korur)
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escape edilmiş tırnak
        current += '"';
        i++; // Bir sonraki karakteri atla
      } else {
        // Tırnak başlangıcı/bitişi
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Değer sonu
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Son değeri ekle
  values.push(current.trim());
  
  return values;
}

// Supabase client'ı oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL ve Service Role Key gerekli!');
  console.error('Environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV sütun isimlerini SQL sütun isimlerine eşleştir
const columnMapping: Record<string, string> = {
  '1. Katılımcı İsim Soyisim': 'participant_name',
  'İletişim E-posta Adresi (Geri dönüşler bu e-posta adresine yapılacaktır, bir mail adresi yeterlidir.)': 'contact_email',
  'Yedek E-posta Adresi ': 'backup_email',
  'Konu': 'subject',
  'Öne çıkan yön': 'highlight_direction',
  'Genel Puan (100)': 'general_score',
  'Yorumlar': 'comments',
  'İkinci Hoca Genel Puan (100)': 'second_instructor_score',
  'Ortalama Puan': 'average_score',
  'İkinci Yorumlar': 'second_comments',
};

interface CaseResultRow {
  participant_name: string;
  contact_email: string;
  backup_email?: string;
  subject?: string;
  highlight_direction?: string;
  general_score?: number | null;
  comments?: string;
  second_instructor_score?: number | null;
  average_score?: number | null;
  second_comments?: string;
}

// Değer temizleme fonksiyonu
function cleanValue(value: any): string | null | undefined {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

// Sayısal değer parse etme
function parseNumeric(value: any): number | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim().replace(',', '.');
  if (cleaned === '') return null;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

async function importCaseResults() {
  try {
    console.log('📄 CSV dosyası okunuyor...');
    
    // CSV dosyasını oku
    const csvPath = path.join(process.cwd(), 'case.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // CSV'yi parse et
    const records = parseCSV(csvContent);
    
    console.log(`✅ ${records.length} satır parse edildi`);
    
    // Verileri dönüştür
    const transformedData: CaseResultRow[] = [];
    
    for (const record of records) {
      const cleanOrUndefined = (value: any): string | undefined => {
        const cleaned = cleanValue(value);
        return cleaned === null ? undefined : cleaned;
      };

      const transformed: CaseResultRow = {
        participant_name: cleanValue(record[Object.keys(columnMapping)[0]]) || '',
        contact_email: cleanValue(record[Object.keys(columnMapping)[1]]) || '',
        backup_email: cleanOrUndefined(record[Object.keys(columnMapping)[2]]),
        subject: cleanOrUndefined(record[Object.keys(columnMapping)[3]]),
        highlight_direction: cleanOrUndefined(record[Object.keys(columnMapping)[4]]),
        general_score: parseNumeric(record[Object.keys(columnMapping)[5]]),
        comments: cleanOrUndefined(record[Object.keys(columnMapping)[6]]),
        second_instructor_score: parseNumeric(record[Object.keys(columnMapping)[7]]),
        average_score: parseNumeric(record[Object.keys(columnMapping)[8]]),
        second_comments: cleanOrUndefined(record[Object.keys(columnMapping)[9]]),
      };
      
      // Zorunlu alanları kontrol et
      if (!transformed.participant_name || !transformed.contact_email) {
        console.warn(`⚠️  Satır atlandı - Zorunlu alan eksik:`, transformed);
        continue;
      }
      
      transformedData.push(transformed);
    }
    
    console.log(`✅ ${transformedData.length} geçerli kayıt hazırlandı`);
    console.log('\n📊 Örnek veri:');
    console.log(JSON.stringify(transformedData[0], null, 2));
    
    // Supabase'e insert et (batch insert - 100'er 100'er)
    console.log('\n💾 Supabase\'e kaydediliyor...');
    
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('myuni_case_result')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} hatası:`, error);
        errorCount += batch.length;
      } else {
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} başarılı (${batch.length} kayıt)`);
        successCount += batch.length;
      }
    }
    
    console.log('\n📈 Özet:');
    console.log(`  ✅ Başarılı: ${successCount}`);
    console.log(`  ❌ Hatalı: ${errorCount}`);
    console.log(`  📊 Toplam: ${transformedData.length}`);
    
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

// Script'i çalıştır
importCaseResults();

