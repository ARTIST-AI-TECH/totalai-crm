#!/bin/bash
# TOTFL Worktree Setup Script
# Creates separate working directories for parallel development

set -e  # Exit on error

REPO_ROOT="/Users/adjidiortraore/Code/top-of-the-flow-dev"
WORKTREE_BASE="/Users/adjidiortraore/Code/totfl-worktrees"

echo "🌳 Setting up TOTFL worktrees for parallel development..."
echo ""

# Ensure we're in the repo
cd "$REPO_ROOT"

# Ensure we're on develop branch
echo "📍 Checking out develop branch..."
git checkout develop
git pull origin develop

# Create worktree base directory
echo "📁 Creating worktree base directory..."
mkdir -p "$WORKTREE_BASE"

# Define all feature branches
declare -a FEATURES=(
  "dashboard-components:ui"
  "coach-ui:ui"
  "questions-ui:ui"
  "documents-ui:ui"
  "pitch-practice:ui-killer"
  "journey-timeline:ui"
  "settings-ui:ui"
  "ask-ui:ui"
  "project-wizard:ui"
  "layout-merge:ui"
  "theme-consistency:ui"
  "database-schema:backend-critical"
  "n8n-integration:backend"
  "openai-realtime:backend"
  "gemini-kb:backend"
  "auth-wiring:backend-critical"
  "stripe-premium:backend"
  "voice-quota:backend"
)

echo ""
echo "Creating ${#FEATURES[@]} worktrees..."
echo ""

# Create each worktree
for feature_info in "${FEATURES[@]}"; do
  IFS=':' read -r feature_name feature_type <<< "$feature_info"

  branch_name="feature/$feature_name"
  worktree_dir="$WORKTREE_BASE/totfl-$feature_name"

  echo "🌱 Creating: $branch_name"
  echo "   Directory: $worktree_dir"

  # Create branch from develop
  git branch "$branch_name" develop 2>/dev/null || echo "   Branch already exists"

  # Create worktree
  if [ -d "$worktree_dir" ]; then
    echo "   ⚠️  Worktree directory already exists, skipping..."
  else
    git worktree add "$worktree_dir" "$branch_name"
    echo "   ✅ Worktree created"
  fi

  echo ""
done

echo "✅ Worktree setup complete!"
echo ""
echo "📋 Summary:"
echo "   Base directory: $WORKTREE_BASE"
echo "   Worktrees created: ${#FEATURES[@]}"
echo ""
echo "🎯 Usage:"
echo "   1. Open each worktree in separate Claude Code session:"
echo "      claude code $WORKTREE_BASE/totfl-dashboard-components"
echo "      claude code $WORKTREE_BASE/totfl-coach-ui"
echo "      # ... etc"
echo ""
echo "   2. Each session works independently on its feature"
echo ""
echo "   3. When done, create PR from feature branch to develop:"
echo "      cd $WORKTREE_BASE/totfl-dashboard-components"
echo "      git push -u origin feature/dashboard-components"
echo "      gh pr create --base develop --title \"feat(ui): add dashboard components\""
echo ""
echo "   4. After all PRs merged to develop, deploy from main"
echo ""
echo "📊 List all worktrees:"
echo "   git worktree list"
echo ""
echo "🧹 Remove worktrees when done:"
echo "   git worktree remove $WORKTREE_BASE/totfl-dashboard-components"
echo "   git branch -d feature/dashboard-components"
echo ""
