/**
 * Unit Test for GeneratorEngine and SalesforceService Mock Describe
 */
const GeneratorEngine = require('../src/services/generatorEngine');
const SalesforceService = require('../src/services/salesforceService');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('--- Starting SF DataForge Engine Tests ---');

  const sfService = new SalesforceService();
  sfService.enableMockMode();

  // Test 1: SObjects List
  const sobjects = await sfService.getSObjectsList();
  assert(Array.isArray(sobjects) && sobjects.length > 0, 'SObjects list returned successfully');
  assert(sobjects.some(o => o.name === 'Account'), 'Contains Account SObject');
  assert(sobjects.some(o => o.name === 'Project__c'), 'Contains custom Project__c SObject');

  // Test 2: Describe Account
  const accountDescribe = await sfService.describeSObject('Account');
  assert(accountDescribe && accountDescribe.fields.length > 0, 'Account describe returned fields');
  const nameField = accountDescribe.fields.find(f => f.name === 'Name');
  assert(nameField && nameField.required === true, 'Account.Name is marked as required');
  const typeField = accountDescribe.fields.find(f => f.name === 'Type');
  assert(typeField && typeField.type === 'picklist' && typeField.picklistValues.length > 0, 'Account.Type has picklist values');

  // Test 3: Generate records with realistic mode
  const fieldConfigs = {
    Name: { enabled: true, mode: 'realistic' },
    Type: { enabled: true, mode: 'picklist', picklistValue: '__RANDOM__' },
    AnnualRevenue: { enabled: true, mode: 'realistic', min: 50000, max: 200000 },
    BillingCity: { enabled: true, mode: 'realistic' },
    Active__c: { enabled: true, mode: 'realistic' }
  };

  const records = GeneratorEngine.generateRecords('Account', accountDescribe, fieldConfigs, 5);
  assert(records.length === 5, 'Generated exactly 5 records');
  assert(records[0].Name && typeof records[0].Name === 'string', 'Record 0 has valid Name');
  assert(records[0].Type && typeof records[0].Type === 'string', 'Record 0 has valid Picklist Type');
  assert(typeof records[0].AnnualRevenue === 'number', 'AnnualRevenue is numeric');
  assert(typeof records[0].Active__c === 'boolean', 'Active__c is boolean');

  // Test 4: Pattern Interpolation
  const patternConfig = {
    Name: { enabled: true, mode: 'pattern', pattern: 'QA-ACC-{{seq:100}}-{{random:3}}' }
  };
  const patternRecords = GeneratorEngine.generateRecords('Account', accountDescribe, patternConfig, 3);
  assert(patternRecords[0].Name.startsWith('QA-ACC-100-'), `Pattern record 0 matches prefix: ${patternRecords[0].Name}`);
  assert(patternRecords[1].Name.startsWith('QA-ACC-101-'), `Pattern record 1 matches prefix: ${patternRecords[1].Name}`);

  // Test 5: Mock Insert Records
  const insertResult = await sfService.insertRecords('Account', records);
  assert(insertResult.total === 5, 'Inserted 5 records');
  assert(insertResult.successCount === 5, 'All 5 records succeeded in mock insert');
  assert(insertResult.results[0].id.startsWith('001'), `Created Account record ID starts with 001 prefix: ${insertResult.results[0].id}`);

  console.log('--- All GeneratorEngine and SalesforceService Tests Passed! ---');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
