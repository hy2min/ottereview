export class PullRequest {
  constructor(data = {}) {
    this.id = data.id || null;
    this.number = data.number || 0;
    this.title = data.title || "";
    this.description = data.description || "";
    this.author = data.author || null;
    this.reviewers = data.reviewers || [];
    this.assignees = data.assignees || [];
    this.repository = data.repository || null;
    this.sourceBranch = data.sourceBranch || "";
    this.targetBranch = data.targetBranch || "";
    this.status = data.status || "open"; // open, closed, merged
    this.state = data.state || "open"; // open, closed
    this.mergeable = data.mergeable || false;
    this.mergeableState = data.mergeableState || "unknown";
    this.conflicts = data.conflicts || false;
    this.filesChanged = data.filesChanged || 0;
    this.additions = data.additions || 0;
    this.deletions = data.deletions || 0;
    this.comments = data.comments || 0;
    this.reviews = data.reviews || 0;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.mergedAt = data.mergedAt || null;
    this.closedAt = data.closedAt || null;
    this.aiSummary = data.aiSummary || "";
    this.voiceMemos = data.voiceMemos || [];
    this.textMemos = data.textMemos || [];
    this.referenceLinks = data.referenceLinks || [];
    this.priority = data.priority || "medium"; // low, medium, high
    this.conventionCheck = data.conventionCheck || {
      passed: [],
      warnings: [],
      violations: [],
    };
  }

  static fromJSON(json) {
    return new PullRequest(json);
  }

  toJSON() {
    return {
      id: this.id,
      number: this.number,
      title: this.title,
      description: this.description,
      author: this.author,
      reviewers: this.reviewers,
      assignees: this.assignees,
      repository: this.repository,
      sourceBranch: this.sourceBranch,
      targetBranch: this.targetBranch,
      status: this.status,
      state: this.state,
      mergeable: this.mergeable,
      mergeableState: this.mergeableState,
      conflicts: this.conflicts,
      filesChanged: this.filesChanged,
      additions: this.additions,
      deletions: this.deletions,
      comments: this.comments,
      reviews: this.reviews,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      mergedAt: this.mergedAt,
      closedAt: this.closedAt,
      aiSummary: this.aiSummary,
      voiceMemos: this.voiceMemos,
      textMemos: this.textMemos,
      referenceLinks: this.referenceLinks,
      priority: this.priority,
      conventionCheck: this.conventionCheck,
    };
  }

  get isApproved() {
    return this.reviews > 0 && this.status === "approved";
  }

  get isWaitingForReview() {
    return this.status === "open" && this.reviews === 0;
  }

  get isUnderReview() {
    return this.status === "open" && this.reviews > 0;
  }

  get isReadyToMerge() {
    return this.mergeable && this.isApproved && !this.conflicts;
  }
}
