# backend/routes/test-pdf2md.py

from flask import Blueprint, render_template

test-pdf2md_bp = Blueprint('test-pdf2md, __name__)

@test-pdf2md_bp.route('/test-pdf2md')
def test-pdf2md():
    # Assumes you have 'test-pdf2md.html' in frontend/templates/
    return render_template('test-pdf2md.html')