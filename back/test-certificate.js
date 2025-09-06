const express = require('express');
const { User, SystemSetting, SerialHistory, Activity, Serial } = require('./models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Test certificate generation
async function testCertificateGeneration() {
  try {
    console.log('🧪 เริ่มทดสอบระบบใบประกาศ...\n');

    // 1. ตรวจสอบไฟล์ template
    console.log('1. ตรวจสอบไฟล์ template...');
    const templatePath = path.join(__dirname, 'picture/ตัวเปล่า.png');
    const examplePath = path.join(__dirname, 'picture/ตัวอย่าง.png');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error('ไม่พบไฟล์ template: ตัวเปล่า.png');
    }
    if (!fs.existsSync(examplePath)) {
      throw new Error('ไม่พบไฟล์ตัวอย่าง: ตัวอย่าง.png');
    }
    console.log('✅ พบไฟล์ template และตัวอย่างแล้ว\n');

    // 2. ทดสอบการโหลดรูปภาพ
    console.log('2. ทดสอบการโหลดรูปภาพ...');
    const template = await Jimp.read(templatePath);
    console.log(`✅ โหลดรูปภาพสำเร็จ - ขนาด: ${template.getWidth()}x${template.getHeight()}\n`);

    // 3. ทดสอบการโหลด font
    console.log('3. ทดสอบการโหลด font...');
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    console.log('✅ โหลด font สำเร็จ\n');

    // 4. ทดสอบการเขียนข้อความลงรูปภาพ
    console.log('4. ทดสอบการเขียนข้อความลงรูปภาพ...');
    const testImage = template.clone();
    
    // ข้อมูลทดสอบ
    const testData = {
      studentName: 'นายทดสอบ ระบบ',
      studentId: 'TEST001',
      totalHours: 120,
      requiredHours: 100,
      currentDate: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // เขียนข้อความลงรูปภาพ
    testImage.print(font, 400, 300, testData.studentName);
    testImage.print(smallFont, 400, 350, `รหัสนักศึกษา: ${testData.studentId}`);
    testImage.print(smallFont, 400, 380, `ชั่วโมงที่ทำ: ${testData.totalHours} ชั่วโมง`);
    testImage.print(smallFont, 400, 410, `วันที่: ${testData.currentDate}`);

    // บันทึกรูปภาพทดสอบ
    const testOutputPath = path.join(__dirname, 'picture/test-output.png');
    await testImage.writeAsync(testOutputPath);
    console.log(`✅ เขียนข้อความลงรูปภาพสำเร็จ - บันทึกที่: ${testOutputPath}\n`);

    // 5. ทดสอบการสร้าง PDF
    console.log('5. ทดสอบการสร้าง PDF...');
    const pdfBuffer = await generateTestPDF(testImage);
    const pdfPath = path.join(__dirname, 'picture/test-certificate.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`✅ สร้าง PDF สำเร็จ - บันทึกที่: ${pdfPath}\n`);

    // 6. ทดสอบการเชื่อมต่อฐานข้อมูล
    console.log('6. ทดสอบการเชื่อมต่อฐานข้อมูล...');
    try {
      await require('./config/database').authenticate();
      console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ\n');
    } catch (error) {
      console.log('⚠️ ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (ปกติถ้าไม่ได้รัน server)\n');
    }

    // 7. ทดสอบการดึงข้อมูลจากฐานข้อมูล
    console.log('7. ทดสอบการดึงข้อมูลจากฐานข้อมูล...');
    try {
      const userCount = await User.count();
      const activityCount = await Activity.count();
      const serialHistoryCount = await SerialHistory.count();
      
      console.log(`📊 สถิติฐานข้อมูล:`);
      console.log(`   - ผู้ใช้: ${userCount} คน`);
      console.log(`   - กิจกรรม: ${activityCount} รายการ`);
      console.log(`   - ประวัติ Serial: ${serialHistoryCount} รายการ\n`);
    } catch (error) {
      console.log('⚠️ ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้\n');
    }

    console.log('🎉 การทดสอบเสร็จสิ้น!');
    console.log('\n📁 ไฟล์ที่สร้างขึ้น:');
    console.log(`   - ${testOutputPath}`);
    console.log(`   - ${pdfPath}`);
    console.log('\n💡 วิธีทดสอบ:');
    console.log('   1. เปิดไฟล์ test-output.png เพื่อดูรูปภาพที่เขียนข้อความแล้ว');
    console.log('   2. เปิดไฟล์ test-certificate.pdf เพื่อดูใบประกาศ PDF');
    console.log('   3. ตรวจสอบตำแหน่งข้อความว่าถูกต้องหรือไม่');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// ฟังก์ชันสร้าง PDF ทดสอบ
async function generateTestPDF(image) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape'
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      
      // แปลงรูปภาพเป็น buffer
      image.getBufferAsync(Jimp.MIME_PNG).then(imageBuffer => {
        // เพิ่มรูปภาพลง PDF
        doc.image(imageBuffer, 0, 0, { 
          width: 842, 
          height: 595,
          fit: [842, 595]
        });
        
        doc.end();
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

// ฟังก์ชันทดสอบ API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 ทดสอบ API Endpoints...\n');
  
  const testCases = [
    {
      name: 'ตรวจสอบสิทธิ์ใบประกาศ',
      method: 'GET',
      url: '/api/certificate/check-eligibility',
      description: 'ตรวจสอบว่านักเรียนมีสิทธิ์ได้รับใบประกาศหรือไม่'
    },
    {
      name: 'สร้างใบประกาศ',
      method: 'GET', 
      url: '/api/certificate/generate/1',
      description: 'สร้างและดาวน์โหลดใบประกาศ PDF'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}`);
    console.log(`   Method: ${testCase.method}`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   Description: ${testCase.description}`);
    console.log('');
  });

  console.log('💡 วิธีทดสอบ API:');
  console.log('   1. รัน server: npm run dev');
  console.log('   2. ใช้ Postman หรือ curl ทดสอบ endpoints');
  console.log('   3. หรือเข้าผ่าน frontend ที่ /student/certificate');
}

// ฟังก์ชันทดสอบการติดตั้ง dependencies
async function testDependencies() {
  console.log('\n📦 ตรวจสอบ Dependencies...\n');
  
  const requiredPackages = [
    'pdfkit',
    'jimp', 
    'canvas',
    'express',
    'sequelize'
  ];

  for (const pkg of requiredPackages) {
    try {
      require(pkg);
      console.log(`✅ ${pkg} - ติดตั้งแล้ว`);
    } catch (error) {
      console.log(`❌ ${pkg} - ยังไม่ได้ติดตั้ง`);
    }
  }
}

// ฟังก์ชันหลัก
async function runTests() {
  console.log('🚀 เริ่มทดสอบระบบใบประกาศนียบัตร\n');
  console.log('=' .repeat(50));
  
  // ทดสอบ dependencies
  await testDependencies();
  
  console.log('\n' + '=' .repeat(50));
  
  // ทดสอบการสร้างใบประกาศ
  await testCertificateGeneration();
  
  console.log('\n' + '=' .repeat(50));
  
  // แสดงข้อมูล API endpoints
  await testAPIEndpoints();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ การทดสอบเสร็จสิ้น!');
}

// รันการทดสอบ
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCertificateGeneration,
  testAPIEndpoints,
  testDependencies,
  runTests
};
