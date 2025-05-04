# Outdoor Run Tracker

A mobile-friendly, full-stack web application that lets users track, store, and review their outdoor runs and walks in real time.
Live Demo: https://d3g0859dn1p56x.cloudfront.net/

## What the Project Does

* Uses your browser’s geolocation API to capture your position at regular intervals during a run or walk.
* Stores time-stamped location points in AWS DynamoDB under your authenticated user account.
* Calculates and displays key metrics: total distance, elapsed time, average speed, and top speed.
* Maintains a history of past runs, letting you browse and view detailed summaries for each session.

## Why it's Useful

* **Cross-platform:** No installation required—runs in any modern browser on desktop or mobile.
* **Privacy-focused:** You control your data through secure AWS Cognito authentication and can delete runs at any time (working on this second part).
* **Lightweight analytics:** Provides just the essential run statistics.
* **Extensible:** Built on AWS managed services (Cognito, DynamoDB, Elastic Beanstalk, S3/CloudFront), it scales automatically with usage.

## Getting Started

1. **Clone the Repo**
```console
git clone https://github.com/your-username/outdoor-run-tracker.git
cd outdoor-run-tracker
```

2. **Configure environment variables**
* Create a .env file in the server/ directory with:
```console
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
AWS_REGION=us-east-2
LOCATION_TABLE=UserLocationData
COGNITO_USER_POOL_ID=us-east-2_XXXXXXXXX
COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXX
```

3. **Deploy the backend**
```console
cd server
eb init                          # initialize EB app
eb create                        # create new environment
eb deploy                        # deploy your Express API
```

4. **Build and publish the frontend**
```console
cd ../client
npm install
npm run build
aws s3 sync build/ s3://your-s3-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

5. **Visit the app**
Open your browser to the CloudFront URL to sign up and start tracking your runs!
