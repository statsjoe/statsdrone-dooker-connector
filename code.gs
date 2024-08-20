var cc = DataStudioApp.createCommunityConnector();

/**
 * Auth type - No authentication required for this connector.
 */
function getAuthType() {
  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.NONE)
    .build();
}

/**
 * Configuration for the connector.
 */
function getConfig(request) {
  var config = cc.getConfig();

  config.newInfo()
    .setId('instructions')
    .setText('This connector fetches data from the StatsDrone API. Please enter your API key and specify the start date for fetching data.');

  config.newTextInput()
    .setId('apiKey')
    .setName('API Key')
    .setHelpText('Enter your StatsDrone API Key.')
    .setPlaceholder('Your API Key here');

  config.newTextInput()
    .setId('startDate')
    .setName('Start Date')
    .setHelpText('Enter the start date for fetching data in YYYY-MM-DD format.')
    .setPlaceholder('YYYY-MM-DD');

  return config.build();
}

/**
 * Defines the schema.
 */
function getFields(request) {
  var fields = cc.getFields();
  var types = cc.FieldType;

  fields.newDimension().setId('date').setName('Date').setType(types.YEAR_MONTH_DAY);
  fields.newDimension().setId('account').setName('Account').setType(types.TEXT);
  fields.newDimension().setId('brand').setName('Brand').setType(types.TEXT);
  fields.newDimension().setId('campaign').setName('Campaign').setType(types.TEXT);
  fields.newDimension().setId('currency').setName('Currency').setType(types.TEXT);
  fields.newDimension().setId('tags').setName('Tags').setType(types.TEXT);
  fields.newMetric().setId('balance').setName('Balance').setType(types.NUMBER);
  fields.newMetric().setId('raw_clicks').setName('R. Clicks').setType(types.NUMBER);
  fields.newMetric().setId('unique_clicks').setName('U. Clicks').setType(types.NUMBER);
  fields.newMetric().setId('impressions').setName('Impressions').setType(types.NUMBER);
  fields.newMetric().setId('signups').setName('Signups').setType(types.NUMBER);
  fields.newMetric().setId('first_time_deposits').setName('FTD').setType(types.NUMBER);
  fields.newMetric().setId('qualified_first_time_deposit').setName('QFTD').setType(types.NUMBER);
  fields.newMetric().setId('installs').setName('Installs').setType(types.NUMBER);
  fields.newMetric().setId('active_accounts').setName('Act. Acc.').setType(types.NUMBER);
  fields.newMetric().setId('deposits_count').setName('Deposit Cnt.').setType(types.NUMBER);
  fields.newMetric().setId('deposits').setName('Deposit Amt.').setType(types.NUMBER);
  fields.newMetric().setId('revenue').setName('Net Rev.').setType(types.NUMBER);
  fields.newMetric().setId('revenue_share_commission').setName('RS Com.').setType(types.NUMBER);
  fields.newMetric().setId('cpa_commission').setName('CPA Com.').setType(types.NUMBER);
  fields.newMetric().setId('referral_commission').setName('Ref. Com.').setType(types.NUMBER);
  fields.newMetric().setId('total_commission').setName('Total Com.').setType(types.NUMBER);
  fields.newDimension().setId('last_sync').setName('Last Sync').setType(types.TEXT);

  return fields;
}

/**
 * Returns the schema to Looker Studio.
 */
function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

/**
 * Converts YYYY-MM-DD to YYYYMMDD.
 */
function convertDateFormat(dateStr) {
  return dateStr.replace(/-/g, '');
}

/**
 * Flattens the nested JSON structure from the API response.
 */
function flattenJson(data) {
  var flatData = [];
  
  for (var account in data) {
    if (!data[account].hasOwnProperty('stats')) {
      continue;
    }
    
    var accountInfo = data[account].info || {};
    var currency = accountInfo.currency || "";
    var tags = accountInfo.tags || "";
    var balance = parseFloat(accountInfo.balance) || 0;
    
    for (var brand in data[account].stats) {
      for (var campaign in data[account].stats[brand]) {
        for (var dateKey in data[account].stats[brand][campaign]) {
          var metrics = data[account].stats[brand][campaign][dateKey];
          var dateFormatted = convertDateFormat(metrics.date);

          var flatRecord = {
            "account": account || "N/A",
            "brand": brand || "N/A",
            "campaign": campaign || "N/A",
            "date": dateFormatted || convertDateFormat(dateKey),  // Convert to YYYYMMDD format
            "currency": currency,
            "tags": tags,
            "balance": balance,
            "raw_clicks": parseFloat(metrics.raw_clicks) || 0,
            "unique_clicks": parseFloat(metrics.unique_clicks) || 0,
            "impressions": parseFloat(metrics.impressions) || 0,
            "signups": parseFloat(metrics.signups) || 0,
            "first_time_deposits": parseFloat(metrics.first_time_deposits) || 0,
            "qualified_first_time_deposit": parseFloat(metrics.qualified_first_time_deposit) || 0,
            "installs": parseFloat(metrics.installs) || 0,
            "active_accounts": parseFloat(metrics.active_accounts) || 0,
            "deposits_count": parseFloat(metrics.deposits_count) || 0,
            "deposits": parseFloat(metrics.deposits) || 0.0,
            "revenue": parseFloat(metrics.revenue) || 0.0,
            "revenue_share_commission": parseFloat(metrics.revenue_share_commission) || 0.0,
            "cpa_commission": parseFloat(metrics.cpa_commission) || 0.0,
            "referral_commission": parseFloat(metrics.referral_commission) || 0.0,
            "total_commission": parseFloat(metrics.total_commission) || 0.0,
            "last_sync": metrics.last_sync || ""
          };
          
          flatData.push(flatRecord);
        }
      }
    }
  }
  
  return flatData;
}

/**
 * Fetches data from the API and returns it to Looker Studio.
 */
function getData(request) {
  var apiKey = request.configParams.apiKey;
  var startDate = request.configParams.startDate;

  if (!apiKey || !startDate) {
    throw new Error("API Key and Start Date are required.");
  }

  var today = new Date();
  var endDate = today.toISOString().split('T')[0];  // Format as YYYY-MM-DD

  // Get the last run date from UserProperties
  var lastRunDateStr = getLastRunDate();
  var lastRunDate = lastRunDateStr ? new Date(lastRunDateStr) : new Date(startDate);

  var daysSinceLastRun = Math.floor((today - lastRunDate) / (1000 * 60 * 60 * 24));
  
  // Calculate the rolling window start date based on the gap
  var rollingWindowStartDate = new Date(today);
  if (daysSinceLastRun > 4) {
    rollingWindowStartDate.setDate(today.getDate() - daysSinceLastRun);  // Extend window to cover the gap
  } else {
    rollingWindowStartDate.setDate(today.getDate() - 4);  // Regular 4-day window
  }

  var fetchFromDate = rollingWindowStartDate.toISOString().split('T')[0];

  // If the rolling window start date is earlier than the user-defined start date, use the start date
  if (fetchFromDate < startDate) {
    fetchFromDate = startDate;
  }

  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);

  var url = 'https://app.statsdrone.com/user/reports?'
          + 'apiKey=' + apiKey
          + '&dateFrom=' + fetchFromDate
          + '&dateTo=' + endDate
          + '&reportType=daily'
          + '&groupBy=accounts';

  var rows = [];

  try {
    var response = UrlFetchApp.fetch(url);
    var parsedResponse = JSON.parse(response.getContentText());

    var flatData = flattenJson(parsedResponse.data);

    flatData.forEach(function(record) {
      var row = [];
      requestedFieldIds.forEach(function(field) {
        row.push(record[field] || 0); // Default to 0 if field is missing
      });
      rows.push({ values: row });
    });

    // Update the last run date
    setLastRunDate(endDate);

  } catch (e) {
    console.error("API request failed: " + e.message);
    throw cc.newUserError()
      .setDebugText("API request failed: " + e.message)
      .setText("There was an error fetching data from the StatsDrone API. Please check your API key and other settings, and try again.")
      .throwException();
  }

  return {
    schema: requestedFields.build(),
    rows: rows
  };
}

/**
 * Stores the last run date using UserProperties.
 */
function setLastRunDate(date) {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('lastRunDate', date);
}

/**
 * Retrieves the last run date from UserProperties.
 */
function getLastRunDate() {
  var userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty('lastRunDate');
}

/**
 * Optional function to check if the user is an admin.
 */
function isAdminUser() {
  return false;
}
