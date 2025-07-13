# Co-Pilot Code Considerations

## 1. static/js/pdf2md.js
- Update `performConversion` to use OpenGovSG's `convertPdfToMarkdown`.
- Emit progress events as described in the plan.

## 2. templates/base.html
- Add OpenGovSG PDF2MD library via CDN.
- Ensure script order: library first, then local JS.

## 3. static/js/upload.js
- Implement drag-and-drop upload, file input, progress tracking.
- Integrate with PDF2MD for conversion and upload.

## 4. static/js/document-viewer.js
- Load document data, display PDF in iframe, render markdown with syntax highlighting.

## 5. static/js/search.js
- Implement debounced search input, filters, results pagination.

## 6. templates/upload.html
- Modern drag-and-drop interface, progress bars, batch upload, tag/metadata forms.

## 7. templates/viewer.html
- Split-pane for PDF/Markdown, toolbar, metadata sidebar, comments section.

## 8. templates/search.html
- Search input with autocomplete, filter sidebar, results grid, pagination controls.

## 9. static/css/styles.css
- Responsive design, card-based layout, drag-and-drop feedback, progress animations, dark/light theme.

## 10. backend/app.py
- Ensure all required API endpoints exist and are functional.
- Update database schema for document status, tags, indexing, user tracking if needed.

## 11. tests/
- Add unit and integration tests for conversion, API, search, upload, error handling, performance.

---

# File Implementation Order
1. static/js/upload.js
2. static/js/document-viewer.js
3. static/js/search.js
4. static/js/pdf2md.js
5. templates/upload.html
6. templates/viewer.html
7. templates/search.html
8. templates/base.html
9. static/css/styles.css
10. backend/app.py
11. tests/
