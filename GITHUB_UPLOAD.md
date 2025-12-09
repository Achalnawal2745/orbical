# How to Upload to GitHub 🚀

Follow these steps to put your **Orbit Calendar** on GitHub.

### Prerequisites
- Make sure you have **Git** installed ([Download Git](https://git-scm.com/downloads)).
- Make sure you have a **GitHub Account**.

### Step 1: Create a Repo on GitHub
1. Go to [github.com/new](https://github.com/new).
2. **Repository name**: `orbit-calendar` (or whatever you like).
3. **Description**: "A premium Deep Space calendar extension for Chrome."
4. **Public/Private**: Choose Public.
5. **Initialize this repository**: DO NOT check any boxes (Readme, gitignore, license). We want an empty repo.
6. Click **Create repository**.

### Step 2: Prepare your Local Folder
1. Open your project folder (`e:\auto\cal`) in a terminal (Right-click > Open in Terminal/Git Bash).
2. Run these commands one by one:

```bash
# Initialize Git
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: Orbit Calendar v1.0"

# Rename branch to main
git branch -M main
```

### Step 3: Connect & Push
1. Copy the URL of your new GitHub repo (it looks like `https://github.com/YOUR_USERNAME/orbit-calendar.git`).
2. Run these commands (replace the URL with yours):

```bash
# Add the remote link (Paste YOUR URL below)
git remote add origin https://github.com/YOUR_USERNAME/orbit-calendar.git

# Push to GitHub
git push -u origin main
```

### Success! 🎉
Refresh your GitHub page. You should see all your code and the beautiful README we just created!
