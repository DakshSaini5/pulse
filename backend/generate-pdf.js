const fs = require('fs');
const PDFDocument = require('pdfkit');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('c:\\Users\\DAKSH PC\\OneDrive\\Desktop\\Dummy_Medical_Report.pdf'));

doc.fontSize(20).text('COMPREHENSIVE PATHOLOGY REPORT', { align: 'center' });
doc.moveDown();

doc.fontSize(12).text('Patient Name: John Doe');
doc.text('Age/Gender: 45 / Male');
doc.text('Date of Collection: October 24, 2024');
doc.text('Report ID: RPT-99201A');
doc.moveDown();
doc.text('----------------------------------------------------');
doc.moveDown();

doc.fontSize(16).text('1. COMPLETE BLOOD COUNT (CBC)');
doc.moveDown();
doc.fontSize(12).text('Hemoglobin (Hb): 11.2 g/dL (Range: 13.0 - 17.0)');
doc.text('Total WBC Count: 6,500 cells/mcL (Range: 4,000 - 11,000)');
doc.text('Platelet Count: 185,000 cells/mcL (Range: 150,000 - 450,000)');
doc.moveDown();

doc.fontSize(16).text('2. THYROID PROFILE');
doc.moveDown();
doc.fontSize(12).text('Thyroid Stimulating Hormone (TSH): 5.85 uIU/mL (Range: 0.40 - 4.50)');
doc.text('Free T4 (Thyroxine): 1.1 ng/dL (Range: 0.8 - 1.8)');
doc.moveDown();

doc.fontSize(16).text('3. LIPID PANEL');
doc.moveDown();
doc.fontSize(12).text('Total Cholesterol: 240 mg/dL (Range: < 200)');
doc.text('Triglycerides: 165 mg/dL (Range: < 150)');
doc.text('HDL (Good Cholesterol): 45 mg/dL (Range: > 40)');
doc.text('LDL (Bad Cholesterol): 162 mg/dL (Range: < 100)');
doc.moveDown();

doc.fontSize(16).text('4. METABOLIC PANEL');
doc.moveDown();
doc.fontSize(12).text('Fasting Blood Glucose: 115 mg/dL (Range: 70 - 100)');
doc.text('HbA1c: 6.1 % (Range: < 5.7)');
doc.moveDown(2);

doc.fontSize(10).text('Electronically verified by Pulse Diagnostics Lab', { align: 'center', italic: true });

doc.end();

console.log('PDF generated successfully on Desktop!');
