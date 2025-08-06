package com.ssafy.ottereview.review.entity;

public enum ReviewState {
    COMMENT("comment"),
    APPROVE("approve"),
    REQUEST_CHANGES("request_changes");

    private final String value;

    ReviewState(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ReviewState fromValue(String value) {
        return switch (value) {
            case "comment" -> COMMENT;
            case "approve" -> APPROVE;
            case "changes_requested" -> REQUEST_CHANGES;
            default -> throw new IllegalArgumentException("Unknown ReviewState value: " + value);
        };
    }
}