# Plan to Run PDF2MDHub Prototype on Replit

## 1. Environment Setup
- Ensure Python (Flask) and Node.js are enabled in Replit.
- Install required Python packages from `backend/requirements.txt`.
- Install frontend dependencies (if needed) via npm or CDN.

## 2. File Structure
- Confirm all template files are in `templates/` and static assets in `static/`.
- Ensure `backend/app.py` is the Flask entry point.

## 3. Flask App Configuration
- In `app.py`, set `app = Flask(__name__, template_folder='../templates', static_folder='../static')` if needed for Replit paths.
- Make sure all routes render the correct Jinja2 templates (upload, viewer, search).
- Add a root route (`/`) that redirects to `/upload` or shows a landing page.

## 4. Static Assets
- Confirm CSS and JS files are referenced correctly in templates using `url_for('static', ...)`.
- Use CDN for third-party JS libraries (e.g., OpenGovSG PDF2MD).

## 5. Running the Server
- In Replit, set the run command to: `python backend/app.py`.
- Ensure Flask runs on `host='0.0.0.0'` and `port=8080` for Replit compatibility:
  ```python
  app.run(host='0.0.0.0', port=8080, debug=True)
  ```

## 6. Testing the UI
- Open the Replit webview or public URL to access the app.
- Test navigation to `/upload`, `/viewer/<id>`, and `/search` to confirm templates render.
- Try uploading a PDF and viewing the conversion (simulate backend if needed).

## 7. Troubleshooting
- If templates do not render, check template and static folder paths in Flask config.
- If static assets do not load, verify file locations and template references.
- Use Replit's console for error logs and debugging.

## 8. Next Steps
- Once UI is visible and routes work, begin integrating backend logic for upload, conversion, and search.
- Add sample data or mock endpoints if backend is incomplete.

---

This plan will get the PDF2MDHub prototype running on Replit, serving the UI from your Jinja2 template files and static assets. Adjust paths and run commands as needed for the Replit environment.