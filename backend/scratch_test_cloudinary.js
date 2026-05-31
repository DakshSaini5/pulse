const cloudinary = require('cloudinary').v2;

const cloudNames = ['dcha2jqfo', 'dcha2jqf0', 'dcha2jgfo', 'dcha2jgf0'];
const apiKey = '354338881984514';

function getSecretVariations() {
  const variations = [];
  
  const v_opts = ['V', 'v'];
  const h_opts = ['H', 'h'];
  const p5_opts = ['IiaIb', 'liaIb', 'lialb', 'Iialb', '1ia1b', '1iaIb', 'Iia1b', 'lia1b', 'lialB', 'IiaIB'];
  const p6_opts = ['_-', '_', '-'];
  const p7_opts = ['soKs', 'SoKs', 'soks', 'sOKs'];
  const p8_opts = ['Xz6v', 'xz6v'];
  const p9_opts = ['-', '_'];
  const p10_opts = ['i_Ws', 'i_ws', 'I_Ws', 'I_ws', 'i-Ws', 'i-ws'];
  
  for (const v of v_opts) {
    for (const h of h_opts) {
      for (const p5 of p5_opts) {
        for (const p6 of p6_opts) {
          for (const p7 of p7_opts) {
            for (const p8 of p8_opts) {
              for (const p9 of p9_opts) {
                for (const p10 of p10_opts) {
                  variations.push(`9_${v}${h}gqd${p5}${p6}${p7}${p8}${p9}${p10}`);
                }
              }
            }
          }
        }
      }
    }
  }
  
  return [...new Set(variations)];
}

async function testSingle(cloud, secret) {
  // Use a separate local instance of cloudinary or configure it dynamically
  const instance = require('cloudinary').v2;
  instance.config({
    cloud_name: cloud,
    api_key: apiKey,
    api_secret: secret,
    secure: true
  });
  
  try {
    await instance.uploader.upload('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', {
      folder: 'test_connection',
      public_id: `test-${Date.now()}`
    });
    return true;
  } catch (err) {
    if (!err.message.includes('Invalid Signature')) {
      console.log(`Non-signature error for cloud ${cloud}, secret ${secret}: ${err.message}`);
    }
    return false;
  }
}

async function test() {
  const secrets = getSecretVariations();
  console.log(`Generated ${secrets.length} secret variations to test.`);
  
  const batchSize = 100;
  let combinations = [];
  
  for (const cloud of cloudNames) {
    for (const secret of secrets) {
      combinations.push({ cloud, secret });
    }
  }
  
  console.log(`Total combinations to test: ${combinations.length}`);
  
  for (let i = 0; i < combinations.length; i += batchSize) {
    const batch = combinations.slice(i, i + batchSize);
    console.log(`Testing batch ${i / batchSize + 1} of ${Math.ceil(combinations.length / batchSize)}...`);
    
    const results = await Promise.all(batch.map(async ({ cloud, secret }) => {
      const success = await testSingle(cloud, secret);
      if (success) {
        console.log(`\n\n🎉 SUCCESS!!! Found correct combination:`);
        console.log(`cloud_name: ${cloud}`);
        console.log(`api_secret: ${secret}`);
        process.exit(0);
      }
    }));
  }
  
  console.log("All combinations failed.");
}

test();
