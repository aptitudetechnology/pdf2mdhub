# WebContainer + Copilot Integration Plan

## 1. Review Instructions
- Read and understand all requirements in `webcontainer-copilot-instructions.md`.
- Identify which WebContainer APIs and features need to be tested or scaffolded.

## 2. Environment Setup
- Ensure the project has a working frontend directory with vanilla JS and HTML.
- Confirm that the backend is not required for initial WebContainer tests.

## 3. Scaffold WebContainer Demo
- Create a minimal HTML/JS demo page in `frontend/static/webcontainer-demo.html` and `frontend/static/js/webcontainer-demo.js`.
- Add a button to start a WebContainer instance and run a simple shell command (e.g., `echo Hello World`).


## 3.1 Create Routes for the Demo
- Add a new Flask route in the backend (e.g., `/webcontainer-demo`) that serves the demo HTML page.
- Ensure static assets (JS, CSS) for the demo are accessible via Flask's static file serving.
- No backend logic is required for WebContainer itself, just routing for the demo page.

## 3.2 Create Routes for the Demo

Add the following Flask route to your backend (e.g., in `backend/app.py` or a dedicated blueprint):

```python
# backend/routes/webcontainer_demo.py

from flask import Blueprint, render_template

webcontainer_demo_bp = Blueprint('webcontainer_demo', __name__)

@webcontainer_demo_bp.route('/webcontainer-demo')
def webcontainer_demo():
    # Assumes you have 'webcontainer-demo.html' in frontend/templates/
    return render_template('webcontainer-demo.html')
```

**Integration steps:**
- Register the blueprint in your app factory or main app file:
  ```python
  from backend.routes.webcontainer_demo import webcontainer_demo_bp
  app.register_blueprint(webcontainer_demo_bp)
  ```
- Ensure `webcontainer-demo.html` exists in `frontend/templates/`.
- Static assets (JS, CSS) should be placed in `frontend/static/` and referenced in the HTML.

## 3.3 Update the Index Template with the Link
- Edit `frontend/templates/index.html` (or your main navigation template).
- Add a link or button to `/webcontainer-demo` so users can easily access the WebContainer demo.
- Ensure the link is visible and clearly labeled (e.g., "WebContainer

## 4. Integrate Copilot Suggestions
- Use Copilot to generate code snippets for:
  - Initializing a WebContainer.
  - Running shell commands.
  - Handling output and errors.
  - Displaying results in the DOM.

## 5. Test and Document
- Test the demo in the browser.
- Document any issues, limitations, or required permissions.
- Note any CSP or browser compatibility concerns.

## 6. Next Steps
- Expand demo to support file system operations (read/write files).
- Integrate with markdown rendering if relevant.
- Review Copilot's suggestions for security and performance.

## 7. Finalize Documentation
- Summarize findings and recommendations in `webcontainer-copilot-plan.md`.
- Link to demo files and relevant code snippets.

---

**Goal:**  
Enable rapid prototyping and testing of WebContainer features using Copilot, with clear documentation and vanilla JS