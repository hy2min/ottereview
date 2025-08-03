package com.ssafy.ottereview.pullrequest.dto.preparation.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PreparationValidationRequest {
    
    private String source;
    private String target;
    
}
