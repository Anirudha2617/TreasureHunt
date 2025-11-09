import { join } from "path";

export interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string;
  dob?:string;  //yymmdd
}

export interface Present {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video';
  content: string;
  image: string;
  title: string;
  levelId: string;
  audio: string;
  video: string;
}

export interface QuestionStatus {
  completed: boolean;  // Question is fully completed & approved
  pending: boolean;    // Question is under review
}

export interface Mail {
  id: number;
  subject: string;
  message_text?: string;
  image_url?: string;
  message?: Record<string, any>;
}

export interface Review {
  id: number;
  user: User;
  question: string;
  answer_text?: string;
  answer_image_url?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string;
  reviewer_id?: number | null;
}


export interface Question {
  id: string;
  levelId: string;
  question: string;
  questionImage?: string;
  status: QuestionStatus; // <-- updated field
  attempts: number;
  maxAttempts?: number;
  isCompleted: boolean;
  type: string;
  hint_mail?: Mail[];
  answers?: { id: number; text: string }[];
}

export interface Level {
  id: string;
  name: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  questions: Question[];
  present?: Present;
  title?: string;
  quest?: string;
}

export interface UserProgress {
  id : number;
  user_id: string;
  completedLevels: string[];
  collectedPresents: Present[];
  totalAttempts: number;
  unlocked_levels: string[];

}
// export interface UserProgress {
//   id: number;
//   user_id: number;
//   completed_levels: string[];
//   unlocked_levels: string[];
//   collected_presents: string[];
//   total_attempts: number;
// }

export interface Mystery {
  id: number;
  name: string;
  description: string;
  created_by: string;
  starts_at: string;
  ends_at: string;
  image: string;
  is_active: boolean;
  home_page: string;
  join_status: boolean;
  participants: User[];

}

export interface MysteryDetail extends Mystery {
  levels: Level[];
  user_reviews: Review[];
  user_progress: UserProgress[];
}
// ================================
// AUTHENTICATION API
// ================================


const BASE_URL = import.meta.env.VITE_LOCAL_URL || 'https://treasure-hunt-1-90ry.onrender.com';

export const authAPI = {
  /**
   * Login user with credentials
   */
  login: async (username: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    try {
      console.log("Attempting to login with username:", username , "at URL:", BASE_URL);
      const response = await fetch(`${BASE_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      console.log("Login response data:", data);

      // ✅ **Updated to use BASE_URL variable**
      const user_response = await fetch(`${BASE_URL}/api/user/profile/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.access}`, // 🔑 Important
        },
      });

      if (!user_response.ok) {
        // Handle unauthorized or other errors
        const errorData = await user_response.json();
        throw new Error(`Error ${user_response.status}: ${errorData.detail || "Unknown error"}`);
      }

      // Parse and return user data
      const user_data: User = await user_response.json();
      
      // We are returning both user and a token.
      // The API returns access and refresh tokens. We will use the access token.
      return { user: user_data, token: data.access, refreshToken: data.refresh };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },


  signup: async (username: string, email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    const [firstName, lastName] = username.split(" ");

    const response = await fetch(`${BASE_URL}/api/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        password2: password,
        email,
        first_name: firstName,
        last_name: lastName || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    const data = await response.json();
    return { user: data.user, token: data.access, refreshToken: data.refresh };
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token || !refreshToken) {
      console.warn("No tokens found, skipping server logout.");
      return;
    }

    const response = await fetch(`${BASE_URL}/api/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Logout failed:", errorData);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  },

  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<{ user: User; token: string; refreshToken: string }> => {
    return await authAPI.signup(username, email, password);
  },

  /**
   * Get current user (with optional token)
   */
  getCurrentUser: async (token?: string): Promise<User | null> => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return null;

    const user_response = await fetch(`${BASE_URL}/api/user/profile/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!user_response.ok) {
      let errorData: any = {};
      try {
        errorData = await user_response.json();
      } catch (_) { }
      throw new Error(`Error ${user_response.status}: ${errorData["detail"] || "Unknown error"}`);
    }

    const user_data: User = await user_response.json();
    return user_data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await fetch(`${BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!response.ok) throw new Error("Failed to refresh token");
    return response.json();
  },

};


// ================================
// GAME API
// ================================

export const gameAPI = {
  getLevels: async (mystery_id): Promise<Level[]> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/game/levels/${mystery_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch levels");
    console.log("Fetched levels:", await res.clone().json());
    return res.json();
  },

  getLevel: async (levelId: string): Promise<Level> => {
    const token = localStorage.getItem("token");
    const numericLevelId = levelId.split("-")[1];
    const res = await fetch(`${BASE_URL}/game/levels/${numericLevelId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch level ${levelId}`);
    console.log(`Fetched level ${levelId}:`, await res.clone().json());
    return res.json();
  },

  getUserProgress: async (mysteryId): Promise<UserProgress> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/game/user/progress/${mysteryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user progress");
    console.log("Fetched user progress:", await res.clone().json());
    return res.json();
  },
  
  submitAnswer: async (questionId: string, answer: string | File): Promise<any> => {
    const token = localStorage.getItem("token");

    let body: BodyInit;
    let headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    if (answer instanceof File) {
      // Image answer
      const formData = new FormData();
      formData.append("answer_image", answer);
      body = formData;
      console.log("[Frontend] Submitting IMAGE answer →", answer.name);
    } else {
      // Text answer
      body = JSON.stringify({ answer });
      headers["Content-Type"] = "application/json";
      console.log("[Frontend] Submitting TEXT answer →", answer);
    }

    console.log("[Frontend] Request URL:", `${BASE_URL}/game/question/${questionId}/submit/`);
    console.log("[Frontend] Request Headers:", headers);
    console.log("[Frontend] Request Body (raw):", body);

    const res = await fetch(`${BASE_URL}/game/question/${questionId}/submit/`, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      let errorText;
      try {
        errorText = await res.json();
      } catch {
        errorText = await res.text();
      }
      console.error("[Frontend] Error Response:", errorText);
      throw new Error(errorText.detail || "Failed to submit answer");
    }

    const json = await res.json();
    console.log("[Frontend] Response JSON:", json);
    return json;
  },

  getCollectedPresents: async (): Promise<Present[]> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/game/user/presents/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch collected presents");
    console.log("Fetched collected presents:", await res.clone().json());
    return res.json();
  }




};

// ================================
// API CONFIGURATION
// ================================

export const API_CONFIG = {
  // Backend base URL (when implementing real backend)
  // BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000/api',

  // API endpoints (for reference when implementing backend)
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      SIGNUP: '/auth/signup',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh'
    },
    GAME: {
      LEVELS: '/game/levels',
      LEVEL_DETAIL: '/game/levels/:id',
      SUBMIT_ANSWER: '/game/submit-answer',
      USER_PROGRESS: '/user/progress/:mystery_id',
      COLLECTED_PRESENTS: '/user/presents'
    }
  },

  // Request timeout
  TIMEOUT: 10000,

  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};


// ================================
// SECURE IMAGE API
// ================================
export const imageAPI = {
  getSecureImage: async (imageId: string, token: string): Promise<Blob> => {
    if (!token || token.trim() === "") {
      token = localStorage.getItem("token") || "";
    }
    const response = await fetch(`${BASE_URL}/game/image/${imageId}/`, {
      method: "GET",
      headers: { 
        "content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    return await response.blob(); // just return blob
  },
};


export const getHint = {
  getHintt: async (questionId: string, token: string ) => {
    const response = await fetch(`${BASE_URL}/game/question/${questionId}/hint/`, {
      method: "POST", // ✅ Use POST
      headers: {
        "Content-Type": "application/json", // ✅ Required when sending JSON
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hint: ${response.statusText}`);
    }

    return await response.json(); // ✅ Parse response as JSON
  },
};

export const mysteryAPI = {
  getMysteries: async (token: string, joined: "true" | "false" = "false"): Promise<Mystery[]> => {
    const url = new URL(`${BASE_URL}/game/mysteries/`);
    url.searchParams.append("joined", joined);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

    });
    if (!response.ok){
      throw new Error(`Failed to fetch mysteries: ${response.statusText}`);
    }
    return await response.json();
  } , 

  joinMystery: async (mysteryId: number, pin: string, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${BASE_URL}/game/mysteries/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mystery_id: mysteryId, pin }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Throw message so toast can display it
      throw new Error(data.message || "Failed to join mystery");
    }

    return data; // contains { "message": "Successfully joined..." }
  },
}


export const selfMysteries = {
  getSelfMysteries: async (token: string): Promise<Mystery[]> => {
    const response = await fetch(`${BASE_URL}/game/mysteries/self/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok){
      throw new Error(`Failed to fetch self mysteries: ${response.statusText}`);
    }
    console.log("Self Mysteries Response:", await response.clone().json());
    return await response.json();
  } ,

  getMysteryById: async (mysteryId: number, token: string): Promise<MysteryDetail> => {
    const response = await fetch(`${BASE_URL}/game/mysteries/self/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mystery_id: mysteryId }),
    });
    if (!response.ok){
      throw new Error(`Failed to fetch self mystery by ID: ${response.statusText}`);
    }
    return await response.json();
  } ,
  
}