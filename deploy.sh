#!/bin/bash

# Deploy Script for ListenInk
# ============================

set -e

REMOTE=ubuntu@listenink.app
REMOTEHOOK=/opt/Listenink/server-deploy.hook

# Save the directory where the script was called from
ORIGINAL_DIR=$(pwd)

# Change to the directory to where the script resides
cd "$(dirname "$0")"

# Step 1: Fetch latest updates from origin
echo "Fetching latest updates from origin..."
git fetch origin main

# Step 2: Check if local main is up to date
LOCAL_COMMIT=$(git rev-parse main)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
  echo "Warning: Local main is not up to date with origin/main."
  echo "Local:  $LOCAL_COMMIT"
  echo "Remote: $REMOTE_COMMIT"
  echo "Please pull the latest changes before deploying."
  # Return to the original directory before exiting
  cd "$ORIGINAL_DIR"
  exit 1
fi

# Step 3: Deploy the changes
echo "Deploying to production server..."
ssh $REMOTE -C $REMOTEHOOk
echo "Deployment completed."

# Return to original directory
cd "$ORIGINAL_DIR"
