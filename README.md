# tw-data-etl

This script extracts data from TW production db (MongoDB) and loads them into an analytics db (MySQL)

### Usage

```
node index.js
```

### Unfinished

The CLI has not been coded yet. A default fetching date for _events_ and _transactions_ is hard coded in `production/audits.js` and `production/transactions.js`
