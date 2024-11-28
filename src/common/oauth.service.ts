import { OAuth2Client } from "google-auth-library";
import { AuthRepository } from "@/module/auth/auth.repository";
import { generateJWT } from "@/helpers/jwt.helper";

interface OAuthServiceDependencies {
  authRepository: AuthRepository;
  clientId: string;
}

export class OAuthService {
  private client: OAuth2Client;
  private authRepository: AuthRepository;

  constructor(private readonly deps: OAuthServiceDependencies) {
    this.client = new OAuth2Client(deps.clientId);
    this.authRepository = deps.authRepository;
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.deps.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Invalid token payload");

      return {
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
      };
    } catch (error) {
      throw new Error("Failed to verify Google token");
    }
  }

  async authenticateWithGoogle(idToken: string, role: "learner" | "tutor") {
    const userData = await this.verifyGoogleToken(idToken);

    // Check if user exists
    let user = await this.authRepository.findUserByEmail(userData.email);

    if (!user) {
      // Register new user
      const result = await this.authRepository.registerUser({
        email: userData.email,
        name: userData.name,
        password: "", // No password for OAuth users
        role: role,
      });

      user = {
        id: result.id,
        role: role,
      };
    }

    const token = generateJWT({
      id: user!.id,
      role: user!.role,
    });

    return {
      token,
      user: {
        id: user!.id,
        role: user!.role,
      },
    };
  }
}
