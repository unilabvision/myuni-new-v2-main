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

/**
 * CSV'yi SQL INSERT sorgularına dönüştürür
 * Bu script çalıştırıldığında case.sql dosyası oluşturulur
 * Bu SQL dosyasını Supabase SQL Editor'da çalıştırabilirsiniz
 */

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

// SQL string escape fonksiyonu
function escapeSqlString(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  const str = String(value).trim();
  if (str === '') return 'NULL';
  // SQL injection koruması için single quote'ları escape et
  return `'${str.replace(/'/g, "''")}'`;
}

// Sayısal değer parse etme
function parseNumeric(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  const cleaned = String(value).trim().replace(',', '.');
  if (cleaned === '') return 'NULL';
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 'NULL' : parsed.toString();
}

function convertCsvToSql() {
  try {
    console.log('📄 CSV dosyası okunuyor...');
    
    // CSV dosyasını oku
    const csvPath = path.join(process.cwd(), 'case.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // CSV'yi parse et
    const records = parseCSV(csvContent);
    
    console.log(`✅ ${records.length} satır parse edildi`);
    
    // SQL INSERT sorgularını oluştur
    let sqlContent = `-- Case Results Import SQL\n`;
    sqlContent += `-- Generated from case.csv\n`;
    sqlContent += `-- ${new Date().toISOString()}\n\n`;
    
    sqlContent += `-- Önce mevcut kayıtları temizle (isteğe bağlı)\n`;
    sqlContent += `-- DELETE FROM myuni_case_result WHERE created_at < NOW();\n\n`;
    
    sqlContent += `BEGIN;\n\n`;
    
    for (const record of records) {
      // Sütun değerlerini al ve dönüştür
      const values: Record<string, any> = {};
      
      for (const [csvCol, sqlCol] of Object.entries(columnMapping)) {
        values[sqlCol] = record[csvCol];
      }
      
      // Zorunlu alanları kontrol et
      if (!values.participant_name || !values.contact_email) {
        console.warn(`⚠️  Satır atlandı - Zorunlu alan eksik:`, values);
        continue;
      }
      
      // SQL INSERT sorgusu oluştur
      sqlContent += `INSERT INTO myuni_case_result (\n`;
      sqlContent += `  participant_name,\n`;
      sqlContent += `  contact_email,\n`;
      sqlContent += `${values.backup_email ? '  backup_email,\n' : ''}`;
      sqlContent += `${values.subject ? '  subject,\n' : ''}`;
      sqlContent += `${values.highlight_direction ? '  highlight_direction,\n' : ''}`;
      sqlContent += `${values.general_score !== null && values.general_score !== undefined ? '  general_score,\n' : ''}`;
      sqlContent += `${values.comments ? '  comments,\n' : ''}`;
      sqlContent += `${values.second_instructor_score !== null && values.second_instructor_score !== undefined ? '  second_instructor_score,\n' : ''}`;
      sqlContent += `${values.average_score !== null && values.average_score !== undefined ? '  average_score,\n' : ''}`;
      sqlContent += `${values.second_comments ? '  second_comments,\n' : ''}`;
      sqlContent += `  created_at,\n`;
      sqlContent += `  updated_at\n`;
      sqlContent += `) VALUES (\n`;
      sqlContent += `  ${escapeSqlString(values.participant_name)},\n`;
      sqlContent += `  ${escapeSqlString(values.contact_email)},\n`;
      sqlContent += `${values.backup_email ? `  ${escapeSqlString(values.backup_email)},\n` : ''}`;
      sqlContent += `${values.subject ? `  ${escapeSqlString(values.subject)},\n` : ''}`;
      sqlContent += `${values.highlight_direction ? `  ${escapeSqlString(values.highlight_direction)},\n` : ''}`;
      sqlContent += `${values.general_score !== null && values.general_score !== undefined ? `  ${parseNumeric(values.general_score)},\n` : ''}`;
      sqlContent += `${values.comments ? `  ${escapeSqlString(values.comments)},\n` : ''}`;
      sqlContent += `${values.second_instructor_score !== null && values.second_instructor_score !== undefined ? `  ${parseNumeric(values.second_instructor_score)},\n` : ''}`;
      sqlContent += `${values.average_score !== null && values.average_score !== undefined ? `  ${parseNumeric(values.average_score)},\n` : ''}`;
      sqlContent += `${values.second_comments ? `  ${escapeSqlString(values.second_comments)},\n` : ''}`;
      sqlContent += `  NOW(),\n`;
      sqlContent += `  NOW()\n`;
      sqlContent += `);\n\n`;
    }
    
    sqlContent += `COMMIT;\n`;
    
    // SQL dosyasını kaydet
    const sqlPath = path.join(process.cwd(), 'sql', 'import-case-results.sql');
    fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
    
    console.log(`✅ SQL dosyası oluşturuldu: ${sqlPath}`);
    console.log(`📊 ${records.length} INSERT sorgusu hazırlandı`);
    console.log(`\n💡 Şimdi bu SQL dosyasını Supabase SQL Editor'da çalıştırabilirsiniz!`);
    
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

// Script'i çalıştır
convertCsvToSql();

