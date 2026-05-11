# Submodule Update Guide

This guide explains how to update the relay submodule in the main [Tutorstr repository](https://github.com/chuckis/tutorstr) from this external relay repository.

## Overview

The relay code is developed independently in this repository (`tutor-hub-2030/thr`) and included in the Tutorstr project as a Git submodule at `tutorstr/relay/`.

## Development Port

**Development Relay Server runs on: `http://localhost:8080`**

To start the development server:
```bash
cd relay
npm run dev
```

The WebSocket endpoint will be available at: `ws://localhost:8080`

---

## Updating the Submodule in Tutorstr

### Option 1: Quick Update (Recommended)

From the **Tutorstr repository root**:

```bash
# Navigate to tutorstr directory
cd /path/to/tutorstr

# Update submodule to latest commit from thr/main
git submodule update --remote relay

# Review changes (optional)
cd relay
git log --oneline -5
cd ..

# Stage the updated submodule reference
git add relay

# Commit the update
git commit -m "chore: update relay submodule to latest version"

# Push to remote
git push origin main
```

### Option 2: Update to Specific Commit

If you want to update to a specific commit instead of the latest:

```bash
cd /path/to/tutorstr/relay

# Checkout specific commit or branch
git fetch origin
git checkout <commit-hash-or-branch-name>

cd ..

# Stage and commit
git add relay
git commit -m "chore: update relay to specific version <commit-hash>"
git push origin main
```

### Option 3: Manual Pull and Update

```bash
# Go to submodule directory
cd /path/to/tutorstr/relay

# Pull latest changes from thr repository
git pull origin main

# Go back to parent directory
cd ..

# Stage and commit
git add relay
git commit -m "chore: update relay submodule"
git push origin main
```

---

## For Relay Developers

### Working in This Repository (thr)

```bash
# Clone the relay repository
git clone https://github.com/tutor-hub-2030/thr.git
cd thr

# Make your changes
# ... edit files in relay/src/ ...

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin main
```

### Then Update Tutorstr

After pushing changes to `thr`, follow **Option 1** above to update the submodule in Tutorstr.

---

## Common Scenarios

### Scenario 1: Daily Development Workflow

1. Make changes in `thr` repository
2. Commit and push to `thr/main`
3. Switch to `tutorstr` repository
4. Run `git submodule update --remote relay`
5. Commit and push the submodule update

### Scenario 2: Testing Changes Locally

Before updating the submodule in Tutorstr, test your relay changes:

```bash
# In thr repository
cd relay
npm install
npm run dev

# Test with a Nostr client or Tutorstr frontend
# Point your frontend to ws://localhost:8080
```

### Scenario 3: Rolling Back to Previous Version

If you need to revert the submodule to a previous state:

```bash
cd /path/to/tutorstr

# View submodule history
git log --follow relay

# Checkout previous commit
git checkout <previous-commit-hash> relay

# Or reset to a specific tag
cd relay
git checkout v1.0.0
cd ..

git add relay
git commit -m "revert: rollback relay to previous version"
git push origin main
```

---

## Troubleshooting

### Issue: Submodule shows as modified but no changes made

```bash
cd /path/to/tutorstr/relay
git status  # Check for uncommitted changes
git checkout .  # Discard local changes if needed
cd ..
git submodule update --init
```

### Issue: Permission denied when pulling

Ensure you have proper access to the `tutor-hub-2030/thr` repository:
- Check your GitHub authentication
- Use SSH keys or Personal Access Token

### Issue: Detached HEAD state in submodule

This is normal for submodules. To work on a branch:

```bash
cd /path/to/tutorstr/relay
git checkout main
git pull origin main
cd ..
git add relay
git commit -m "update relay to latest main"
```

---

## Best Practices

1. **Always test relay changes** before updating the submodule in Tutorstr
2. **Use descriptive commit messages** when updating the submodule
3. **Keep both repositories in sync** by regularly updating the submodule
4. **Document breaking changes** in the relay that might affect the frontend
5. **Use semantic versioning** for major updates (consider using tags)

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `git submodule update --remote relay` | Update to latest thr/main |
| `git submodule init` | Initialize submodule |
| `git submodule update` | Update to committed version |
| `cd relay && git pull` | Pull latest in relay dir |
| `git add relay` | Stage submodule update |

---

## Links

- Relay Repository: https://github.com/tutor-hub-2030/thr
- Tutorstr Repository: https://github.com/chuckis/tutorstr
- Nostr Protocol: https://github.com/nostr-protocol/nostr
