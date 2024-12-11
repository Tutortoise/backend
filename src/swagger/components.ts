export const components = {
  schemas: {
    // auth schemas
    RegisterSchema: {
      $name: "David Gacoan",
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
      phoneNumber: "6281234567890",
      city: "Samarinda",
      district: "Samarinda Utara",
      gender: "male/female",
    },
    UpdateTutorProfileSchema: {
      name: "Dony Gacoan",
      email: "example@bangkit.academy",
      phoneNumber: "081234567890",
      city: "Samarinda",
      district: "Samarinda Utara",
      gender: "male/female",
      availability: {
        1: ["07:00", "08:00"],
        3: ["08:00", "09:00"],
        6: ["10:00", "13:00"],
      },
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
      message: "lorem ipsum dolor sit amet, consectetur adipiscing elit",
    },
    CreateTutoriesSchema: {
      $categoryId: "categoryId",
      $aboutYou: "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $techingMethodology:
        "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $hourlyRate: 50000,
      typeLesson: "online/offline/both",
    },
    UpdateTutoriesSchema: {
      $aboutYou: "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $techingMethodology:
        "lorem ipsum dolor sit amet, consectetur adipiscing elit",
      $hourlyRate: 70000,
      typeLesson: "online/offline/both",
    },
    GetNotificationsSchema: {
      query: {
        limit: "20",
        before: "2024-01-01T00:00:00Z",
      },
    },
    MarkNotificationReadSchema: {
      params: {
        notificationId: "uuid",
      },
    },
  },
};
