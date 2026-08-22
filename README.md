# vivify-vault

## Backend taxonomy

The backend serves category and subcategory navigation from the fixed dictionary in `backend/taxonomy.py`. To replace the defaults without changing code, set `CATEGORY_SUBCATEGORIES` to a JSON object whose keys are categories and whose values are arrays of subcategories:

```env
CATEGORY_SUBCATEGORIES={"Theological":["Soteriology","Christology"],"Events":["Conferences"]}
```

The `/categories` and `/categories/{category}/subcategories` endpoints use this mapping. Sermon browsing only returns rows containing both the requested category and subcategory, and the pair must exist in the configured mapping.
