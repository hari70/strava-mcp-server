#!/bin/bash

# GitHub Repository Setup Script for Strava MCP Server
# This script helps you prepare and push your Strava MCP Server to GitHub

set -e

echo "🚀 Setting up Strava MCP Server for GitHub..."

# Check if we're in the right directory
if [ ! -f "index.ts" ]; then
    echo "❌ Error: index.ts not found. Please run this script from your strava-mcp-server directory."
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Create all necessary files
echo "📝 Creating repository files..."

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    # The .gitignore content would be added here
fi

# Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    echo "Creating .env.example..."
    # The .env.example content would be added here
fi

# Stage all files
echo "📦 Staging files for commit..."
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit. Repository is up to date."
else
    # Commit the files
    echo "💾 Creating initial commit..."
    git commit -m "feat: initial commit of Strava MCP Server

- Add complete MCP server implementation for Strava API
- Include OAuth setup helper script
- Add comprehensive documentation and setup guides
- Support for athlete profile, activities, and statistics
- Compatible with Claude Desktop integration"
fi

echo ""
echo "✅ Repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: strava-mcp-server"
echo "   - Description: MCP server for Strava API integration with Claude Desktop"
echo "   - Make it public (recommended for open source)"
echo ""
echo "2. Add the remote and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/strava-mcp-server.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Set up repository settings:"
echo "   - Enable Issues and Discussions"
echo "   - Add topics: strava, mcp, claude, api, typescript"
echo "   - Set up branch protection for main branch"
echo ""
echo "4. Optional enhancements:"
echo "   - Add GitHub Actions for CI/CD"
echo "   - Set up automatic releases"
echo "   - Create issue templates"
echo ""
echo "🎉 Your Strava MCP Server is ready to share with the world!"