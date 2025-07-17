# backend/routes/test-pdf2md.py

from flask import Blueprint, render_template

webcontainer_demo_bp = Blueprint('test-pdf2md, __name__)

@webcontainer_demo_bp.route('/test-pdf2md')
def webcontainer_demo():
    # Assumes you have 'webcontainer-demo.html' in frontend/templates/
    return render_template('test-pdf2md.html')