# GitHub Secrets Configuration

Required secrets for CI/CD pipeline in GitHub Actions.

## 📝 How to Add Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

---

## 🔐 Required Secrets

### Production Deployment

```
PRODUCTION_HOST
Value: IP address or hostname of production server
Example: 123.45.67.89 or casa-ignat.ro
```

```
PRODUCTION_USER
Value: SSH username for deployment
Example: casa-ignat or deploy
```

```
SSH_PRIVATE_KEY
Value: Private SSH key for server access
Generate with: ssh-keygen -t ed25519 -C "deploy@casa-ignat"
Copy: cat ~/.ssh/id_ed25519
```

```
SSH_PORT
Value: SSH port (optional, default: 22)
Example: 22
```

### Staging Deployment (Optional)

```
STAGING_HOST
Value: IP address or hostname of staging server
Example: staging.casa-ignat.ro
```

```
STAGING_USER
Value: SSH username for staging deployment
Example: deploy
```

### Container Registry

```
GITHUB_TOKEN
Value: Automatically provided by GitHub Actions
Note: No need to create manually
```

### Notifications (Optional)

```
SLACK_WEBHOOK
Value: Slack webhook URL for deployment notifications
Example: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
Get from: https://api.slack.com/messaging/webhooks
```

---

## 🌍 Environment Variables

These should be configured on the production server in `.env` file.

### Critical Variables

1. **SESSION_SECRET** - Generate with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **MONGODB_PASSWORD** - Strong password for MongoDB
   ```bash
   openssl rand -base64 32
   ```

3. **REDIS_PASSWORD** - Strong password for Redis
   ```bash
   openssl rand -base64 32
   ```

4. **CSRF_SECRET** - Generate with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

### SMTP Configuration

For Gmail:
1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password as `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx (app password)
```

---

## 📋 Setup Checklist

### On GitHub

- [ ] Add `PRODUCTION_HOST` secret
- [ ] Add `PRODUCTION_USER` secret
- [ ] Add `SSH_PRIVATE_KEY` secret
- [ ] Add `SLACK_WEBHOOK` secret (optional)
- [ ] Enable GitHub Actions in repository settings
- [ ] Configure branch protection rules for `main`

### On Production Server

- [ ] Create deployment user: `sudo adduser casa-ignat`
- [ ] Add SSH public key to `~/.ssh/authorized_keys`
- [ ] Add user to docker group: `sudo usermod -aG docker casa-ignat`
- [ ] Clone repository to `/var/www/casa-ignat-nodejs`
- [ ] Create `.env` file from `.env.example`
- [ ] Generate all secrets and passwords
- [ ] Configure SMTP settings
- [ ] Obtain SSL certificate with certbot
- [ ] Test SSH connection from GitHub Actions

---

## 🧪 Testing

### Test SSH Connection

From your local machine:
```bash
ssh -i ~/.ssh/id_ed25519 casa-ignat@your-server-ip
```

### Test Deployment

1. Create a test branch
2. Push to GitHub
3. Check Actions tab for workflow run
4. Verify logs for any errors

### Manual Deployment Test

```bash
ssh casa-ignat@your-server-ip
cd /var/www/casa-ignat-nodejs
git pull origin main
docker-compose --profile production up -d --build
docker-compose ps
```

---

## 🔒 Security Best Practices

1. **Never commit secrets** to repository
2. **Rotate secrets** regularly (every 90 days)
3. **Use different passwords** for each service
4. **Enable 2FA** on all accounts
5. **Limit SSH access** to specific IPs if possible
6. **Monitor logs** for suspicious activity
7. **Keep backups** of all secrets in secure password manager

---

## 📚 Additional Resources

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [SSH Key Generation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Last Updated:** 2025-01-18
