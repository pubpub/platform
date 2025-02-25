# Self-host documentation

For the most part, self-hosting PubPub is a matter of deploying the app and the database, which you can do with the accompanying docker-compose file in `self-host/docker-compose.yml`.

However, there are a few key things you need to know about.

## Files

The hosted version of Platfrom uses AWS S3 to host files. When self-hosting, you have two options:

1. Provide your own S3/S3-compatible storage service credentials
2. Use the built-in MinIO service, which emulates S3 locally.

### Using your own S3-compatible storage service

If you want to use your own S3-compatible storage service, you will need to set the following environment variables:

```sh
ASSETS_BUCKET_NAME="your-bucket-name"
ASSETS_UPLOAD_KEY="your-access-key"
ASSETS_UPLOAD_SECRET_KEY="your-secret-key"
ASSETS_REGION="your-region"
ASSETS_STORAGE_ENDPOINT="your-storage-endpoint" # only necessary if you are using non-AWS S3-compatible storage service
```

You should also remove the `minio` and `minio-init` services from the `docker-compose.yml` file.

### Using the built-in MinIO service

If you want to use the built-in MinIO service, you will need to set the following environment variables:

```sh
ASSETS_BUCKET_NAME="your-bucket-name" # these values will be set once you start up the MinIO service, making it hard to change later!
ASSETS_UPLOAD_KEY="your-access-key"
ASSETS_UPLOAD_SECRET_KEY="your-secret-key"
ASSETS_REGION="your-region"
ASSETS_STORAGE_ENDPOINT="localhost:9000" # this is the default value but you ideally should set this up more nicely using our nginx service
```

Then, after running `docker compose up -d`, you should be able to visit the MinIO console at `http://localhost:9001`.

## Email

To be able to send emails, you need to set some kind of email provider.

We recommend using [Mailgun](https://www.mailgun.com/).

Other common options are [SendGrid](https://sendgrid.com/) and [Postmark](https://postmarkapp.com/).

You can also use an existing GMail or Office365 account to relay emails through PubPub.
Other providers may likely work as well, but are not tested.

### Setup

#### Mailgun

To use Mailgun, you will need to create an account on [Mailgun](https://www.mailgun.com/) and set the following environment variables:

```sh
MAILGUN_SMTP_HOST="smtp.mailgun.org"
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_USERNAME="postmaster@your-mailgun-domain.mailgun.org"
MAILGUN_SMTP_PASSWORD="your-mailgun-password"
MAILGUN_SMTP_FROM="email@your-mailgun-domain.mailgun.org"
MAILGUN_SMTP_FROM_NAME="Your Organization"
```

#### Gmail

To use Gmail to relay emails through PubPub, you will need to create an [app password](https://support.google.com/accounts/answer/185833?hl=en).

You will be limited to 2000 emails per day by default this way.

```sh
MAILGUN_SMTP_HOST="smtp.gmail.com"
MAILGUN_SMTP_PORT=587 # or 465 for SSL
MAILGUN_SMTP_USERNAME="email@gmail.com"
MAILGUN_SMTP_PASSWORD="your app password" # this will be a 16 character string
MAILGUN_SMTP_FROM="email@gmail.com" # technically optional, but you will almost definitely need to set this.
MAILGUN_SMTP_FROM_NAME="Your Organization" # Optional, will default to "PubPub Team"
```

If you need a higher limit of 10,000 emails, you can use the SMTP relay service. This will require extra configuration however:
https://support.google.com/a/answer/176600?hl=en

```sh
MAILGUN_SMTP_HOST="smtp-relay.gmail.com"
MAILGUN_SMTP_PORT=587 # or 465 for SSL
MAILGUN_SMTP_USERNAME="email@gmail.com"
MAILGUN_SMTP_PASSWORD="your app password" # this will be a 16 character string
MAILGUN_SMTP_FROM="email@gmail.com" # technically optional, but you will almost definitely need to set this.
MAILGUN_SMTP_FROM_NAME="Your Organization" # Optional, will default to "PubPub Team"
```

#### Office 365

You can (for now) send emails through Office 365 Outlook/Exchange through SMTP, although Microsoft has repeatedly stated they will likely deprecate this feature in the future.

You cannot send emails through shared mailboxes, you will need to an existing Microsoft account with a valid Office 365 subscription.

```sh
MAILGUN_SMTP_HOST="smtp.office365.com"
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_USERNAME="email@outlook.com"
MAILGUN_SMTP_PASSWORD="your-password"
MAILGUN_SMTP_FROM="email@outlook.com" # technically optional, but you will almost definitely need to set this, as it will use `hello@pubpub.org` by default.
MAILGUN_SMTP_FROM_NAME="Your Organization" # Optional, will default to "PubPub Team"
```

#### No email

You can technically leave the email provider blank, but this will disable the email functionality. The email action will still be visible in the UI, but it will fail when you try to send an email.
