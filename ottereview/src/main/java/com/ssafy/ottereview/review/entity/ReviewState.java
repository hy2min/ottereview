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
        for (ReviewState state : ReviewState.values()) {
            if (state.value.equals(value)) {
                return state;
            }
        }
        throw new IllegalArgumentException("Unknown review state: " + value);
    }
}