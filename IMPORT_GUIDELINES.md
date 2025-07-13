# Import Guidelines for PDF2MDHub

To avoid circular dependencies and follow Flask best practices, follow this import structure for models in all backend modules (e.g., routes, services):

## ✅ Correct Way

```python
from backend.models import db
from backend.models.document import Document
from backend.models.tag import Tag
```

## ❌ Avoid This

```python
from backend.models import db, Document, Tag  # This will cause ImportError
```

## Reason

- The `backend.models.__init__.py` file only exports `db`.
- `Document` and `Tag` are defined in their own modules (`document.py`, `tag.py`) and should be imported from there.
- This keeps the model layer clean and avoids circular imports.

## Notes

- All routes and services should follow this pattern.
- Add new model files as needed, and **do not** re-export them in `__init__.py`.

---

# Pre-Commit Import Check

To ensure model imports remain clean and consistent, you can add a custom pre-commit hook.

## Step 1: Create the Hook Script

Create a file at `.git-hooks/check-imports.sh`:

```bash
#!/bin/bash

echo "Running import validation..."

FAILED=0

for file in $(git diff --cached --name-only | grep -E 'backend/routes/.*\.py$'); do
    if grep -q "from backend.models import .*Document" "$file"; then
        echo "❌ Invalid import in $file"
        FAILED=1
    fi
done

if [ $FAILED -ne 0 ]; then
    echo "❗ Please import Document and Tag from their respective modules (e.g., document.py, tag.py)."
    exit 1
else
    echo "✅ Import check passed."
fi
```

## Step 2: Make It Executable

```bash
chmod +x .git-hooks/check-imports.sh
```

## Step 3: Add to `.git/hooks/pre-commit`

Link the script into your Git pre-commit hooks:

```bash
ln -s ../../.git-hooks/check-imports.sh .git/hooks/pre-commit
```

Now every commit will block if invalid `backend.models` imports are found.

---

# Enforcing Import Order with flake8-import-order

To maintain consistent and readable imports, we recommend using `flake8` with `flake8-import-order`.

## Step 1: Install flake8 and plugin

```bash
pip install flake8 flake8-import-order
```

## Step 2: Create/Edit `.flake8` Config

Create a `.flake8` file in the project root with the following content:

```ini
[flake8]
import-order-style = google
application-import-names = backend
exclude = venv, migrations
max-line-length = 100
```

## Step 3: Check Imports

```bash
flake8
```

## Example of Correct Import Order

```python
# Standard library
import os

# Third-party
from flask import Flask

# Internal
from backend.models import db
from backend.models.document import Document
```