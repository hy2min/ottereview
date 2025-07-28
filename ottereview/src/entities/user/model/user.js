export class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || "";
    this.name = data.name || "";
    this.email = data.email || "";
    this.avatar = data.avatar || "";
    this.role = data.role || "developer";
    this.skills = data.skills || [];
    this.isOnline = data.isOnline || false;
    this.lastActive = data.lastActive || null;
  }

  static fromJSON(json) {
    return new User(json);
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      email: this.email,
      avatar: this.avatar,
      role: this.role,
      skills: this.skills,
      isOnline: this.isOnline,
      lastActive: this.lastActive,
    };
  }
}
