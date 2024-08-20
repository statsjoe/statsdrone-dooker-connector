# StatsDrone Looker Studio Community Connector

This Looker Studio Community Connector allows users to fetch and visualise data from the StatsDrone API directly within Looker Studio. The connector is designed to support both the fetching of historical account data and the automatic retrieval of new data, with a rolling window logic to ensure data continuity even in the case of lapses.

## Features

- **Authentication via API Key:** Users authenticate by providing a valid StatsDrone API key, which is used to fetch their data.
- **Historical Data Fetching:** The connector initially fetches all historical account data from the specified start date.
- **Automatic Data Updates:** The connector automatically retrieves new data according to Looker Studio’s requirements.
- **Rolling Data Fetching Window:** If there is a lapse in data retrieval, the connector adjusts the data-fetching window based on the last successful run, ensuring that no data gaps occur.
- **User Properties Storage:** The date of the last successful data retrieval is stored in User Properties to optimise future data fetching.

## Configuration

### Prerequisites

- A valid StatsDrone API Key.
- A basic understanding of Looker Studio and how to configure data sources.

### Setup Steps

1. **API Key and Start Date:**
   - When configuring the connector in Looker Studio, you will be prompted to enter your StatsDrone API Key and a start date.
   - The start date should be in `YYYY-MM-DD` format and indicates the earliest date from which you want to fetch your historical data.

2. **Fields and Schema:**
   - The connector automatically defines a schema based on the available metrics and dimensions from the StatsDrone API.
   - This includes fields such as `Date`, `Account`, `Brand`, `Campaign`, and various financial metrics.

## Data Fetching Logic

### Authentication

- **API Key:** Users authenticate by entering their StatsDrone API key during the connector setup. This key is used for all subsequent data requests.

### Historical Data Fetching

- **Initial Fetch:** When the connector is first configured, it will fetch all available account data from the specified start date up to the current date.

### Automatic Updates

- **Ongoing Data Retrieval:** After the initial historical data is fetched, the connector will automatically retrieve new data each time Looker Studio requests an update. This ensures that your reports remain up-to-date with the latest data from the StatsDrone API.

### Rolling Window for Data Gaps

- **Handling Lapses:** If there is a significant gap between the last successful run and the current date, the connector will adjust the data-fetching window to cover the missing days.
- **Date Storage:** The date of the last successful data retrieval is stored in User Properties, enabling the connector to determine the appropriate data-fetching window for future requests.

### Error Handling

If the connector encounters an error while fetching data, it will display an informative message in Looker Studio, guiding the user to check their API key and settings. Detailed error information is logged for debugging purposes.

## Customisation

This connector is designed with flexibility in mind. Developers can customise it to:

- Add or modify fields and metrics.
- Implement additional validation or localisation features.
- Enhance error handling or logging.

## Security Considerations

- **API Key:** Ensure that your StatsDrone API key is kept secure and not exposed publicly.
- **Data Privacy:** This connector only retrieves data from the StatsDrone API based on the provided configuration and does not store any data beyond what is necessary for the connector's functionality.

## Known Limitations

- **API Rate Limits:** Be aware of any rate limits imposed by the StatsDrone API to avoid disruptions.
- **Data Freshness:** The data is as fresh as the last successful data fetch, so there may be slight delays depending on when the connector was last run.

## Troubleshooting

- **Invalid API Key:** Ensure that your API key is correct and has the necessary permissions.
- **Incorrect Date Format:** The start date must be in `YYYY-MM-DD` format.
- **API Errors:** Review the error messages provided in Looker Studio and adjust your configuration as needed.

## Contribution

Contributions to this project are welcome! Feel free to open issues or submit pull requests to improve the functionality and documentation of this connector.
