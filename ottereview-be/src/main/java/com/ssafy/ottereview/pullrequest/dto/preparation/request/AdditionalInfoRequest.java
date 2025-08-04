package com.ssafy.ottereview.pullrequest.dto.preparation.request;

import com.ssafy.ottereview.pullrequest.dto.preparation.DescriptionInfo;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdditionalInfoRequest {
    
    private String source;
    private String target;
    private List<Long> reviewers;
    private String summary;
    private List<DescriptionInfo> description;
    private String title;
    private String body;
}
