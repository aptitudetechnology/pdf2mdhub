from flask import Blueprint, render_template

testpdf2md_bp = Blueprint('testpdf2md', __name__)

@testpdf2md_bp.route('/testpdf2md')
def test_pdf2md():
    # Assumes you have 'testpdf2md.html' in frontend/templates/
    return render_template('testpdf2md.html')