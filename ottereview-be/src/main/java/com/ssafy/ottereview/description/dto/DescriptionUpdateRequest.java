package com.ssafy.ottereview.description.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class DescriptionUpdateRequest {

    private String body;
}