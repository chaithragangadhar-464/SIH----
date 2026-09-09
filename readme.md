SIH-Problem2Impact/
│
├── frontend/
│   │
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── problems.html
│   ├── problem-details.html
│   ├── post-problem.html
│   ├── solutions.html
│   ├── solution-details.html
│   ├── profile.html
│   ├── team.html
│   ├── notifications.html
│   ├── leaderboard.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── problems.css
│   │   ├── problem-details.css
│   │   ├── solutions.css
│   │   ├── profile.css
│   │   ├── team.css
│   │   └── responsive.css
│   │
│   ├── js/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── register.js
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── problems.js
│   │   ├── problem-details.js
│   │   ├── post-problem.js
│   │   ├── solutions.js
│   │   ├── solution-details.js
│   │   ├── profile.js
│   │   ├── team.js
│   │   ├── notifications.js
│   │   ├── leaderboard.js
│   │   └── api.js
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
│
├── backend/
│   │
│   ├── server.js
│   ├── package.json
│   ├── .env
│   │
│   ├── config/
│   │   ├── db.js
│   │   └── ai.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Problem.js
│   │   ├── Solution.js
│   │   ├── Team.js
│   │   ├── Comment.js
│   │   ├── Vote.js
│   │   ├── Certification.js
│   │   ├── Rating.js
│   │   └── Notification.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── problemRoutes.js
│   │   ├── solutionRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── voteRoutes.js
│   │   ├── ratingRoutes.js
│   │   ├── certificationRoutes.js
│   │   └── notificationRoutes.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── problemController.js
│   │   ├── solutionController.js
│   │   ├── teamController.js
│   │   ├── commentController.js
│   │   ├── voteController.js
│   │   ├── ratingController.js
│   │   ├── certificationController.js
│   │   └── notificationController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   ├── duplicateDetection.js
│   │   ├── notificationService.js
│   │   └── certificateService.js
│   │
│   └── utils/
│       ├── generateToken.js
│       ├── priorityScore.js
│       └── validators.js
│
│
├── ai-service/
│   │
│   ├── app.py
│   ├── requirements.txt
│   │
│   ├── models/
│   │   ├── sector_classifier.py
│   │   └── similarity_model.py
│   │
│   ├── routes/
│   │   ├── classify.py
│   │   └── duplicate.py
│   │
│   └── utils/
│       └── text_processing.py
│
│
├── database/
│   ├── schema/
│   │   ├── users.sql
│   │   ├── problems.sql
│   │   ├── solutions.sql
│   │   └── relationships.sql
│   │
│   └── seed/
│       └── demo-data.js
│
│
├── uploads/
│   ├── certifications/
│   ├── problem-evidence/
│   └── solution-files/
│
├── .gitignore
└── README.md
