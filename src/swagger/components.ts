export const components = {
  schemas: {
    // auth schemas
    RegisterSchema: {
      $email: "example@mail.com",
      $password: "password",
      $role: "learner/tutor",
    },
    LoginSchema: {
      $email: "example@mail.com",
      $password: "password",
    },
    OAuthSchema: {
      $idToken: "googleidtoken",
      $role: "learner/tutor",
    },
    FCMTokenSchema: {
      $token: "fcmtoken",
    },
    // chat schemas
    CreateRoomSchema: {
      $learnerId: "learnerid",
      $tutorId: "tutorid",
    },
    SendTextMessageSchema: {
      $content: "lorem ipsum dolor sit amet",
    },
    SetIsTypingSchema: {
      $isTyping: true,
    },
    // learner schemas
    UpdateLearnerProfileSchema: {
      name: "David Gacoan",
      email: "example@bangkit.academy",
      phoneNumber: "081234567890",
      city: "Samarinda",
      district: "Samarinda Utara",
      gender: "male/female",
      interests: ["subjectId", "subjectId"],
      learningStyle: "visual/auditory/kinesthetic",
    },
    UpdateTutorProfileSchema: {
      name: "Dony Gacoan",
      email: "example@bangkit.academy",
      phoneNumber: "081234567890",
      city: "Samarinda",
      district: "Samarinda Utara",
      gender: "male/female",
    },
    ChangePasswordSchema: {
      $currentPassword: "oldpassword",
      $newPassword: "newpassword",
      $confirmPassword: "newpassword",
    },
    CreateOrderSchema: {
      $tutoriesId: "tutoriesId",
      $sessionTime: "2024-11-29T15:00:00.008Z",
      $totalHours: 2,
      notes: "lorem ipsum dolor sit amet, consectetur adipiscing elit",
    },
    CreateReviewSchema: {
      $rating: 5,
      review: "lorem ipsum dolor sit amet, consectetur adipiscing elit",
    },
    CreateTutoriesSchema: {
      $subjectId: "subjectId",
      $aboutYou: "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $techingMethodology:
        "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $hourlyRate: 50000,
      typeLesson: "online/offline/both",
      $availability: {
        1: ["07:00", "08:00"],
        3: ["08:00", "09:00"],
        6: ["10:00", "13:00"],
      },
    },
    UpdateTutoriesSchema: {
      $aboutYou: "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $techingMethodology:
        "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $hourlyRate: 70000,
      typeLesson: "online/offline/both",
      $availability: {
        2: ["07:00", "08:00"],
        5: ["08:00", "09:00"],
        7: ["10:00", "13:00"],
      },
    },
  },
};
