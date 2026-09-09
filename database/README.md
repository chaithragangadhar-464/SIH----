# Database

Problem2Impact uses MongoDB with Mongoose. The application does not require
any seed data to run — every collection starts empty and the API returns
empty arrays/appropriate empty states until real users create real records.

## Optional seeding

seed/seed.js is provided only as an optional convenience for local
development. It does not insert fake problems, solutions, votes, ratings,
or statistics.

If seed admin environment variables are not set, the script creates nothing.
