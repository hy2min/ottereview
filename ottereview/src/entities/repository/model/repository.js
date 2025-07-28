export class Repository {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || "";
    this.fullName = data.fullName || "";
    this.description = data.description || "";
    this.private = data.private || false;
    this.owner = data.owner || null;
    this.defaultBranch = data.defaultBranch || "main";
    this.language = data.language || "";
    this.topics = data.topics || [];
    this.stargazersCount = data.stargazersCount || 0;
    this.forksCount = data.forksCount || 0;
    this.openIssuesCount = data.openIssuesCount || 0;
    this.updatedAt = data.updatedAt || null;
    this.convention = data.convention || null;
  }

  static fromJSON(json) {
    return new Repository(json);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      fullName: this.fullName,
      description: this.description,
      private: this.private,
      owner: this.owner,
      defaultBranch: this.defaultBranch,
      language: this.language,
      topics: this.topics,
      stargazersCount: this.stargazersCount,
      forksCount: this.forksCount,
      openIssuesCount: this.openIssuesCount,
      updatedAt: this.updatedAt,
      convention: this.convention,
    };
  }
}
