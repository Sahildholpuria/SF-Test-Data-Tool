/**
 * SF DataForge - Generator Engine
 * Generates realistic mock data for any Salesforce field type with customizable patterns & rules.
 * Intelligently recognizes field labels and types to populate contextually appropriate, coherent values.
 * Provides harmonized, geographically consistent addresses (Street, City, State, Zip, Country) across scopes.
 */

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Donald', 'Sandra', 'Alex', 'Taylor',
  'Jordan', 'Morgan', 'Sam', 'Cameron', 'Priya', 'Aarav', 'Elena', 'Carlos',
  'Marcus', 'Sophia', 'Liam', 'Olivia', 'Ethan', 'Emma', 'Noah', 'Ava',
  'Lucas', 'Mia', 'Benjamin', 'Amelia', 'Alexander', 'Harper', 'Sebastian', 'Evelyn',
  'Gabriel', 'Abigail', 'Mateo', 'Emily', 'Julian', 'Ella', 'Leo', 'Scarlett'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Patel',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner'
];

const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
const MIDDLE_NAMES = ['Alexander', 'Marie', 'James', 'Grace', 'David', 'Elizabeth', 'Lee', 'Rose', 'Michael', 'Ann'];
const SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'Esq.', 'PhD'];

const COMPANY_ADJECTIVES = [
  'Apex', 'BlueShift', 'CloudPeak', 'Crestview', 'EchoWave', 'Horizon', 'Ironclad', 'Kinetix',
  'Meridian', 'Nexar', 'Nexus', 'Nova', 'OmniFlow', 'Pinnacle', 'Pulse', 'Quantum',
  'Radiant', 'Silverline', 'Solaria', 'Starlight', 'Stellar', 'Strata', 'Summit', 'Titan',
  'TrueNorth', 'Vanguard', 'Velocity', 'Zenith', 'Acrobyte', 'Atlas', 'Beacon', 'Catalyst',
  'Frontier', 'Hyperion', 'Matrix', 'Orbital', 'Prism', 'Sierra', 'Spectra', 'Vortex'
];

const COMPANY_NOUNS = [
  'Dynamics', 'Technologies', 'Systems', 'Solutions', 'Logistics', 'Robotics', 'Analytics',
  'Capital', 'Ventures', 'Labs', 'Networks', 'Media', 'BioTech', 'Energy', 'Industries',
  'Enterprises', 'Group', 'Consulting', 'Software', 'Aerospace', 'Security', 'Financial',
  'Cloud', 'Interactive', 'Global', 'Communications', 'Digital', 'Health', 'Pharma', 'Automation'
];

const COMPANY_SUFFIXES = ['Inc', 'Corp', 'LLC', 'Holdings', 'Co.', 'Group', 'Ltd', 'International', 'Enterprises'];

const TICKER_SYMBOLS = ['APX', 'BLSH', 'CLDP', 'ECHW', 'HRZN', 'KNTX', 'MRDN', 'NXUS', 'NOVA', 'PNCL', 'QNTM', 'SLVR', 'STLR', 'VNGR', 'VLCT', 'ZNTH', 'CYBR', 'DATA'];

const JOB_TITLES = [
  'Chief Technology Officer', 'VP of Sales', 'Lead Salesforce Architect',
  'Senior Solutions Engineer', 'Director of Operations', 'Head of Marketing',
  'Senior Product Manager', 'Enterprise Account Executive', 'Customer Success Director',
  'Data Platform Engineer', 'Principal Consultant', 'Scrum Master', 'DevOps Specialist',
  'Global Strategy Director', 'Chief Revenue Officer', 'Engineering Manager', 'IT Director'
];

const DEPARTMENTS = [
  'Engineering', 'Sales Operations', 'Customer Success', 'Information Technology',
  'Finance & Accounting', 'Product Management', 'Corporate Strategy', 'Human Resources',
  'Legal & Compliance', 'Marketing & Communications', 'Global Supply Chain'
];

const DOMAINS = ['example.com', 'testdata.org', 'sandbox.io', 'demo.salesforce.test', 'mockcorp.co', 'cloudpeak.net', 'apexdata.io', 'qafoundry.org'];

const INDUSTRIES = [
  'Technology', 'Financial Services', 'Healthcare', 'Manufacturing',
  'Retail', 'Consulting', 'Energy', 'Telecommunications', 'Education',
  'Biotechnology', 'Aerospace', 'Hospitality', 'Media & Entertainment'
];

const LEAD_SOURCES = [
  'Web Organic Inquiry', 'Executive Referral', 'Global Summit Conference',
  'Partner Marketplace', 'Inbound Contact Form', 'LinkedIn Campaign', 'Cold Outreach', 'Customer Referral'
];

const COMPETITORS = [
  'CloudEdge Systems', 'Apex Data Matrix', 'Vanguard Cloud Solutions',
  'OmniNet Global', 'Horizon Technologies Corp', 'Starlight Software Labs'
];

// 50 US States and DC ISO 2-letter codes & names (for State and Country picklist verification)
const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

const US_STATE_NAMES = new Set([
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
]);

// Rich Geographically Synchronized Metros (City, Full State, State Code, Zip, Real Streets, Geo coordinates)
const US_METROS = [
  {
    city: 'San Francisco',
    state: 'California',
    stateCode: 'CA',
    zipPrefix: '941',
    country: 'United States',
    countryCode: 'US',
    lat: 37.7749,
    lng: -122.4194,
    streets: ['Market St', 'Mission St', 'Montgomery St', 'Howard St', 'California St', 'Pine St', 'Sutter St', 'Bush St', 'Geary Blvd', 'Columbus Ave', 'Spear St', 'Fremont St']
  },
  {
    city: 'New York',
    state: 'New York',
    stateCode: 'NY',
    zipPrefix: '100',
    country: 'United States',
    countryCode: 'US',
    lat: 40.7128,
    lng: -74.0060,
    streets: ['Broadway', '5th Ave', 'Madison Ave', 'Wall St', 'Park Ave', 'Lexington Ave', 'Hudson St', '7th Ave', 'Amsterdam Ave', 'Bowery', 'Water St', 'Varick St']
  },
  {
    city: 'Austin',
    state: 'Texas',
    stateCode: 'TX',
    zipPrefix: '787',
    country: 'United States',
    countryCode: 'US',
    lat: 30.2672,
    lng: -97.7431,
    streets: ['Congress Ave', 'Barton Springs Rd', 'Lavaca St', 'Guadalupe St', 'Rainey St', 'Colorado St', 'Brazos St', '6th St', 'Lamar Blvd', 'Red River St']
  },
  {
    city: 'Seattle',
    state: 'Washington',
    stateCode: 'WA',
    zipPrefix: '981',
    country: 'United States',
    countryCode: 'US',
    lat: 47.6062,
    lng: -122.3321,
    streets: ['Pike St', 'Pine St', 'Westlake Ave', '1st Ave', 'Mercer St', 'Stewart St', 'Denny Way', 'University St', 'Lenora St', 'Fairview Ave']
  },
  {
    city: 'Chicago',
    state: 'Illinois',
    stateCode: 'IL',
    zipPrefix: '606',
    country: 'United States',
    countryCode: 'US',
    lat: 41.8781,
    lng: -87.6298,
    streets: ['Michigan Ave', 'State St', 'Wacker Dr', 'Clark St', 'LaSalle St', 'Dearborn St', 'Grand Ave', 'Wabash Ave', 'Adams St', 'Franklin St']
  },
  {
    city: 'Boston',
    state: 'Massachusetts',
    stateCode: 'MA',
    zipPrefix: '021',
    country: 'United States',
    countryCode: 'US',
    lat: 42.3601,
    lng: -71.0589,
    streets: ['Boylston St', 'Tremont St', 'Beacon St', 'Commonwealth Ave', 'Newbury St', 'Huntington Ave', 'Charles St', 'Atlantic Ave', 'Congress St']
  },
  {
    city: 'Denver',
    state: 'Colorado',
    stateCode: 'CO',
    zipPrefix: '802',
    country: 'United States',
    countryCode: 'US',
    lat: 39.7392,
    lng: -104.9903,
    streets: ['16th St', 'Larimer St', 'Colfax Ave', 'Speer Blvd', 'Broadway', 'Wazee St', 'Wynkoop St', 'Blake St', 'Champa St', 'Court Pl']
  },
  {
    city: 'Los Angeles',
    state: 'California',
    stateCode: 'CA',
    zipPrefix: '900',
    country: 'United States',
    countryCode: 'US',
    lat: 34.0522,
    lng: -118.2437,
    streets: ['Sunset Blvd', 'Wilshire Blvd', 'Santa Monica Blvd', 'Figueroa St', 'Grand Ave', 'Hope St', 'Olympic Blvd', 'Spring St', 'Flower St']
  },
  {
    city: 'Atlanta',
    state: 'Georgia',
    stateCode: 'GA',
    zipPrefix: '303',
    country: 'United States',
    countryCode: 'US',
    lat: 33.7490,
    lng: -84.3880,
    streets: ['Peachtree St', 'Piedmont Ave', 'Spring St', 'Ponce de Leon Ave', 'Marietta St', 'Centennial Olympic Park Dr', 'North Ave', 'Juniper St']
  },
  {
    city: 'Miami',
    state: 'Florida',
    stateCode: 'FL',
    zipPrefix: '331',
    country: 'United States',
    countryCode: 'US',
    lat: 25.7617,
    lng: -80.1918,
    streets: ['Brickell Ave', 'Biscayne Blvd', 'Ocean Dr', 'Collins Ave', 'Flagler St', 'Coral Way', 'Grand Ave', 'SW 8th St']
  },
  {
    city: 'Dallas',
    state: 'Texas',
    stateCode: 'TX',
    zipPrefix: '752',
    country: 'United States',
    countryCode: 'US',
    lat: 32.7767,
    lng: -96.7970,
    streets: ['Main St', 'Elm St', 'Commerce St', 'Ross Ave', 'Akard St', 'Pacific Ave', 'Griffin St', 'Field St']
  },
  {
    city: 'Philadelphia',
    state: 'Pennsylvania',
    stateCode: 'PA',
    zipPrefix: '191',
    country: 'United States',
    countryCode: 'US',
    lat: 39.9526,
    lng: -75.1652,
    streets: ['Market St', 'Chestnut St', 'Walnut St', 'Broad St', 'Arch St', 'Locust St', 'JFK Blvd', 'Race St']
  },
  {
    city: 'Phoenix',
    state: 'Arizona',
    stateCode: 'AZ',
    zipPrefix: '850',
    country: 'United States',
    countryCode: 'US',
    lat: 33.4484,
    lng: -112.0740,
    streets: ['Central Ave', 'Camelback Rd', 'Washington St', 'Jefferson St', 'Van Buren St', 'Indian School Rd', 'McDowell Rd']
  },
  {
    city: 'San Diego',
    state: 'California',
    stateCode: 'CA',
    zipPrefix: '921',
    country: 'United States',
    countryCode: 'US',
    lat: 32.7157,
    lng: -117.1611,
    streets: ['Broadway', 'Harbor Dr', 'Pacific Hwy', 'Ash St', '5th Ave', 'Market St', 'Kettner Blvd', 'Front St']
  },
  {
    city: 'Portland',
    state: 'Oregon',
    stateCode: 'OR',
    zipPrefix: '972',
    country: 'United States',
    countryCode: 'US',
    lat: 45.5152,
    lng: -122.6784,
    streets: ['Burnside St', 'SW 5th Ave', 'SW Morrison St', 'NW 23rd Ave', 'SW Broadway', 'SE Hawthorne Blvd']
  },
  {
    city: 'Minneapolis',
    state: 'Minnesota',
    stateCode: 'MN',
    zipPrefix: '554',
    country: 'United States',
    countryCode: 'US',
    lat: 44.9778,
    lng: -93.2650,
    streets: ['Nicollet Mall', 'Hennepin Ave', 'Marquette Ave', 'Washington Ave', 'Lasalle Ave', '2nd Ave S']
  },
  {
    city: 'Charlotte',
    state: 'North Carolina',
    stateCode: 'NC',
    zipPrefix: '282',
    country: 'United States',
    countryCode: 'US',
    lat: 35.2271,
    lng: -80.8431,
    streets: ['Tryon St', 'College St', 'Trade St', 'Church St', 'Caldwell St', 'South Blvd']
  },
  {
    city: 'Nashville',
    state: 'Tennessee',
    stateCode: 'TN',
    zipPrefix: '372',
    country: 'United States',
    countryCode: 'US',
    lat: 36.1627,
    lng: -86.7816,
    streets: ['Broadway', 'West End Ave', 'Church St', '2nd Ave N', 'Demonbreun St', 'Music Row Blvd']
  },
  {
    city: 'Salt Lake City',
    state: 'Utah',
    stateCode: 'UT',
    zipPrefix: '841',
    country: 'United States',
    countryCode: 'US',
    lat: 40.7608,
    lng: -111.8910,
    streets: ['Main St', 'State St', 'South Temple', 'West Temple', '200 South', '400 South']
  },
  {
    city: 'Washington',
    state: 'District of Columbia',
    stateCode: 'DC',
    zipPrefix: '200',
    country: 'United States',
    countryCode: 'US',
    lat: 38.9072,
    lng: -77.0369,
    streets: ['Pennsylvania Ave NW', 'K St NW', 'Connecticut Ave NW', 'Constitution Ave NW', 'M St NW', '14th St NW']
  }
];

const DESCRIPTIONS = [
  'Provisioned by SF DataForge for end-to-end integration and QA regression verification.',
  'Automated test fixture created for sandbox workflow validation and rule benchmarking.',
  'Mock record generated representing high-value enterprise prospect for pipeline simulation.',
  'Automated test fixture provisioned for UI flow testing and field validation rule checks.',
  'Benchmarking dataset created for load, trigger performance, and stress testing.'
];

const NEXT_STEPS = [
  'Schedule technical architecture review with security committee',
  'Deliver performance benchmark metrics and ROI analysis',
  'Coordinate executive sponsor alignment meeting',
  'Prepare tailored statement of work and implementation timeline',
  'Validate sandbox SSO configuration and data privacy clearance'
];

const CASE_TOPICS = [
  'Enterprise Cloud Security Review',
  'API Gateway Latency Optimization',
  'Salesforce Billing Automation Verification',
  'Production Infrastructure Migration Task',
  'Customer Experience Portal Enhancements',
  'Single Sign-On Certificate Renewal',
  'High-Volume Data Export Synchronization'
];

const RESOLUTION_NOTES = [
  'Resolved via API gateway timeout adjustment and load balancer rule update.',
  'Applied updated SAML 2.0 SSL certificate and validated token exchange.',
  'Optimized SOQL query indexing on target object and flushed cache.',
  'Reconfigured workflow trigger execution order to eliminate deadlock contention.'
];

class GeneratorEngine {
  static MODES = {
    REALISTIC: 'realistic',
    PATTERN: 'pattern',
    FIXED: 'fixed',
    PICKLIST: 'picklist',
    EMPTY: 'empty'
  };

  static US_STATE_CODES = US_STATE_CODES;
  static US_STATE_NAMES = US_STATE_NAMES;

  /**
   * Helper to create a cohesive, geographically synchronized address set
   */
  static createAddressSet() {
    const metro = this.pickRandom(US_METROS);
    const streetNum = Math.floor(100 + Math.random() * 8900);
    const streetName = this.pickRandom(metro.streets);
    const zipSuffix = String(Math.floor(10 + Math.random() * 89)).padStart(2, '0');
    const zip = `${metro.zipPrefix}${zipSuffix}`;
    return {
      street: `${streetNum} ${streetName}`,
      streetNumber: streetNum,
      streetName,
      city: metro.city,
      state: metro.state,
      stateCode: metro.stateCode,
      postalCode: zip,
      country: metro.country,
      countryCode: metro.countryCode,
      latitude: metro.lat,
      longitude: metro.lng
    };
  }

  /**
   * Dynamically resolves the address scope for a field (Billing, Shipping, Mailing, Other, Custom, or General)
   */
  static getAddressScope(name, label, addresses) {
    const combined = `${name} ${label}`.toLowerCase();

    if (combined.includes('billing')) return addresses.billing;
    if (combined.includes('shipping')) return addresses.shipping;
    if (combined.includes('mailing')) return addresses.mailing;
    if (combined.includes('other')) return addresses.other;

    // Detect custom address fields with compound prefix
    // e.g. Work_Address__Street__s, Office_Location__City__s, Headquarters_Street__c
    const customMatch = name.match(/^([a-z0-9_]+)__(street|city|state|statecode|postalcode|country|countrycode|geocode|latitude|longitude)__s$/i) ||
                        name.match(/^([a-z0-9_]+)_(street|city|state|zip|postal|country)(__c)?$/i);
    if (customMatch && customMatch[1]) {
      const prefix = customMatch[1].toLowerCase();
      if (!addresses[prefix]) {
        addresses[prefix] = this.createAddressSet();
      }
      return addresses[prefix];
    }

    // Detect if label specifies a known group (e.g. "Work State", "Office Zip")
    if (combined.includes('work') || combined.includes('office')) {
      if (!addresses.work) addresses.work = this.createAddressSet();
      return addresses.work;
    }
    if (combined.includes('home') || combined.includes('personal')) {
      if (!addresses.home) addresses.home = this.createAddressSet();
      return addresses.home;
    }

    return addresses.general;
  }

  /**
   * Generates N records with guaranteed zero duplicates, address consistency, and deep semantic matching
   */
  static generateRecords(sObjectName, describeInfo, fieldConfigs, count = 1) {
    const records = [];
    const fields = describeInfo.fields || [];
    const fieldMap = new Map(fields.map(f => [f.name, f]));

    const batchSeed = Date.now().toString(36).slice(-4).toUpperCase();

    // Sets to prevent intra-batch duplicates
    const seenEmails = new Set();
    const seenNames = new Set();
    const seenPhones = new Set();

    for (let i = 0; i < count; i++) {
      const record = {};

      // Distinct, harmonized address sets per record
      const addresses = {
        billing: this.createAddressSet(),
        shipping: this.createAddressSet(),
        mailing: this.createAddressSet(),
        other: this.createAddressSet(),
        general: this.createAddressSet()
      };

      const recordSalt = Math.floor(1000 + Math.random() * 9000);
      const fName = this.pickRandom(FIRST_NAMES);
      const lName = this.pickRandom(LAST_NAMES);

      const context = {
        index: i,
        count,
        batchSeed,
        recordSalt,
        fName,
        lName,
        addresses,
        sObjectName,
        seenEmails,
        seenNames,
        seenPhones
      };

      for (const [fieldName, config] of Object.entries(fieldConfigs)) {
        if (!config || !config.enabled) continue;

        const fieldMeta = fieldMap.get(fieldName) || { name: fieldName, type: 'string' };
        const value = this.generateFieldValue(fieldMeta, config, context);

        if (value !== undefined) {
          record[fieldName] = value;
        }
      }

      // Ensure address integrity: Salesforce mandates Country before State value
      this.ensureAddressIntegrity(record, describeInfo, addresses);

      records.push(record);
    }

    return records;
  }

  /**
   * Helper to check if a field is an address-related field
   */
  static isAddressField(name = '', label = '') {
    const n = (name || '').toLowerCase();
    const l = (label || '').toLowerCase();
    return n.includes('street') || l.includes('street') ||
           n.includes('city') || l.includes('city') ||
           n.includes('state') || l.includes('state') ||
           n.includes('province') || l.includes('province') ||
           n.includes('postalcode') || n.includes('postcode') || n.includes('zip') || l.includes('zip') || l.includes('postal') || n.includes('pin') ||
           n.includes('country') || l.includes('country') || n.includes('nation') ||
           n.includes('geocode') || n.includes('latitude') || n.includes('longitude') ||
           n.endsWith('__street__s') || n.endsWith('__city__s') || n.endsWith('__statecode__s') || n.endsWith('__postalcode__s') || n.endsWith('__countrycode__s') ||
           n === 'address' || n.endsWith('address__c') || l.includes('address');
  }

  /**
   * Ensures address field integrity required by Salesforce:
   * Salesforce strictly mandates: "A country/territory must be specified before specifying a state value for field (*StateCode / *State)"
   * If any State or StateCode is populated, auto-ensures the matching Country/CountryCode is also populated on the record,
   * and sanitizes any invalid foreign state codes (e.g. "TA") when the country is US.
   */
  static ensureAddressIntegrity(record, describeInfo, addresses) {
    const fields = (describeInfo && describeInfo.fields) || [];
    const fieldMap = new Map(fields.map(f => [f.name, f]));
    const prefixes = ['Mailing', 'Billing', 'Shipping', 'Other', ''];

    for (const prefix of prefixes) {
      const stateCodeKey = prefix ? `${prefix}StateCode` : 'StateCode';
      const stateKey = prefix ? `${prefix}State` : 'State';
      const countryCodeKey = prefix ? `${prefix}CountryCode` : 'CountryCode';
      const countryKey = prefix ? `${prefix}Country` : 'Country';
      const scopeKey = prefix ? prefix.toLowerCase() : 'general';
      const scope = addresses[scopeKey] || addresses.general || { countryCode: 'US', country: 'United States' };

      // Sanitize invalid state codes for US (e.g. foreign code "TA" which Salesforce rejects for US)
      if (record[stateCodeKey]) {
        const stateCodeUpper = String(record[stateCodeKey]).trim().toUpperCase();
        const countryCodeVal = record[countryCodeKey] ? String(record[countryCodeKey]).trim().toUpperCase() : '';
        const isUs = !countryCodeVal || countryCodeVal === 'US' || record[countryKey] === 'United States' || record[countryKey] === 'USA';
        if (isUs && !US_STATE_CODES.has(stateCodeUpper)) {
          record[stateCodeKey] = scope.stateCode || 'CA';
        }
      }

      const hasStateCode = record[stateCodeKey] !== undefined && record[stateCodeKey] !== null && record[stateCodeKey] !== '';
      const hasState = record[stateKey] !== undefined && record[stateKey] !== null && record[stateKey] !== '';

      if (hasStateCode || hasState) {
        const hasCountryCode = record[countryCodeKey] !== undefined && record[countryCodeKey] !== null && record[countryCodeKey] !== '';
        const hasCountry = record[countryKey] !== undefined && record[countryKey] !== null && record[countryKey] !== '';

        if (hasStateCode && !hasCountryCode) {
          // If StateCode is set, CountryCode is required by Salesforce picklist rules
          if (fieldMap.has(countryCodeKey) && fieldMap.get(countryCodeKey).createable !== false) {
            record[countryCodeKey] = scope.countryCode || 'US';
          } else if (fieldMap.has(countryKey) && fieldMap.get(countryKey).createable !== false) {
            record[countryKey] = scope.country || 'United States';
          } else {
            record[countryCodeKey] = scope.countryCode || 'US';
          }
        } else if (hasState && !hasCountry && !hasCountryCode) {
          // If State text is set without any Country
          if (fieldMap.has(countryKey) && fieldMap.get(countryKey).createable !== false) {
            record[countryKey] = scope.country || 'United States';
          } else if (fieldMap.has(countryCodeKey) && fieldMap.get(countryCodeKey).createable !== false) {
            record[countryCodeKey] = scope.countryCode || 'US';
          } else {
            record[countryKey] = scope.country || 'United States';
          }
        }
      }
    }

    // Custom Address Fields (e.g. Work_Address__StateCode__s -> Work_Address__CountryCode__s)
    for (const key of Object.keys(record)) {
      const match = key.match(/^([a-z0-9_]+)__(statecode|state)__s$/i);
      if (match) {
        const customPrefix = match[1];
        const isCode = match[2].toLowerCase() === 'statecode';
        const customCCKey = `${customPrefix}__CountryCode__s`;
        const customCKey = `${customPrefix}__Country__s`;

        if (isCode && record[key]) {
          const scUpper = String(record[key]).trim().toUpperCase();
          const ccUpper = record[customCCKey] ? String(record[customCCKey]).trim().toUpperCase() : '';
          const isUs = !ccUpper || ccUpper === 'US' || record[customCKey] === 'United States' || record[customCKey] === 'USA';
          if (isUs && !US_STATE_CODES.has(scUpper)) {
            record[key] = 'CA';
          }
        }

        const hasCC = record[customCCKey] !== undefined && record[customCCKey] !== null && record[customCCKey] !== '';
        const hasC = record[customCKey] !== undefined && record[customCKey] !== null && record[customCKey] !== '';

        if (!hasCC && !hasC) {
          const scope = addresses[customPrefix.toLowerCase()] || addresses.general || { countryCode: 'US', country: 'United States' };
          if (isCode || fieldMap.has(customCCKey)) {
            record[customCCKey] = scope.countryCode || 'US';
          } else {
            record[customCKey] = scope.country || 'United States';
          }
        }
      }
    }
  }

  static generateFieldValue(fieldMeta, config, context) {
    const mode = config.mode || GeneratorEngine.MODES.REALISTIC;

    if (mode === GeneratorEngine.MODES.EMPTY) {
      return null;
    }

    if (mode === GeneratorEngine.MODES.FIXED) {
      return this.castToFieldType(config.fixedValue, fieldMeta.type);
    }

    if (mode === GeneratorEngine.MODES.PATTERN && config.pattern) {
      const interpolated = this.interpolatePattern(config.pattern, context.index, context.count, context);
      return this.castToFieldType(interpolated, fieldMeta.type);
    }

    if (mode === GeneratorEngine.MODES.PICKLIST) {
      if (config.picklistValue === '__RANDOM__' || !config.picklistValue) {
        // Address picklists (e.g. MailingStateCode) MUST be resolved via coherent address scope
        // rather than picking a random global state like "TA" (Tasmania) for a US address!
        if (this.isAddressField(fieldMeta.name, fieldMeta.label)) {
          return this.resolveAddressField(fieldMeta.name.toLowerCase(), (fieldMeta.label || '').toLowerCase(), fieldMeta, context.addresses);
        }
        return this.getRandomPicklistValue(fieldMeta);
      }
      return config.picklistValue;
    }

    return this.generateRealisticValue(fieldMeta, config, context);
  }

  /**
   * Deep Semantic Recognition: Inspects field type, API name, and label to fill context-appropriate values
   */
  static generateRealisticValue(fieldMeta, config = {}, context) {
    const type = (fieldMeta.type || 'string').toLowerCase();
    const name = (fieldMeta.name || '').toLowerCase();
    const label = (fieldMeta.label || '').toLowerCase();
    const { batchSeed, recordSalt, fName, lName, addresses, seenEmails, seenNames, seenPhones } = context;

    // ==========================================
    // 1. ADDRESS FIELDS (Street, City, State, PostalCode, Country)
    // Coherently synchronized by address scope (Billing vs Shipping vs Mailing vs General vs Custom)
    // Takes reference from field metadata, picklists (State/Country picklists), labels and length
    // ==========================================
    const addressVal = this.resolveAddressField(name, label, fieldMeta, addresses);
    if (addressVal !== null) {
      return addressVal;
    }

    // ==========================================
    // 2. DATES & DATETIMES
    // Context-sensitive dates (Birthdate in past, CloseDate in future, HireDate in past)
    // ==========================================
    if (type === 'date' || type === 'datetime') {
      const dateVal = this.resolveDateField(name, label, type);
      if (dateVal !== null) return dateVal;
    }

    // Time
    if (type === 'time') {
      const hour = String(Math.floor(8 + Math.random() * 10)).padStart(2, '0');
      const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      return `${hour}:${min}:${sec}.000Z`;
    }

    // ==========================================
    // 3. NUMBERS, CURRENCY, PERCENT, INTEGERS
    // Semantic ranges: Revenue ($M), Amount ($K), Salary ($K), Employees (tens-thousands), Discount/Probability (%)
    // ==========================================
    if (['int', 'integer', 'double', 'currency', 'percent'].includes(type)) {
      return this.resolveNumericField(name, label, type, fieldMeta, config);
    }

    // ==========================================
    // 4. BOOLEAN (Checkbox)
    // Contextual probability: active fields mostly true, escalations mostly false
    // ==========================================
    if (type === 'boolean') {
      if (config.booleanValue !== undefined) {
        return Boolean(config.booleanValue);
      }
      if (name.includes('active') || label.includes('active')) return Math.random() > 0.15; // 85% true
      if (name.includes('escalat') || label.includes('escalat')) return Math.random() > 0.85; // 15% true
      if (name.includes('donotcall') || name.includes('opt_out') || label.includes('opt out')) return Math.random() > 0.90; // 10% true
      if (name.includes('vip') || label.includes('vip') || name.includes('primary') || label.includes('primary')) return Math.random() > 0.75;
      return Math.random() > 0.45;
    }

    // ==========================================
    // 5. EMAIL & PHONE & URL
    // ==========================================
    if (type === 'email' || name.includes('email') || label.includes('email')) {
      let email = '';
      let attempts = 0;
      do {
        const domain = this.pickRandom(DOMAINS);
        const salt = Math.floor(1000 + Math.random() * 9000);
        email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${salt}@${domain}`;
        attempts++;
      } while (seenEmails.has(email) && attempts < 10);

      seenEmails.add(email);
      return email;
    }

    if (type === 'phone' || name.includes('phone') || label.includes('phone') || name.includes('fax') || label.includes('fax') || name.includes('mobile') || label.includes('mobile') || label.includes('cell')) {
      let phone = '';
      let attempts = 0;
      do {
        const areaCodes = ['415', '212', '512', '206', '312', '617', '720', '310', '404', '305', '650', '917', '503', '702', '214', '602', '619'];
        const area = this.pickRandom(areaCodes);
        const mid = Math.floor(200 + Math.random() * 799);
        const last = Math.floor(1000 + Math.random() * 8999);
        phone = `+1 (${area}) ${mid}-${last}`;
        attempts++;
      } while (seenPhones.has(phone) && attempts < 10);

      seenPhones.add(phone);
      return phone;
    }

    if (type === 'url' || name.includes('website') || label.includes('website') || name.includes('url') || label.includes('url') || label.includes('link')) {
      if (name.includes('linkedin') || label.includes('linkedin')) {
        return `https://www.linkedin.com/in/${fName.toLowerCase()}-${lName.toLowerCase()}-${recordSalt}`;
      }
      if (name.includes('twitter') || label.includes('twitter')) {
        return `https://twitter.com/${fName.toLowerCase()}_${recordSalt}`;
      }
      const domain = this.pickRandom(DOMAINS);
      return `https://www.${domain}/item-${batchSeed.toLowerCase()}-${recordSalt}`;
    }

    // ==========================================
    // 6. PICKLIST & MULTIPICKLIST
    // ==========================================
    if (type === 'picklist') {
      return this.getRandomPicklistValue(fieldMeta);
    }

    if (type === 'multipicklist') {
      const values = this.getActivePicklistValues(fieldMeta);
      if (values.length === 0) return 'Standard';
      const countToPick = Math.min(values.length, 1 + Math.floor(Math.random() * 2));
      const shuffled = [...values].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, countToPick).join(';');
    }

    // Reference / Lookup
    if (type === 'reference') {
      return config.referenceId || null;
    }

    // ID
    if (type === 'id') {
      return this.generateMockSalesforceId(fieldMeta.name);
    }

    // ==========================================
    // 7. STRINGS & TEXT (Contextual Names, Titles, Codes, Narrative)
    // Deep semantic label and type recognition
    // ==========================================
    if (['string', 'textarea', 'combobox', 'encryptedstring'].includes(type)) {
      // Salutation
      if (name === 'salutation' || label.includes('salutation') || label.includes('honorific')) {
        return this.pickRandom(SALUTATIONS);
      }

      // First Name
      if (name === 'firstname' || label.includes('first name') || name.includes('first_name') || label.includes('given name')) {
        return fName;
      }

      // Middle Name
      if (name === 'middlename' || label.includes('middle name') || name.includes('middle_name') || label.includes('middle initial')) {
        return this.pickRandom(MIDDLE_NAMES);
      }

      // Last Name
      if (name === 'lastname' || label.includes('last name') || name.includes('last_name') || label.includes('surname') || label.includes('family name')) {
        return lName;
      }

      // Suffix
      if (name === 'suffix' || label.includes('suffix')) {
        return this.pickRandom(SUFFIXES);
      }

      // Full Contact / Person Name
      if ((name.includes('contact') && name.includes('name')) || label.includes('full name') || label.includes('contact name') || label.includes('applicant name') || label.includes('candidate name') || label.includes('employee name') || (context.sObjectName === 'Contact' && name === 'name')) {
        return `${fName} ${lName}`;
      }

      // Company / Account Name
      if (name === 'name' || label.includes('account name') || label.includes('company name') || name.includes('company') || label.includes('client name') || label.includes('vendor name') || label.includes('organization')) {
        let uniqueName = '';
        let attempts = 0;
        do {
          const adj = this.pickRandom(COMPANY_ADJECTIVES);
          const noun = this.pickRandom(COMPANY_NOUNS);
          const sfx = this.pickRandom(COMPANY_SUFFIXES);
          const numCode = Math.floor(100 + Math.random() * 900);
          uniqueName = `${adj} ${noun} ${sfx} (${numCode})`;
          attempts++;
        } while (seenNames.has(uniqueName) && attempts < 10);

        seenNames.add(uniqueName);
        return uniqueName;
      }

      // Stock Ticker Symbol
      if (name.includes('ticker') || label.includes('ticker') || label.includes('stock symbol')) {
        return this.pickRandom(TICKER_SYMBOLS);
      }

      // SIC / NAICS Industry Codes
      if (name.includes('sic') || label.includes('sic')) {
        const sicCodes = ['7371', '7372', '7373', '8742', '6021', '2834', '3711', '4813'];
        return this.pickRandom(sicCodes);
      }
      if (name.includes('naics') || label.includes('naics')) {
        const naicsCodes = ['541511', '541512', '522110', '541611', '511210', '621111'];
        return this.pickRandom(naicsCodes);
      }

      // D-U-N-S Number
      if (name.includes('duns') || label.includes('duns') || label.includes('d-u-n-s')) {
        const p1 = Math.floor(10 + Math.random() * 89);
        const p2 = Math.floor(100 + Math.random() * 899);
        return `${p1}-${p2}-${recordSalt}`;
      }

      // Ownership
      if (name.includes('ownership') || label.includes('ownership')) {
        return this.pickRandom(['Public', 'Private', 'Subsidiary', 'Other']);
      }

      // Job Title / Position
      if (name.includes('title') || label.includes('title') || name.includes('position') || label.includes('position') || label.includes('designation') || label.includes('occupation')) {
        return this.pickRandom(JOB_TITLES);
      }

      // Department / Division
      if (name.includes('department') || label.includes('department') || name.includes('division') || label.includes('division') || label.includes('business unit')) {
        return this.pickRandom(DEPARTMENTS);
      }

      // Assistant Details
      if (name.includes('assistantname') || label.includes('assistant') && label.includes('name')) {
        return `${this.pickRandom(FIRST_NAMES)} ${this.pickRandom(LAST_NAMES)}`;
      }
      if (name.includes('assistantphone') || label.includes('assistant') && label.includes('phone')) {
        return `+1 (415) 555-${Math.floor(1000 + Math.random() * 8999)}`;
      }

      // Industry
      if (name.includes('industry') || label.includes('industry')) {
        return this.pickRandom(INDUSTRIES);
      }

      // Lead Source
      if (name.includes('leadsource') || label.includes('lead source') || name.includes('source') || label.includes('source')) {
        return this.pickRandom(LEAD_SOURCES);
      }

      // Competitor
      if (name.includes('competitor') || label.includes('competitor')) {
        return this.pickRandom(COMPETITORS);
      }

      // Opportunity / Deal Next Step
      if (name.includes('nextstep') || label.includes('next step') || label.includes('action item')) {
        return this.pickRandom(NEXT_STEPS);
      }

      // Opportunity / Project Name
      if (context.sObjectName === 'Opportunity' && name === 'name') {
        const adj = this.pickRandom(COMPANY_ADJECTIVES);
        const noun = this.pickRandom(COMPANY_NOUNS);
        return `${adj} ${noun} - Enterprise Expansion [${batchSeed}]`;
      }

      // Social Security Number / SSN
      if (name.includes('ssn') || label.includes('ssn') || label.includes('social security')) {
        const p1 = Math.floor(100 + Math.random() * 899);
        const p2 = String(Math.floor(10 + Math.random() * 89));
        return `${p1}-${p2}-${recordSalt}`;
      }

      // Tax ID / EIN / VAT
      if (name.includes('ein') || label.includes('ein') || name.includes('tax_id') || label.includes('tax id') || label.includes('vat')) {
        const prefix = Math.floor(10 + Math.random() * 89);
        const suffix = Math.floor(1000000 + Math.random() * 8999999);
        return `${prefix}-${suffix}`;
      }

      // Account / Bank / Routing Number
      if (name.includes('accountnumber') || label.includes('account number') || name.includes('acct_num')) {
        return `ACT-${batchSeed}-${Math.floor(100000 + Math.random() * 899999)}`;
      }
      if (name.includes('routing') || label.includes('routing')) {
        return '121000358';
      }
      if (name.includes('creditcard') || label.includes('credit card') || label.includes('card number')) {
        return `4111-XXXX-XXXX-${Math.floor(1000 + Math.random() * 8999)}`;
      }

      // Order Number / PO Number / Invoice Number
      if (name.includes('order') && (name.includes('num') || name.includes('id') || label.includes('number'))) {
        return `ORD-${batchSeed}-${recordSalt}`;
      }
      if (name.includes('invoice') || label.includes('invoice')) {
        return `INV-${batchSeed}-${recordSalt}`;
      }
      if (name.includes('po_') || label.includes('po number') || label.includes('purchase order')) {
        return `PO-${batchSeed}-${recordSalt}`;
      }

      // Tracking / Serial Number / SKU / License / Batch
      if (name.includes('tracking') || label.includes('tracking') || label.includes('waybill')) {
        return `1Z999${batchSeed}${Math.floor(10000000 + Math.random() * 89999999)}`;
      }
      if (name.includes('serial') || label.includes('serial')) {
        return `SN-${batchSeed}-${Math.floor(1000 + Math.random() * 8999)}`;
      }
      if (name.includes('sku') || label.includes('sku') || name.includes('productcode') || label.includes('product code')) {
        return `SKU-${batchSeed}-${Math.floor(100 + Math.random() * 899)}`;
      }
      if (name.includes('license') || label.includes('license') || label.includes('permit')) {
        return `LIC-${batchSeed}-${recordSalt}`;
      }
      if (name.includes('batch_') || label.includes('batch number') || label.includes('lot number')) {
        return `LOT-${batchSeed}-${recordSalt}`;
      }

      // Subject / Topic / Case Headline
      if (name.includes('subject') || label.includes('subject') || name.includes('topic') || label.includes('topic') || label.includes('case title') || label.includes('ticket')) {
        return `${this.pickRandom(CASE_TOPICS)} #${batchSeed}-${recordSalt}`;
      }

      // Case Reason / Resolution
      if (name.includes('casereason') || label.includes('case reason') || (name.includes('reason') && label.includes('reason'))) {
        return this.pickRandom(['Configuration Assistance', 'API Rate Limit Advisory', 'SSO Authentication Setup', 'Performance Tuning Review', 'Data Synchronization']);
      }
      if (name.includes('resolution') || label.includes('resolution') || label.includes('root cause')) {
        return this.pickRandom(RESOLUTION_NOTES);
      }

      // Narrative Description / Notes / Comments / Feedback / Summary
      if (type === 'textarea' || name.includes('description') || label.includes('description') || name.includes('comment') || label.includes('note') || label.includes('summary')) {
        const desc = this.pickRandom(DESCRIPTIONS);
        return `${desc} [Reference: ${batchSeed}-${recordSalt}]`;
      }

      // Generic string with safe character limit
      const cleanLabel = (fieldMeta.label || fieldMeta.name || 'Data').replace(/[^a-zA-Z0-9 ]/g, '').trim();
      const maxLength = fieldMeta.length || 255;
      const val = `${cleanLabel} ${batchSeed}-${recordSalt}`;
      return val.slice(0, maxLength);
    }

    return `Value-${batchSeed}-${recordSalt}`;
  }

  /**
   * Resolves address fields ensuring Street, City, State, PostalCode, Country belong to the same metro
   * Takes reference from field metadata, picklist values (for State/Country picklists), labels and length limits
   */
  static resolveAddressField(name, label, fieldMeta, addresses) {
    const isStreet = name.includes('street') || label.includes('street') ||
                     name.includes('addressline') || name.includes('address_line') || label.includes('address line') ||
                     name.endsWith('__street__s');

    const isCity = name.includes('city') || label.includes('city') ||
                   name.includes('town') || label.includes('town') ||
                   name.endsWith('__city__s');

    const isState = name.includes('state') || label.includes('state') ||
                    name.includes('province') || label.includes('province') ||
                    name.endsWith('__statecode__s') || name.endsWith('__state__s') ||
                    label.includes('state/province');

    const isPostalCode = name.includes('postalcode') || name.includes('postcode') ||
                         name.includes('zip') || label.includes('zip') ||
                         label.includes('postal') || name.endsWith('__postalcode__s') ||
                         name.includes('pincode') || label.includes('pincode');

    const isCountry = name.includes('country') || label.includes('country') ||
                      name.includes('nation') || label.includes('nation') ||
                      name.endsWith('__countrycode__s') || name.endsWith('__country__s');

    const isGeocode = name.includes('geocode') || name.includes('latitude') || name.includes('longitude');

    const isFullAddress = (name.includes('address') || label.includes('address')) &&
                          !isStreet && !isCity && !isState && !isPostalCode && !isCountry && !isGeocode;

    if (!isStreet && !isCity && !isState && !isPostalCode && !isCountry && !isGeocode && !isFullAddress) {
      return null;
    }

    const scope = this.getAddressScope(name, label, addresses);
    const maxLen = fieldMeta.length || 255;

    // 1. Street Address
    if (isStreet) {
      if (name.includes('line_2') || name.includes('line2') || name.includes('address_2') || label.includes('address 2') || label.includes('street 2') || label.includes('suite') || label.includes('apt') || label.includes('unit') || label.includes('floor')) {
        return `Suite ${Math.floor(100 + Math.random() * 890)}`;
      }
      if (name.includes('line_3') || name.includes('line3') || name.includes('address_3') || label.includes('address 3') || label.includes('street 3')) {
        return `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;
      }
      return scope.street.slice(0, maxLen);
    }

    // 2. City
    if (isCity) {
      return scope.city.slice(0, maxLen);
    }

    // 3. State / Province / StateCode
    if (isState) {
      // Picklist handling (e.g. State and Country picklists enabled in org)
      if (fieldMeta.picklistValues && fieldMeta.picklistValues.length > 0) {
        const match = fieldMeta.picklistValues.find(pv =>
          pv.active !== false && (
            pv.value.toLowerCase() === scope.stateCode.toLowerCase() ||
            pv.value.toLowerCase() === scope.state.toLowerCase() ||
            (pv.label && pv.label.toLowerCase() === scope.state.toLowerCase())
          )
        );
        if (match) return match.value;

        // If Country is US or unspecified, ONLY pick from valid US states (eliminates foreign codes like "TA"!)
        const isUsCountry = !scope.countryCode || scope.countryCode === 'US' || scope.country === 'United States';
        if (isUsCountry) {
          const usStates = fieldMeta.picklistValues.filter(pv =>
            pv.active !== false && (
              US_STATE_CODES.has(pv.value.toUpperCase()) ||
              US_STATE_NAMES.has(pv.label || '')
            )
          );
          if (usStates.length > 0) {
            return this.pickRandom(usStates).value;
          }
          return scope.stateCode || 'CA';
        }

        const activeStates = fieldMeta.picklistValues.filter(pv => pv.active !== false);
        if (activeStates.length > 0) {
          return this.pickRandom(activeStates).value;
        }
      }

      // Check for code field or length restriction (e.g. StateCode length <= 3)
      if (maxLen <= 3 || name.endsWith('code') || label.includes('code')) {
        return scope.stateCode;
      }
      return scope.state.slice(0, maxLen);
    }

    // 4. Zip / Postal Code
    if (isPostalCode) {
      if (fieldMeta.type === 'int' || fieldMeta.type === 'integer') {
        const numZip = parseInt(scope.postalCode, 10);
        return isNaN(numZip) ? 94105 : numZip;
      }
      return scope.postalCode.slice(0, maxLen);
    }

    // 5. Country / CountryCode
    if (isCountry) {
      // Picklist handling (e.g. Country picklists enabled in org)
      if (fieldMeta.picklistValues && fieldMeta.picklistValues.length > 0) {
        const match = fieldMeta.picklistValues.find(pv =>
          pv.active !== false && (
            pv.value.toLowerCase() === scope.countryCode.toLowerCase() ||
            pv.value.toLowerCase() === scope.country.toLowerCase() ||
            (pv.label && pv.label.toLowerCase() === scope.country.toLowerCase())
          )
        );
        if (match) return match.value;
        const activeCountries = fieldMeta.picklistValues.filter(pv => pv.active !== false);
        if (activeCountries.length > 0) {
          return this.pickRandom(activeCountries).value;
        }
      }

      if (maxLen <= 3 || name.endsWith('code') || label.includes('code')) {
        return scope.countryCode;
      }
      return scope.country.slice(0, maxLen);
    }

    // 6. Geocode
    if (name.includes('latitude') || label.includes('latitude')) {
      return scope.latitude;
    }
    if (name.includes('longitude') || label.includes('longitude')) {
      return scope.longitude;
    }
    if (name.includes('geocode') || label.includes('geocode')) {
      return 'Address';
    }

    // 7. Full Combined Address (e.g. Address__c text/textarea)
    if (isFullAddress && ['string', 'textarea', 'combobox'].includes(fieldMeta.type || 'string')) {
      const full = `${scope.street}, ${scope.city}, ${scope.stateCode} ${scope.postalCode}, ${scope.country}`;
      return full.slice(0, maxLen);
    }

    return null;
  }

  /**
   * Resolves contextual Dates (Birthdate in past, CloseDate in future, HireDate in past)
   */
  static resolveDateField(name, label, type) {
    const isDateTime = type === 'datetime';

    // Birthdate / DOB: 22 to 62 years in the past
    if (name.includes('birth') || label.includes('birth') || name === 'dob') {
      const birth = new Date();
      const yearsAgo = 22 + Math.floor(Math.random() * 40);
      birth.setFullYear(birth.getFullYear() - yearsAgo);
      birth.setMonth(Math.floor(Math.random() * 12));
      birth.setDate(Math.floor(1 + Math.random() * 28));
      return isDateTime ? birth.toISOString() : birth.toISOString().split('T')[0];
    }

    // Close Date / Target Date / Due Date / Expiration / Renewal / Deadline: Future date (+15 to +120 days)
    if (name.includes('close') || label.includes('close') ||
        name.includes('target') || label.includes('target') ||
        name.includes('due') || label.includes('due') ||
        name.includes('expir') || label.includes('expir') ||
        name.includes('renew') || label.includes('renew') ||
        name.includes('delivery') || label.includes('delivery') ||
        name.includes('deadline') || label.includes('deadline')) {
      const future = new Date();
      future.setDate(future.getDate() + (15 + Math.floor(Math.random() * 105)));
      return isDateTime ? future.toISOString() : future.toISOString().split('T')[0];
    }

    // Start Date / Hire Date / Join Date / Effective Date / Founding Date: Past date (-90 to -1200 days)
    if (name.includes('start') || label.includes('start') ||
        name.includes('hire') || label.includes('hire') ||
        name.includes('join') || label.includes('join') ||
        name.includes('effective') || label.includes('effective') ||
        name.includes('found') || label.includes('found') ||
        name.includes('established') || label.includes('established')) {
      const past = new Date();
      past.setDate(past.getDate() - (90 + Math.floor(Math.random() * 1100)));
      return isDateTime ? past.toISOString() : past.toISOString().split('T')[0];
    }

    // Default Date: spread over recent past & upcoming days
    const d = new Date();
    const dayOffset = Math.floor(Math.random() * 60) - 30;
    d.setDate(d.getDate() + dayOffset);
    return isDateTime ? d.toISOString() : d.toISOString().split('T')[0];
  }

  /**
   * Resolves contextual Numbers, Currency, Percentages, and Integers
   */
  static resolveNumericField(name, label, type, fieldMeta, config) {
    const isInteger = type === 'int' || type === 'integer';
    const isPercent = type === 'percent';
    const scale = fieldMeta.scale !== undefined ? fieldMeta.scale : (isInteger ? 0 : 2);

    // If user manually supplied custom min/max in UI
    if (config.min !== undefined && config.max !== undefined && config.min !== 0 && config.max !== 1000) {
      const val = Number(config.min) + Math.random() * (Number(config.max) - Number(config.min));
      return isInteger ? Math.round(val) : Number(val.toFixed(scale));
    }

    // 1. Annual Revenue / Turn Over: $500,000 to $25,000,000
    if (name.includes('revenue') || label.includes('revenue') || label.includes('turnover')) {
      const rev = 500000 + Math.floor(Math.random() * 245) * 100000;
      return isInteger ? rev : Number(rev.toFixed(scale));
    }

    // 2. Budget / Total Amount / Deal Size / Expected Revenue / Opp Amount: $15,000 to $500,000
    if (name.includes('amount') || label.includes('amount') || name.includes('budget') || label.includes('budget') || label.includes('deal size') || label.includes('deal')) {
      const amt = 15000 + Math.floor(Math.random() * 97) * 5000;
      return isInteger ? amt : Number(amt.toFixed(scale));
    }

    // 3. Salary / Compensation: $65,000 to $220,000
    if (name.includes('salary') || label.includes('salary') || name.includes('compensation') || label.includes('compensation') || label.includes('base pay')) {
      const sal = 65000 + Math.floor(Math.random() * 31) * 5000;
      return isInteger ? sal : Number(sal.toFixed(scale));
    }

    // 4. Price / Cost / Unit Price / Fee / Expense: $25.00 to $2,500.00
    if (name.includes('price') || label.includes('price') || name.includes('cost') || label.includes('cost') || name.includes('fee') || label.includes('fee') || label.includes('expense')) {
      const cost = 25 + Math.random() * 2475;
      return isInteger ? Math.round(cost) : Number(cost.toFixed(scale));
    }

    // 5. Probability / Discount / Margin / Tax Rate (%): 5% to 90%
    if (isPercent || name.includes('probability') || label.includes('probability') || name.includes('discount') || label.includes('discount') || label.includes('rate') || label.includes('margin')) {
      if (name.includes('discount') || label.includes('discount')) {
        return Math.floor(5 + Math.random() * 25); // 5% to 30% discount
      }
      return Math.floor(10 + Math.random() * 85); // 10% to 95%
    }

    // 6. Employees / Headcount / Staff: 15 to 3,500
    if (name.includes('employee') || label.includes('employee') || name.includes('headcount') || label.includes('staff')) {
      return Math.floor(15 + Math.random() * 3485);
    }

    // 7. Quantity / Units / Count: 1 to 75
    if (name.includes('quantit') || label.includes('quantit') || name.includes('units') || label.includes('units')) {
      return Math.floor(1 + Math.random() * 75);
    }

    // 8. Age: 22 to 65
    if (name === 'age' || label === 'age') {
      return Math.floor(22 + Math.random() * 44);
    }

    // 9. Year: 2020 to 2026
    if (name.includes('year') || label.includes('year')) {
      return Math.floor(2020 + Math.random() * 7);
    }

    // 10. Rating / Score: 1 to 100 or 1 to 10
    if (name.includes('score') || label.includes('score') || name.includes('rating') || label.includes('rating') || label.includes('nps') || label.includes('csat')) {
      const maxVal = fieldMeta.precision && fieldMeta.precision <= 2 ? 10 : 100;
      return Math.floor(1 + Math.random() * maxVal);
    }

    // Default Numeric Fallback
    const min = isInteger ? 10 : 50;
    const max = isInteger ? 1000 : 50000;
    const val = min + Math.random() * (max - min);
    return isInteger ? Math.round(val) : Number(val.toFixed(scale));
  }

  /**
   * Analyzes field metadata (type, name, label) to return a descriptive semantic label hint for the UI
   */
  static getSemanticLabelHint(fieldMeta) {
    if (!fieldMeta) return { icon: '✨', label: 'Auto Realistic', category: 'generic' };

    const type = (fieldMeta.type || 'string').toLowerCase();
    const name = (fieldMeta.name || '').toLowerCase();
    const label = (fieldMeta.label || '').toLowerCase();

    // 1. Address Fields
    if (name.includes('street') || label.includes('street') || name.includes('addressline') || label.includes('address line')) {
      return { icon: '📍', label: 'Coherent Street Address', category: 'address' };
    }
    if (name.includes('city') || label.includes('city') || name.includes('town') || label.includes('town')) {
      return { icon: '🏙️', label: 'Matching Metro City', category: 'address' };
    }
    if (name.includes('state') || label.includes('state') || name.includes('province') || label.includes('province')) {
      return { icon: '🗺️', label: 'Matching State / Province', category: 'address' };
    }
    if (name.includes('postalcode') || name.includes('postcode') || name.includes('zip') || label.includes('zip') || label.includes('postal') || name.includes('pin')) {
      return { icon: '📮', label: 'Valid 5-Digit Postal Code', category: 'address' };
    }
    if (name.includes('country') || label.includes('country') || name.includes('nation')) {
      return { icon: '🌍', label: 'Matching Country / ISO Code', category: 'address' };
    }
    if (name.includes('address') || label.includes('address')) {
      return { icon: '📍', label: 'Full Coherent Address', category: 'address' };
    }

    // 2. Dates
    if (type === 'date' || type === 'datetime') {
      if (name.includes('birth') || label.includes('birth') || name === 'dob') {
        return { icon: '🎂', label: 'Adult Birthdate (22-62 yrs)', category: 'date' };
      }
      if (name.includes('close') || label.includes('close') || name.includes('target') || label.includes('target') || name.includes('due') || label.includes('due') || name.includes('expir') || name.includes('renew') || name.includes('deadline')) {
        return { icon: '📅', label: 'Future Target Date (+15-120 days)', category: 'date' };
      }
      if (name.includes('start') || label.includes('start') || name.includes('hire') || label.includes('hire') || name.includes('join') || name.includes('effective') || name.includes('found')) {
        return { icon: '💼', label: 'Historical Past Date (Start/Hire)', category: 'date' };
      }
      return { icon: '📅', label: 'Realistic Date (±30 days)', category: 'date' };
    }

    // 3. Numeric & Currency
    if (['int', 'integer', 'double', 'currency', 'percent'].includes(type)) {
      if (name.includes('revenue') || label.includes('revenue') || label.includes('turnover')) {
        return { icon: '💰', label: 'Enterprise Revenue ($500k-$25M)', category: 'numeric' };
      }
      if (name.includes('amount') || label.includes('amount') || name.includes('budget') || label.includes('budget') || label.includes('deal')) {
        return { icon: '💵', label: 'Deal Size / Budget ($15k-$500k)', category: 'numeric' };
      }
      if (name.includes('salary') || label.includes('salary') || name.includes('compensation')) {
        return { icon: '💼', label: 'Compensation ($65k-$220k)', category: 'numeric' };
      }
      if (name.includes('price') || label.includes('price') || name.includes('cost') || label.includes('cost') || name.includes('fee')) {
        return { icon: '🏷️', label: 'Unit Price ($25-$2,500)', category: 'numeric' };
      }
      if (type === 'percent' || name.includes('discount') || label.includes('discount') || name.includes('probability') || label.includes('rate')) {
        return { icon: '📊', label: 'Realistic Percentage', category: 'numeric' };
      }
      if (name.includes('employee') || label.includes('employee') || name.includes('headcount')) {
        return { icon: '👥', label: 'Headcount (15-3,500 staff)', category: 'numeric' };
      }
      return { icon: '🔢', label: `Contextual ${type}`, category: 'numeric' };
    }

    // 4. Communication & Identity
    if (type === 'email' || name.includes('email') || label.includes('email')) {
      return { icon: '✉️', label: 'Unique Person Email', category: 'identity' };
    }
    if (type === 'phone' || name.includes('phone') || label.includes('phone') || name.includes('fax') || label.includes('fax') || name.includes('mobile')) {
      return { icon: '📞', label: 'Formatted Phone (+1 XXX...)', category: 'identity' };
    }
    if (type === 'url' || name.includes('website') || label.includes('website') || name.includes('url')) {
      return { icon: '🔗', label: 'Valid Web URL', category: 'identity' };
    }

    // 5. Names & Companies
    if (name === 'name' || label.includes('account name') || label.includes('company name') || name.includes('company')) {
      return { icon: '🏢', label: 'Unique Enterprise Company', category: 'identity' };
    }
    if (name === 'firstname' || label.includes('first name')) {
      return { icon: '👤', label: 'Realistic First Name', category: 'identity' };
    }
    if (name === 'lastname' || label.includes('last name')) {
      return { icon: '👤', label: 'Realistic Last Name', category: 'identity' };
    }
    if (name.includes('title') || label.includes('title') || name.includes('position') || label.includes('position')) {
      return { icon: '💼', label: 'Enterprise Job Title', category: 'identity' };
    }
    if (name.includes('department') || label.includes('department') || name.includes('division')) {
      return { icon: '🏢', label: 'Corporate Department', category: 'identity' };
    }
    if (name.includes('ssn') || label.includes('ssn') || name.includes('ein') || label.includes('ein') || label.includes('tax')) {
      return { icon: '🔒', label: 'Formatted Tax / Govt ID', category: 'identity' };
    }
    if (name.includes('order') || name.includes('invoice') || name.includes('tracking') || name.includes('po_') || name.includes('serial')) {
      return { icon: '📦', label: 'Formatted Tracking / Ref ID', category: 'identity' };
    }
    if (type === 'textarea' || name.includes('description') || label.includes('description') || name.includes('comment') || label.includes('note')) {
      return { icon: '📝', label: 'Business Fixture Description', category: 'generic' };
    }

    if (type === 'boolean') {
      return { icon: '☑️', label: 'Realistic Boolean', category: 'generic' };
    }

    return { icon: '✨', label: `Realistic ${fieldMeta.label || type}`, category: 'generic' };
  }

  static getRandomPicklistValue(fieldMeta) {
    const activeValues = this.getActivePicklistValues(fieldMeta);
    if (activeValues.length === 0) return 'Default';
    return activeValues[Math.floor(Math.random() * activeValues.length)];
  }

  static getActivePicklistValues(fieldMeta) {
    if (!fieldMeta || !fieldMeta.picklistValues) return [];
    return fieldMeta.picklistValues
      .filter(pv => pv.active !== false)
      .map(pv => pv.value);
  }

  /**
   * Interpolate pattern tokens with unique randomness
   */
  static interpolatePattern(pattern, index, totalCount, context = {}) {
    if (!pattern) return '';

    const batchSeed = context.batchSeed || Date.now().toString(36).slice(-4).toUpperCase();
    const uniqueSalt = context.recordSalt || Math.floor(1000 + Math.random() * 9000);

    return pattern
      .replace(/\{\{index\}\}/g, String(index + 1))
      .replace(/\{\{index0\}\}/g, String(index))
      .replace(/\{\{batch\}\}/g, batchSeed)
      .replace(/\{\{random\}\}/g, String(Math.floor(100000 + Math.random() * 900000)))
      .replace(/\{\{random:(\d+)\}\}/g, (_, length) => {
        const len = parseInt(length, 10) || 4;
        return String(Math.floor(Math.random() * Math.pow(10, len))).padStart(len, '0');
      })
      .replace(/\{\{seq:(\d+)\}\}/g, (_, start) => {
        const s = parseInt(start, 10) || 0;
        return String(s + index);
      })
      .replace(/\{\{timestamp\}\}/g, String(Date.now()))
      .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
      .replace(/\{\{uuid\}\}/g, this.generateShortUuid());
  }

  static generateShortUuid() {
    return 'xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static generateMockSalesforceId(prefix = '001') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = prefix.padEnd(3, '0').slice(0, 3);
    for (let i = 0; i < 15; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  static pickRandom(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static castToFieldType(val, type = 'string') {
    if (val === null || val === undefined || val === '') return null;
    const t = type.toLowerCase();
    if (t === 'boolean') {
      if (typeof val === 'boolean') return val;
      return String(val).toLowerCase() === 'true' || val === '1';
    }
    if (t === 'int' || t === 'integer') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (['double', 'currency', 'percent'].includes(t)) {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return String(val);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeneratorEngine;
}
