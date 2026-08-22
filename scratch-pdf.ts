import { FinancialService } from './src/financial/financial.service';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const service = new FinancialService(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any);
  
  const html = (service as any).buildPdfReportHtml({
    latitude: 24.713600,
    longitude: 46.675300,
    radius: 2000,
    places: Array.from({ length: 85 }).map((_, i) => ({
      name: 'موقع ' + i,
      type: ['تعليم', 'صحة', 'تجزئة وخدمات يومية', 'مطاعم وضيافة', 'نقل ووصول', 'بنوك وخدمات مالية', 'ترفيه ومساحات عامة', 'ديني ومجتمعي'][i % 8],
      distance: Math.random() * 2000,
      latitude: 24.713600 + (Math.random() - 0.5) * 0.01,
      longitude: 46.675300 + (Math.random() - 0.5) * 0.01,
      city: 'الرياض'
    })),
    generatedAt: new Date('2026-08-20T22:18:00'),
    locationName: 'حي النرجس - شارع الأمير محمد بن سلمان'
  });

  const pdfPath = '/home/mostafa/.gemini/antigravity-cli/brain/abd7cee0-aaca-4551-9e27-6874973ad1bb/report-preview.pdf';
  const htmlPath = '/tmp/report-preview.html';
  
  await (service as any).renderPdfFromHtml(html, htmlPath, pdfPath);
  console.log('PDF generated at ' + pdfPath);
}

main().catch(console.error);
